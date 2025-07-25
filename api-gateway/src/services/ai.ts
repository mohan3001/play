import { spawn } from 'child_process'
import { logger } from '../utils/logger'
import path from 'path'
import { GitAutomationService, extractRepoMetadata } from '../../../shared/GitAutomationService';
import { getLinkedRepo } from '../utils/repoUtils';
import { getChatHistory, storeChatMessage, queryEmbeddings } from '../utils/chromadb';
import { TestExecutionService } from './testExecution';

const testExecutionService = new TestExecutionService();

// Action handlers
async function handleAIAction(actionObj: any, repo: any, userId: string): Promise<string> {
  switch (actionObj.action) {
    case 'code_generation':
      // Generate code using AI, write to file, commit, branch, PR
      // Placeholder: just echo the request
      return `Code generation requested for: ${JSON.stringify(actionObj.parameters)}`;
    case 'create_branch': {
      const git = new GitAutomationService(repo.localPath);
      const branchName = actionObj.target || actionObj.parameters?.branchName;
      if (!branchName) return 'No branch name specified.';
      const result = await git.createBranch(branchName, actionObj.explanation);
      return result.success ? `Branch '${branchName}' created.` : `Failed to create branch: ${result.error}`;
    }
    case 'run_test': {
      const testFile = actionObj.target || actionObj.parameters?.testFile;
      if (!testFile) return 'No test file specified.';
      try {
        const executionId = await testExecutionService.startExecution(userId, testFile);
        return `Test execution started: ${executionId}`;
      } catch (err) {
        return `Failed to start test: ${err instanceof Error ? err.message : err}`;
      }
    }
    case 'list_feature_files': {
      const metadata = await extractRepoMetadata(repo.localPath);
      return `Feature files: ${metadata.testFolders.join(', ')}`;
    }
    default:
      return `Action '${actionObj.action}' would be performed here.`;
  }
}

export interface AIResponse {
  message: string
  type: 'text' | 'command' | 'error' | 'action'
  data?: any
  timestamp: string
  suggestions?: string[]
  ragUsed?: boolean
}

export class AIService {
  private isConnected: boolean = false
  // private aiProcess: any = null

  constructor() {
    this.initializeAI()
  }

  private async initializeAI(): Promise<void> {
    try {
      // Connect to the existing AI layer
      const aiLayerPath = path.join(process.cwd(), '..', 'ai-layer')
      logger.info(`Initializing AI service from: ${aiLayerPath}`)
      
      // Check if AI layer exists
      const fs = require('fs')
      if (!fs.existsSync(aiLayerPath)) {
        logger.error('AI layer not found')
        return
      }

      this.isConnected = true
      logger.info('AI service initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize AI service:', error)
      this.isConnected = false
    }
  }

