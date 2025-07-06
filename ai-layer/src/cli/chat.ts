#!/usr/bin/env node

import { AILayer } from '../index';
import inquirer from 'inquirer';

async function chat() {
    console.log('🤖 Welcome to Playwright AI Chat!');
    console.log('Type "exit" to quit\n');

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