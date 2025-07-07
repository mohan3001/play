import { spawn } from 'child_process'
import { logger } from '../utils/logger'
import path from 'path'
import { GitAutomationService, extractRepoMetadata } from '../../../shared/GitAutomationService';
import { getLinkedRepo } from '../utils/repoUtils';
import { getChatHistory, storeChatMessage } from '../utils/chromadb';
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

      // 2. Extract repo metadata
      const metadata = await extractRepoMetadata(repo.localPath);

      // 3. Retrieve chat history from ChromaDB
      const chatHistory = await getChatHistory(userId, repo.id.toString(), 10) as any[];
      const historyText = chatHistory.map((h: any) => `User: ${h.message}\nAI: ${h.response}`).join('\n');

      // 4. Build prompt with action instructions (for LLM, not CLI)
      // const prompt = `...`;

      // 5. Send only the user's message to the CLI
      const aiLayerPath = path.join(process.cwd(), '..', 'ai-layer');
      let aiResponse = await this.runCommandInAILayer(message, aiLayerPath);
      let actionResult = '';
      let actionObj = null;
      let suggestions: string[] = [];
      
      // Extract suggestions from CLI output
      const suggestionsMatch = aiResponse.match(/💡 Suggested next questions:\n((?:   \d+\. .*\n?)*)/);
      if (suggestionsMatch && suggestionsMatch[1]) {
        const suggestionsText = suggestionsMatch[1];
        suggestions = suggestionsText
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^\s*\d+\.\s*/, '').trim())
          .filter(suggestion => suggestion.length > 0);
        
        // Remove suggestions from the main response
        aiResponse = aiResponse.replace(/💡 Suggested next questions:\n((?:   \d+\. .*\n?)*)/, '').trim();
      }
      
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          actionObj = JSON.parse(jsonMatch[0]);
          if (actionObj.action) {
            // Call the appropriate handler based on actionObj.action
            actionResult = await handleAIAction(actionObj, repo, userId);
          }
          if (actionObj.suggestions) {
            suggestions = actionObj.suggestions;
          }
        }
      } catch (err) {
        // Not a structured action, treat as plain text
      }

      await storeChatMessage(userId, repo.id.toString(), message, aiResponse, actionObj?.action);

      return {
        message: aiResponse + (actionResult ? `\n\nAction Result:\n${actionResult}` : ''),
        type: actionObj?.action ? 'action' : 'text',
        timestamp: new Date().toISOString(),
        suggestions: suggestions
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
} 