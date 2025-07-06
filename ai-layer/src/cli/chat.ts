#!/usr/bin/env node

import { AILayer } from '../index';
import inquirer from 'inquirer';

async function chat() {
    console.log('🤖 Welcome to Playwright AI Chat!');
    console.log('Type "exit" to quit');
    console.log('Special commands: "count tests", "analyze framework", "coverage"\n');

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
        if (message.toLowerCase().includes('count') || message.toLowerCase().includes('analyze')) {
            try {
                console.log('🔍 Analyzing framework...\n');
                
                // Import and run the analysis
                const { execSync } = require('child_process');
                const analysis = execSync('npm run analyze tests -- --path ../automation', { 
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                
                console.log(analysis);
                continue;
            } catch (error) {
                console.error('❌ Analysis Error:', error instanceof Error ? error.message : 'Unknown error');
                continue;
            }
        }

        if (message.toLowerCase().includes('coverage')) {
            try {
                console.log('📊 Analyzing coverage...\n');
                
                const { execSync } = require('child_process');
                const coverage = execSync('npm run analyze coverage -- --path ../automation', { 
                    encoding: 'utf8',
                    cwd: process.cwd()
                });
                
                console.log(coverage);
                continue;
            } catch (error) {
                console.error('❌ Coverage Error:', error instanceof Error ? error.message : 'Unknown error');
                continue;
            }
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