  public async processChatMessage(message: string, userId: string): Promise<AIResponse> {
    try {
      // 1. Get linked repo for user
      const repo = await getLinkedRepo(userId);
      if (!repo || !repo.localPath) {
        return { message: 'No Playwright repo linked. Please link a repo first.', type: 'error', timestamp: new Date().toISOString() };
      }

      let ragUsed = false;
      // 2. RAG: Retrieve top-20 relevant chunks from embeddings
      let ragContext = '';
      try {
        const ragResults = await queryEmbeddings({ repoId: userId, query: message, topK: 20 });
        const anyRagResults = ragResults as any;
        if (anyRagResults && anyRagResults.documents && anyRagResults.documents[0]) {
          ragContext = anyRagResults.documents[0].map((doc: string | null, i: number) => {
            if (!doc) return '';
            const meta = anyRagResults.metadatas && anyRagResults.metadatas[0] ? anyRagResults.metadatas[0][i] : undefined;
            if (!meta) return doc;
            return `File: ${meta['filePath']} (lines ${meta['startLine']}-${meta['endLine']}):\n${doc}`;
          }).filter(Boolean).join('\n\n');
          // Limit context to ~100,000 characters (~25k tokens)
          const MAX_CONTEXT_CHARS = 100000;
          if (ragContext.length > MAX_CONTEXT_CHARS) {
            ragContext = ragContext.slice(0, MAX_CONTEXT_CHARS) + '\n... [context truncated]';
          }
          if (ragContext.trim().length > 0) ragUsed = true;
        }
      } catch (err) {
        // If RAG fails, fallback to current logic
        ragContext = '';
      }

      // 3. Gather repo context (fallback, for completeness)
      const fs = require('fs');
      const path = require('path');
      const repoPath = repo.localPath;
      function getDirTree(dir: string, depth = 2, prefix = ''): string {
        if (depth < 0) return '';
        let tree = '';
        const items = fs.readdirSync(dir);
        for (const item of items) {
          if (item.startsWith('.')) continue;
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          tree += `${prefix}- ${item}`;
          if (stat.isDirectory()) {
            tree += '/\n';
            tree += getDirTree(fullPath, depth - 1, prefix + '  ');
          } else {
            tree += '\n';
          }
        }
        return tree;
      }
      const dirTree = getDirTree(repoPath, 2);
      let pkgJson = '';
      const pkgPath = path.join(repoPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        pkgJson = fs.readFileSync(pkgPath, 'utf8');
      }
      const configs: Record<string, string> = {};
      const configFiles = ['playwright.config.ts', 'playwright.config.js', 'jest.config.js', 'cucumber.js', 'README.md'];
      for (const file of configFiles) {
        const filePath = path.join(repoPath, file);
        if (fs.existsSync(filePath)) {
          configs[file] = fs.readFileSync(filePath, 'utf8');
        }
      }

      // 4. Build LLM prompt
      let prompt = `You are an expert automation engineer and code assistant.\n`;
      if (ragContext) {
        prompt += `\nRelevant code/document context (retrieved via semantic search):\n${ragContext}\n`;
      } else {
        prompt += `Here is the repo directory tree (depth 2):\n${dirTree}\n`;
        if (pkgJson) prompt += `Here is package.json:\n${pkgJson}\n`;
        for (const [file, content] of Object.entries(configs)) {
          prompt += `Here is ${file}:\n${content}\n`;
        }
      }
      prompt += `\nUser asked: \"${message}\"\n`;
      prompt += `\nPlease answer in the following format, always including all sections, even if you have to say 'None' or 'No code needed':\n\nExplanation:\n<your explanation>\n\nCommand:\n<shell command, if any>\n\nCode:\n<code, if any>\n\nRisky:\n<yes/no>\n`;
      prompt += `\nExample:\nExplanation:\nTo run all tests, use the test script defined in package.json.\n\nCommand:\nnpm test\n\nCode:\nNo additional code is required.\n\nRisky:\nno\n`;
      // Final safeguard: truncate prompt to 100,000 chars
      const MAX_PROMPT_CHARS = 100000;
      if (prompt.length > MAX_PROMPT_CHARS) {
        prompt = prompt.slice(0, MAX_PROMPT_CHARS) + '\n... [prompt truncated]';
      }

      // 5. Call LLM (Ollama)
      const ollama = require('../../../ai-layer/src/integrations/OllamaClient');
      const config = { model: process.env['OLLAMA_MODEL'] || 'llama3' };
      const ollamaClient = new ollama.OllamaClient(config);
      const llmResult = await ollamaClient.generate(prompt);
      const llmResponse = llmResult.code;
      // Parse LLM response
      const explanationMatch = llmResponse.match(/Explanation:\n([\s\S]*?)\n\nCommand:/);
      const commandMatch = llmResponse.match(/Command:\n([\s\S]*?)\n\nCode:/);
      const codeMatch = llmResponse.match(/Code:\n([\s\S]*?)\n\nRisky:/);
      const riskyMatch = llmResponse.match(/Risky:\n([\s\S]*?)\n/);
      const explanation = explanationMatch ? explanationMatch[1].trim() : llmResponse.trim();
      const command = commandMatch ? commandMatch[1].trim() : '';
      const code = codeMatch ? codeMatch[1].trim() : '';
      const risky = riskyMatch ? riskyMatch[1].trim().toLowerCase() === 'yes' : false;

      let actionResult = '';
      if (command && !risky && ['npm test', 'npx playwright test', 'npx jest', 'npx cucumber-js'].some(cmd => command.startsWith(cmd))) {
        // Safe command, execute
        try {
          const execSync = require('child_process').execSync;
          actionResult = execSync(command, { cwd: repoPath, encoding: 'utf8' });
        } catch (err) {
          actionResult = `❌ Error running command: ${err instanceof Error ? err.message : err}`;
        }
      } else if (command && risky) {
        actionResult = `⚠️ Risky command proposed: ${command}. User confirmation required.`;
      }
      let userMessage = explanation + (actionResult ? `\n\n${actionResult}` : '') + (code ? `\n\nProposed code:\n${code}` : '');
      if (ragUsed) {
        userMessage = '🔎 (Semantic context from your codebase was used to answer this question.)\n\n' + userMessage;
      }
      // Store chat
      await storeChatMessage(userId, repo.id.toString(), message, userMessage, command);
      return {
        message: userMessage,
        type: command ? (risky ? 'action' : 'command') : 'text',
        timestamp: new Date().toISOString(),
        suggestions: [],
        ragUsed
      };
    } catch (error) {
      logger.error('Error processing AI chat message:', error);
      return { message: 'Sorry, I encountered an error processing your request.', type: 'error', timestamp: new Date().toISOString() };
    }
  }

