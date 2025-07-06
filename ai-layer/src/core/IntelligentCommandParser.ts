import { OllamaClient } from '../integrations/OllamaClient';
import { LLMConfig } from '../types/AITypes';

export interface CommandIntent {
    action: string;
    target: string;
    parameters?: Record<string, any>;
    confidence: number;
}

export interface ParsedCommand {
    isSpecialCommand: boolean;
    command?: string;
    intent?: CommandIntent;
    originalMessage: string;
}

export class IntelligentCommandParser {
    private ollamaClient: OllamaClient;
    private commandMappings: Map<string, string[]> = new Map();

    constructor(config: LLMConfig) {
        this.ollamaClient = new OllamaClient(config);
        this.initializeCommandMappings();
    }

    private initializeCommandMappings(): void {
        this.commandMappings = new Map();
        
        // Count tests variations
        this.commandMappings.set('count_tests', [
            'count tests', 'count test', 'how many tests', 'number of tests',
            'total tests', 'test count', 'list tests', 'show tests',
            'analyze tests', 'test analysis', 'framework analysis'
        ]);

        // Count feature files variations
        this.commandMappings.set('count_features', [
            'count feature files', 'how many feature files', 'feature files count',
            'list features', 'show features', 'feature count', 'cucumber files',
            'bdd files', 'gherkin files', 'list feature files'
        ]);

        // Run login feature variations
        this.commandMappings.set('run_login', [
            'run login feature', 'run cucumber login', 'execute login',
            'test login', 'run login tests', 'execute login feature',
            'run login.feature', 'test login functionality', 'login test execution'
        ]);

        // Explain feature file variations
        this.commandMappings.set('explain_feature', [
            'explain login feature', 'describe login feature', 'what does login feature do',
            'explain login steps', 'describe login functionality', 'login feature explanation',
            'what are the login validations', 'explain login test cases', 'login feature analysis',
            'read login feature', 'understand login feature', 'login feature breakdown'
        ]);

        // View last execution results variations
        this.commandMappings.set('view_results', [
            'view results', 'show results', 'last execution results', 'test results',
            'show last results', 'view last results', 'execution results', 'recent results',
            'test execution results', 'show test results', 'last test results', 'cucumber results',
            'playwright results', 'test report', 'show report', 'view report'
        ]);

        // Open reports in browser variations
        this.commandMappings.set('open_report', [
            'open playwright report', 'open report', 'open test report', 'open html report',
            'open playwright-report', 'open playwright html', 'open test results', 'open results',
            'open browser report', 'show playwright report', 'view playwright report', 'launch report'
        ]);

        // Git operations variations
        this.commandMappings.set('git_operations', [
            'create branch', 'new branch', 'git branch', 'create feature branch',
            'git status', 'show git status', 'check git status', 'repository status',
            'git commit', 'commit changes', 'commit code', 'save changes',
            'git push', 'push changes', 'push to remote', 'upload changes',
            'git workflow', 'complete workflow', 'ai workflow', 'automated workflow'
        ]);

        // Coverage variations
        this.commandMappings.set('coverage', [
            'coverage', 'test coverage', 'show coverage', 'coverage report',
            'coverage analysis', 'test coverage analysis', 'coverage stats'
        ]);

        // Framework analysis variations
        this.commandMappings.set('analyze_framework', [
            'analyze framework', 'analyse framework', 'framework analysis',
            'analyze automation', 'automation analysis', 'framework overview',
            'show framework', 'framework stats', 'automation stats'
        ]);
    }

    async parseCommand(message: string): Promise<ParsedCommand> {
        const lowerMessage = message.toLowerCase().trim();

        // First, try exact matches for special commands
        const exactMatch = this.findExactMatch(lowerMessage);
        if (exactMatch) {
            return {
                isSpecialCommand: true,
                command: exactMatch,
                originalMessage: message
            };
        }

        // If no exact match, use LLM to understand intent
        try {
            const intent = await this.analyzeIntentWithLLM(message);
            
            if (intent && intent.confidence > 0.7) {
                const mappedCommand = this.mapIntentToCommand(intent);
                if (mappedCommand) {
                    return {
                        isSpecialCommand: true,
                        command: mappedCommand,
                        intent: intent,
                        originalMessage: message
                    };
                }
            }
        } catch (error) {
            console.warn('LLM intent analysis failed, falling back to exact matching:', error);
        }

        // Fallback: try fuzzy matching
        const fuzzyMatch = this.findFuzzyMatch(lowerMessage);
        if (fuzzyMatch) {
            return {
                isSpecialCommand: true,
                command: fuzzyMatch,
                originalMessage: message
            };
        }

        // Not a special command
        return {
            isSpecialCommand: false,
            originalMessage: message
        };
    }

