#!/usr/bin/env node

import { Command } from 'commander';
import { AILayer } from '../index';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();

program
    .name('ai-generate')
    .description('Generate test code using AI')
    .version('1.0.0');

program
    .command('test')
    .description('Generate a new test')
    .argument('<description>', 'Description of the test to generate')
    .option('-t, --type <type>', 'Type of test (login, inventory, checkout)', 'general')
    .option('--tenant <tenant>', 'Tenant ID', 'default')
    .option('--user <user>', 'User ID', 'system')
    .action(async (description, options) => {
        const spinner = ora('Generating test code...').start();
        
        try {
            const aiLayer = new AILayer();
            
            const prompt = `Generate a Playwright test for: ${description}. Test type: ${options.type}`;
            
            const result = await aiLayer.generateTestCode(
                prompt,
                options.tenant,
                options.user
            );
            
            spinner.succeed('Test generated successfully!');
            
            console.log(chalk.green('\n📝 Generated Code:'));
            console.log(chalk.cyan('='.repeat(50)));
            console.log(result.code);
            console.log(chalk.cyan('='.repeat(50)));
            
            console.log(chalk.yellow('\n💡 Explanation:'));
            console.log(result.explanation);
            
            console.log(chalk.blue('\n📊 Metadata:'));
            console.log(`Model: ${result.metadata.model}`);
            console.log(`Generation Time: ${result.metadata.generationTime}ms`);
            console.log(`Tokens Used: ${result.metadata.tokensUsed}`);
            console.log(`Confidence: ${(result.metadata.confidence * 100).toFixed(1)}%`);
            
        } catch (error) {
            spinner.fail('Failed to generate test');
            console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
            process.exit(1);
        }
    });

program
    .command('update')
    .description('Update an existing test')
    .argument('<testPath>', 'Path to the test file')
    .argument('<updateRequest>', 'Description of the update')
    .option('--tenant <tenant>', 'Tenant ID', 'default')
    .option('--user <user>', 'User ID', 'system')
    .action(async (testPath, updateRequest, options) => {
        const spinner = ora('Updating test code...').start();
        
        try {
            const aiLayer = new AILayer();
            
            const result = await aiLayer.updateTest(
                testPath,
                updateRequest,
                options.tenant,
                options.user
            );
            
            spinner.succeed('Test updated successfully!');
            
            console.log(chalk.green('\n📝 Updated Code:'));
            console.log(chalk.cyan('='.repeat(50)));
            console.log(result.code);
            console.log(chalk.cyan('='.repeat(50)));
            
        } catch (error) {
            spinner.fail('Failed to update test');
            console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
            process.exit(1);
        }
    });

program.parse(); 