  public async executeCommand(command: string): Promise<AIResponse> {
    try {
      logger.info(`Executing AI command: ${command}`)
      // Always use ai-layer for CLI
      const aiLayerPath = path.join(process.cwd(), '..', 'ai-layer');
      const result = await this.runCommandInAILayer(command, aiLayerPath);
      return {
        message: result,
        type: 'command',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Error executing AI command:', error)
      return {
        message: 'Failed to execute command',
        type: 'error',
        timestamp: new Date().toISOString()
      }
    }
  }

  private async runCommandInAILayer(command: string, aiLayerPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const aiBatchPath = path.join(aiLayerPath, 'src/cli/ai-batch.ts');
      const child = spawn('npx', ['ts-node', aiBatchPath, command], {
        cwd: aiLayerPath,
        stdio: ['ignore', 'pipe', 'pipe']
      })

      let output = ''
      let errorOutput = ''

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString()
      })

      child.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString()
      })

      child.on('close', (code: number) => {
        if (code === 0) {
          resolve(output)
        } else {
          reject(new Error(`Command failed with code ${code}: ${errorOutput || 'Command Execution Error'}`))
        }
      })
    })
  }

  private async getWorkingDirectory(): Promise<string> {
    try {
      const response = await fetch('http://localhost:3001/api/git/working-directory')
      if (response.ok) {
        const data = await response.json() as { workingDirectory: string }
        return data.workingDirectory
      }
    } catch (error) {
      console.warn('Failed to get linked repo')
    }
    throw new Error('No Playwright repo linked. Please link a repo first.')
  }

  public getConnectionStatus(): boolean {
    return this.isConnected
  }

  public async healthCheck(): Promise<boolean> {
    try {
      // Check if AI layer is accessible
      const aiLayerPath = path.join(process.cwd(), '..', 'ai-layer')
      const fs = require('fs')
      return fs.existsSync(aiLayerPath)
    } catch (error) {
      logger.error('AI health check failed:', error)
      return false
    }
  }

  // --- Full Codebase Review ---
  public async codebaseReview(repoRoot: string, opts: any): Promise<{ review: any[], errors: any[] }> {
    const fs = require('fs');
    const path = require('path');
    const allowedExts = ['.js', '.ts', '.tsx', '.jsx', '.json', '.md', '.feature', '.test', '.spec', '.txt'];
    const files: string[] = [];
    const errors: any[] = [];
    // Recursively walk repo
    function walk(dir: string) {
      if (dir.includes('node_modules')) return;
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        if (fullPath.includes('node_modules')) continue;
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (stat.isFile() && allowedExts.includes(path.extname(entry))) {
          files.push(fullPath);
        }
      }
    }
    walk(repoRoot);
    // Batch files (10 per batch)
    const batchSize = 3;
    const review: any[] = [];
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      let prompt = `You are an expert QA/SDET/BA code reviewer. For each file below, provide:\n- A concise summary of its purpose and main logic.\n- Pros (good practices, strengths).\n- Cons (weaknesses, anti-patterns).\n- Code smells or security issues.\n- Suggestions for improvement.\n- If the file is a test, comment on test coverage and style.\n\nRespond in strict JSON format as an array, one object per file, with these fields: file, summary, pros, cons, codeSmells, suggestions.\n\nIMPORTANT: Your output MUST be valid JSON. It will be parsed by a machine. If you do not return valid JSON, your answer will be rejected. Do NOT include any explanation or commentary outside the JSON.\n\nExample:\n[\n  {\n    \"file\": \"src/example.ts\",\n    \"summary\": \"...\",\n    \"pros\": [\"...\"],\n    \"cons\": [\"...\"],\n    \"codeSmells\": [\"...\"],\n    \"suggestions\": [\"...\"]\n  }\n]\n`;
      for (const file of batch) {
        try {
          const rel = path.relative(repoRoot, file);
          const content = fs.readFileSync(file, 'utf8');
          prompt += `\nFile: ${rel}\nContent:\n${content}\n`;
        } catch (err) {
          errors.push({ file, error: err instanceof Error ? err.message : String(err) });
        }
      }
      // Truncate prompt if too long
      const MAX_PROMPT_CHARS = 100000;
      if (prompt.length > MAX_PROMPT_CHARS) {
        prompt = prompt.slice(0, MAX_PROMPT_CHARS) + '\n... [truncated]';
      }
      // Call LLM (Ollama)
      try {
        const ollama = require('../../../ai-layer/src/integrations/OllamaClient');
        const config = { model: process.env['OLLAMA_MODEL'] || 'llama3' };
        const ollamaClient = new ollama.OllamaClient(config);
        const llmResult = await ollamaClient.generate(prompt);
        let parsed;
        try {
          parsed = JSON.parse(llmResult.code || llmResult.text || llmResult.result || llmResult);
        } catch (jsonErr) {
          // Fallback: try to extract file-by-file sections and convert to JSON
          const raw = llmResult.code || llmResult.text || llmResult.result || llmResult;
          const fallback = [];
          const fileSections = raw.split(/File: /g).slice(1);
          for (const section of fileSections) {
            const lines = section.split('\n');
            const file = lines[0].trim();
            const summary = (section.match(/Summary:(.*?)(Pros:|$)/s) || [])[1]?.trim() || '';
            const pros = (section.match(/Pros:(.*?)(Cons:|$)/s) || [])[1]?.split(/\n|\*/).map((s: string) => s.trim()).filter(Boolean) || [];
            const cons = (section.match(/Cons:(.*?)(Code Smells:|$)/s) || [])[1]?.split(/\n|\*/).map((s: string) => s.trim()).filter(Boolean) || [];
            const codeSmells = (section.match(/Code Smells:(.*?)(Suggestions:|$)/s) || [])[1]?.split(/\n|\*/).map((s: string) => s.trim()).filter(Boolean) || [];
            const suggestions = (section.match(/Suggestions:(.*?)(\n|$)/s) || [])[1]?.split(/\n|\*/).map((s: string) => s.trim()).filter(Boolean) || [];
            fallback.push({ file, summary, pros, cons, codeSmells, suggestions });
          }
          parsed = fallback.length > 0 ? fallback : null;
          errors.push({ batch: batch.map(f => path.relative(repoRoot, f)), error: 'Failed to parse JSON from LLM, used fallback parser', raw });
        }
        review.push({ batch: batch.map(f => path.relative(repoRoot, f)), result: parsed });
      } catch (err) {
        errors.push({ batch: batch.map(f => path.relative(repoRoot, f)), error: err instanceof Error ? err.message : String(err) });
      }
    }
    return { review, errors };
  }
} 