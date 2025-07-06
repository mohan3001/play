#!/usr/bin/env node

import { AILayer } from '../index';
import inquirer from 'inquirer';

async function chat() {
    console.log('🤖 Welcome to Playwright AI Chat!');
    console.log('Type "exit" to quit');
    console.log('Special commands: "count tests/test", "analyze framework", "coverage", "run login feature", "count feature files"\n');

    const aiLayer = new AILayer();

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

        // Handle special commands
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage === 'count tests' || lowerMessage === 'count test' || lowerMessage === 'analyze framework' || lowerMessage === 'analyse framework') {
            try {
                console.log('🔍 Analyzing framework...\n');
                
                // Import and run the analysis
                const { execSync } = require('child_process');
                const analysis = execSync('npm run analyze tests -- --path ../automation', { 
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                
                console.log(analysis);
            } catch (error) {
                console.error('❌ Analysis Error:', error instanceof Error ? error.message : 'Unknown error');
            }
            continue;
        }

        if (lowerMessage === 'coverage') {
            try {
                console.log('📊 Analyzing coverage...\n');
                
                const { execSync } = require('child_process');
                const coverage = execSync('npm run analyze coverage -- --path ../automation', { 
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                
                console.log(coverage);
            } catch (error) {
                console.error('❌ Coverage Error:', error instanceof Error ? error.message : 'Unknown error');
            }
            continue;
        }

        if (lowerMessage === 'run login feature' || lowerMessage === 'run cucumber login') {
            try {
                console.log('🥒 Running login.feature...\n');
                
                const { execSync } = require('child_process');
                const result = execSync('cd ../automation && npx cucumber-js tests/features/login.feature --config cucumber.js --format summary', { 
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                
                console.log(result);
            } catch (error) {
                console.error('❌ Cucumber Error:', error instanceof Error ? error.message : 'Unknown error');
            }
            continue;
        }

        if (lowerMessage === 'how many feature files we have' || lowerMessage === 'count feature files' || lowerMessage === 'list features') {
            try {
                console.log('📁 Counting feature files...\n');
                
                const { execSync } = require('child_process');
                const result = execSync('find ../automation/tests/features -name "*.feature" | wc -l', { 
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                
                const featureCount = result.trim();
                console.log(`📊 Found ${featureCount} feature file(s)`);
                
                // List the feature files
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
            } catch (error) {
                console.error('❌ Feature Count Error:', error instanceof Error ? error.message : 'Unknown error');
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