    private findExactMatch(message: string): string | null {
        for (const [command, variations] of this.commandMappings.entries()) {
            if (variations.includes(message)) {
                return command;
            }
        }
        return null;
    }

    private findFuzzyMatch(message: string): string | null {
        for (const [command, variations] of this.commandMappings.entries()) {
            for (const variation of variations) {
                if (this.calculateSimilarity(message, variation) > 0.8) {
                    return command;
                }
            }
        }
        return null;
    }

    private calculateSimilarity(str1: string, str2: string): number {
        const words1 = str1.split(' ');
        const words2 = str2.split(' ');
        
        const commonWords = words1.filter(word => words2.includes(word));
        const totalWords = Math.max(words1.length, words2.length);
        
        return commonWords.length / totalWords;
    }

    private async analyzeIntentWithLLM(message: string): Promise<CommandIntent | null> {
        const prompt = this.buildIntentAnalysisPrompt(message);
        
        try {
            const result = await this.ollamaClient.generate(prompt);
            return this.parseLLMResponse(result.code);
        } catch (error) {
            console.error('LLM intent analysis error:', error);
            return null;
        }
    }

    private buildIntentAnalysisPrompt(message: string): string {
        return `You are an intelligent command parser for a Playwright automation framework. Analyze the user's message and determine their intent.

Available commands:
1. count_tests - Count and analyze test files
2. count_features - Count and list feature files  
3. run_login - Execute login feature tests
4. explain_feature - Explain feature file content and validations
5. view_results - View last execution results and reports
6. open_report - Open test reports in browser
7. git_operations - Git operations (create branch, commit, push)
8. coverage - Show test coverage
9. analyze_framework - Analyze the automation framework

User message: "${message}"

Respond with JSON only in this format:
{
  "action": "command_name",
  "target": "what they want to analyze/execute",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

If the message doesn't match any command, respond with:
{
  "action": "none",
  "target": "",
  "confidence": 0.0,
  "reasoning": "no match found"
}`;
    }

    private parseLLMResponse(response: string): CommandIntent | null {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;

            const parsed = JSON.parse(jsonMatch[0]);
            
            if (parsed.action === 'none' || parsed.confidence < 0.5) {
                return null;
            }

            return {
                action: parsed.action,
                target: parsed.target,
                confidence: parsed.confidence,
                parameters: {}
            };
        } catch (error) {
            console.error('Failed to parse LLM response:', error);
            return null;
        }
    }

    private mapIntentToCommand(intent: CommandIntent): string | null {
        const actionMap: Record<string, string> = {
            'count_tests': 'count_tests',
            'count_features': 'count_features', 
            'run_login': 'run_login',
            'explain_feature': 'explain_feature',
            'view_results': 'view_results',
            'open_report': 'open_report',
            'git_operations': 'git_operations',
            'coverage': 'coverage',
            'analyze_framework': 'analyze_framework'
        };

        return actionMap[intent.action] || null;
    }

    getCommandDescription(command: string): string {
        const descriptions: Record<string, string> = {
            'count_tests': 'Count and analyze test files in the framework',
            'count_features': 'Count and list Cucumber feature files',
            'run_login': 'Execute the login.feature Cucumber tests',
            'explain_feature': 'Read and explain feature file content and validations',
            'view_results': 'View last execution results and test reports',
            'open_report': 'Open test reports in default browser',
            'git_operations': 'Git operations (create branch, commit, push)',
            'coverage': 'Show test coverage analysis',
            'analyze_framework': 'Analyze the automation framework structure'
        };

        return descriptions[command] || 'Unknown command';
    }

    async explainFeatureFile(featureContent: string): Promise<string> {
        const explanationPrompt = `Please analyze this Cucumber feature file and explain:

1. What is the main functionality being tested?
2. What are all the test scenarios?
3. What validations are being performed?
4. What are the expected outcomes for each scenario?
5. What are the step definitions doing?

Feature file content:
\`\`\`gherkin
${featureContent}
\`\`\`

Please provide a comprehensive explanation in a clear, structured format.`;

        try {
            const result = await this.ollamaClient.generate(explanationPrompt);
            return result.code;
        } catch (error) {
            throw new Error(`Failed to explain feature file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
} 