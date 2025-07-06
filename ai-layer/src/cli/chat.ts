#!/usr/bin/env node

import { AILayer } from '../index';
import { IntelligentCommandParser } from '../core/IntelligentCommandParser';
import { LLMConfig } from '../types/AITypes';
import inquirer from 'inquirer';

async function chat() {
    console.log('🤖 Welcome to Playwright AI Chat!');
    console.log('Type "exit" to quit');
    console.log('Special commands: "count tests/test", "analyze framework", "coverage", "run login feature", "count feature files"\n');
    console.log('💡 You can also use natural language like "how many tests do we have?" or "list all feature files"\n');

    const aiLayer = new AILayer();
    
    // Initialize intelligent command parser
    const config: LLMConfig = {
        model: 'mistral',
        temperature: 0.1,
        maxTokens: 500,
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.1,
        contextWindow: 4096,
        batchSize: 1
    };
    const commandParser = new IntelligentCommandParser(config);

    // Command execution function
    async function executeCommand(command: string, intent?: any): Promise<void> {
        const { execSync } = require('child_process');
        
        switch (command) {
            case 'count_tests':
                console.log('🔍 Analyzing framework...\n');
                const analysis = execSync('npm run analyze tests -- --path ../automation', { 
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                console.log(analysis);
                break;
                
            case 'coverage':
                console.log('📊 Analyzing coverage...\n');
                const coverage = execSync('npm run analyze coverage -- --path ../automation', { 
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                console.log(coverage);
                break;
                
            case 'run_login':
                console.log('🥒 Running login.feature...\n');
                const result = execSync('cd ../automation && npx cucumber-js tests/features/login.feature --config cucumber.js --format summary', { 
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                console.log(result);
                break;
                
            case 'count_features':
                console.log('📁 Counting feature files...\n');
                const featureCount = execSync('find ../automation/tests/features -name "*.feature" | wc -l', { 
                    encoding: 'utf8',
                    cwd: process.cwd()
                }).trim();
                console.log(`📊 Found ${featureCount} feature file(s)`);
                
                const featureFiles = execSync('find ../automation/tests/features -name "*.feature" -exec basename {} \\;', { 
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                
                if (featureFiles.trim()) {
                    console.log('\n📋 Feature files:');
                    featureFiles.split('\n').filter((f: string) => f.trim()).forEach((file: string) => {
                        console.log(`  • ${file}`);
                    });
                }
                break;
                
            case 'analyze_framework':
                console.log('🔍 Analyzing framework...\n');
                const frameworkAnalysis = execSync('npm run analyze tests -- --path ../automation', { 
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                console.log(frameworkAnalysis);
                break;
                
            case 'explain_feature':
                console.log('📖 Reading and analyzing login feature file...\n');
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const featurePath = path.join(__dirname, '../../../automation/tests/features/login.feature');
                    const featureContent = fs.readFileSync(featurePath, 'utf8');
                    
                    // Use LLM to explain the feature
                    const explanation = await commandParser.explainFeatureFile(featureContent);
                    console.log('🤖 Feature Analysis:');
                    console.log('='.repeat(50));
                    console.log(explanation);
                    console.log('='.repeat(50));
                } catch (error) {
                    console.error('❌ Error reading feature file:', error instanceof Error ? error.message : 'Unknown error');
                }
                break;
                
            default:
                console.log(`❌ Unknown command: ${command}`);
        }
    }

    while (true) {
        const { message } = await inquirer.prompt([
            {
                type: 'input',
                name: 'message',
                message: 'You:',
                validate: (input: string) => {
                    if (!input.trim()) {
                        return 'Please enter a message';
                    }
                    return true;
                }
            }
        ]);

        if (message.toLowerCase() === 'exit') {
            console.log('👋 Goodbye!');
            break;
        }

        // Use intelligent command parser
        const parsedCommand = await commandParser.parseCommand(message);
        
        if (parsedCommand.isSpecialCommand && parsedCommand.command) {
            try {
                await executeCommand(parsedCommand.command, parsedCommand.intent);
            } catch (error) {
                console.error('❌ Command Execution Error:', error instanceof Error ? error.message : 'Unknown error');
            }
            continue;
        }

        try {
            console.log('🤖 AI is thinking...\n');
            
            const result = await aiLayer.generateTestCode(message);
            
            console.log('🤖 AI Response:');
            console.log('='.repeat(50));
            console.log(result.code);
            console.log('='.repeat(50));
            console.log(`\n💡 ${result.explanation}\n`);
            
        } catch (error) {
            console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
        }
    }
}

if (require.main === module) {
    chat().catch(console.error);
} 