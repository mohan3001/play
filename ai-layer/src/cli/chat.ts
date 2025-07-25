#!/usr/bin/env node

import { AILayer } from '../index';
import { IntelligentCommandParser } from '../core/IntelligentCommandParser';
import { GitAutomationService } from '../core/GitAutomationService';
import { AIWorkflowService } from '../core/AIWorkflowService';
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
    const gitService = new GitAutomationService();
    const workflowService = new AIWorkflowService(config);

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
                
            case 'view_results':
                console.log('📊 Viewing last execution results...\n');
                try {
                    const fs = require('fs');
                    const path = require('path');
                    
                    // Check for Cucumber HTML report
                    const cucumberReportPath = path.join(__dirname, '../../../automation/cucumber-report.html');
                    if (fs.existsSync(cucumberReportPath)) {
                        console.log('🥒 Cucumber HTML Report:');
                        console.log(`📄 ${cucumberReportPath}\n`);
                    }
                    
                    // Check for Cucumber JSON report
                    const cucumberJsonPath = path.join(__dirname, '../../../automation/cucumber-report.json');
                    if (fs.existsSync(cucumberJsonPath)) {
                        console.log('📋 Cucumber JSON Report:');
                        const jsonContent = JSON.parse(fs.readFileSync(cucumberJsonPath, 'utf8'));
                        console.log(`📄 ${cucumberJsonPath}`);
                        console.log(`📊 Total Scenarios: ${jsonContent.length || 0}\n`);
                    }
                    
                    // Check for Playwright HTML report
                    const playwrightReportPath = path.join(__dirname, '../../../automation/playwright-report');
                    if (fs.existsSync(playwrightReportPath)) {
                        console.log('🎭 Playwright HTML Report:');
                        console.log(`📄 ${playwrightReportPath}/index.html\n`);
                    }
                    
                    // Check for test results
                    const testResultsPath = path.join(__dirname, '../../../automation/test-results');
                    if (fs.existsSync(testResultsPath)) {
                        console.log('📈 Test Results Directory:');
                        const files = fs.readdirSync(testResultsPath);
                        files.forEach((file: string) => {
                            console.log(`  📄 ${file}`);
                        });
                        console.log();
                    }
                    
                    // Show recent execution summary
                    console.log('🕒 Recent Execution Summary:');
                    console.log('='.repeat(50));
                    
                    // Try to get last execution from Cucumber JSON
                    if (fs.existsSync(cucumberJsonPath)) {
                        const jsonContent = JSON.parse(fs.readFileSync(cucumberJsonPath, 'utf8'));
                        if (jsonContent.length > 0) {
                            const lastExecution = jsonContent[jsonContent.length - 1];
                            console.log(`📅 Last Execution: ${new Date().toLocaleString()}`);
                            console.log(`🎯 Feature: ${lastExecution.name || 'Login Feature'}`);
                            console.log(`📊 Status: ${lastExecution.status || 'Completed'}`);
                            
                            if (lastExecution.elements) {
                                const scenarios = lastExecution.elements;
                                const passed = scenarios.filter((s: any) => s.status === 'passed').length;
                                const failed = scenarios.filter((s: any) => s.status === 'failed').length;
                                const skipped = scenarios.filter((s: any) => s.status === 'skipped').length;
                                
                                console.log(`✅ Passed: ${passed}`);
                                console.log(`❌ Failed: ${failed}`);
                                console.log(`⏭️ Skipped: ${skipped}`);
                                console.log(`📊 Total: ${scenarios.length}`);
                            }
                        }
                    }
                    
                    console.log('='.repeat(50));
                    console.log('\n💡 To view detailed reports:');
                    console.log('  • Cucumber HTML: Open cucumber-report.html in browser');
                    console.log('  • Playwright HTML: Open playwright-report/index.html in browser');
                    console.log('  • JSON Reports: Check cucumber-report.json for detailed data');
                    
                } catch (error) {
                    console.error('❌ Error viewing results:', error instanceof Error ? error.message : 'Unknown error');
                }
                break;
                
            case 'open_report':
                console.log('🌐 Opening test reports in browser...\n');
                try {
                    const { execSync } = require('child_process');
                    const path = require('path');
                    const fs = require('fs');
                    
                    // Check for Playwright HTML report
                    const playwrightReportPath = path.join(__dirname, '../../../automation/playwright-report/index.html');
                    if (fs.existsSync(playwrightReportPath)) {
                        console.log('🎭 Opening Playwright HTML Report...');
                        execSync(`open "${playwrightReportPath}"`, { 
                            encoding: 'utf8',
                            cwd: process.cwd()
                        });
                        console.log('✅ Playwright report opened in browser');
                    } else {
                        console.log('❌ Playwright HTML report not found');
                    }
                    
                    // Check for Cucumber HTML report
                    const cucumberReportPath = path.join(__dirname, '../../../automation/cucumber-report.html');
                    if (fs.existsSync(cucumberReportPath)) {
                        console.log('🥒 Opening Cucumber HTML Report...');
                        execSync(`open "${cucumberReportPath}"`, { 
                            encoding: 'utf8',
                            cwd: process.cwd()
                        });
                        console.log('✅ Cucumber report opened in browser');
                    } else {
                        console.log('❌ Cucumber HTML report not found');
                    }
                    
                    console.log('\n💡 Reports opened in your default browser');
                    
                } catch (error) {
                    console.error('❌ Error opening reports:', error instanceof Error ? error.message : 'Unknown error');
                }
                break;
                
            case 'git_operations':
                console.log('🔧 Git Operations Menu...\n');
                try {
                    const { gitAction } = await inquirer.prompt([
                        {
                            type: 'list',
                            name: 'gitAction',
                            message: 'Select Git operation:',
                            choices: [
                                { name: '📊 Show Git Status', value: 'status' },
                                { name: '🌿 Show Current Branch', value: 'branch' },
                                { name: '📋 Show Recent Commits', value: 'commits' },
                                { name: '🌱 Create New Branch', value: 'create_branch' },
                                { name: '💾 Commit Changes', value: 'commit' },
                                { name: '🚀 Push to Remote', value: 'push' },
                                { name: '🤖 AI Complete Workflow', value: 'ai_workflow' }
                            ]
                        }
                    ]);

                    switch (gitAction) {
                        case 'status':
                            const status = gitService.getStatus();
                            console.log('📊 Git Status:');
                            console.log(status || 'No changes');
                            break;
                            
                        case 'branch':
                            const currentBranch = gitService.getCurrentBranch();
                            const branches = gitService.getBranches();
                            console.log(`🌿 Current Branch: ${currentBranch}`);
                            console.log('📋 All Branches:');
                            branches.forEach(branch => {
                                const marker = branch === currentBranch ? '→ ' : '  ';
                                console.log(`${marker}${branch}`);
                            });
                            break;
                            
                        case 'commits':
                            const commits = gitService.getRecentCommits(10);
                            console.log('📋 Recent Commits:');
                            commits.forEach(commit => console.log(`  ${commit}`));
                            break;
                            
                        case 'create_branch':
                            const { branchName } = await inquirer.prompt([
                                {
                                    type: 'input',
                                    name: 'branchName',
                                    message: 'Enter branch name:',
                                    validate: (input: string) => {
                                        if (!input.trim()) return 'Branch name is required';
                                        if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
                                            return 'Branch name can only contain letters, numbers, hyphens, and underscores';
                                        }
                                        return true;
                                    }
                                }
                            ]);
                            const branchResult = await gitService.createBranch(branchName);
                            console.log(branchResult.success ? `✅ ${branchResult.message}` : `❌ ${branchResult.message}`);
                            break;
                            
                        case 'commit':
                            const statusForCommit = gitService.getStatus();
                            if (!statusForCommit) {
                                console.log('📊 No changes to commit');
                                break;
                            }
                            console.log('📊 Changes to commit:');
                            console.log(statusForCommit);
                            
                            const { commitMessage } = await inquirer.prompt([
                                {
                                    type: 'input',
                                    name: 'commitMessage',
                                    message: 'Enter commit message:',
                                    default: 'AI-generated changes'
                                }
                            ]);
                            
                            const changedFiles = statusForCommit.split('\n')
                                .filter(line => line.trim())
                                .map(line => line.split(' ').pop() || '')
                                .filter(file => file);
                            
                            const commitResult = await gitService.commitChanges(changedFiles, commitMessage);
                            console.log(commitResult.success ? `✅ ${commitResult.message}` : `❌ ${commitResult.message}`);
                            break;
                            
                        case 'push':
                            const pushResult = await gitService.pushBranch();
                            console.log(pushResult.success ? `✅ ${pushResult.message}` : `❌ ${pushResult.message}`);
                            break;
                            
                        case 'ai_workflow':
                            console.log('🤖 AI Complete Workflow - This will:');
                            console.log('1. Create a new feature branch');
                            console.log('2. Generate code based on your request');
                            console.log('3. Commit the changes');
                            console.log('4. Push to remote repository');
                            
                            const { workflowRequest } = await inquirer.prompt([
                                {
                                    type: 'input',
                                    name: 'workflowRequest',
                                    message: 'What would you like me to create? (e.g., "Create new branch AddCart and create a new feature file and implementation for login and add to cart. commit the code for review")',
                                    validate: (input: string) => input.trim() ? true : 'Request is required'
                                }
                            ]);
                            
                            console.log('\n🚀 Starting AI Workflow...');
                            const workflowResult = await workflowService.executeWorkflow(workflowRequest);
                            
                            console.log('\n' + workflowResult.message);
                            
                            if (!workflowResult.success) {
                                console.error(`❌ Workflow failed: ${workflowResult.error}`);
                            }
                            break;
                    }
                } catch (error) {
                    console.error('❌ Git operation error:', error instanceof Error ? error.message : 'Unknown error');
                }
                break;
                
            case 'ai_workflow':
                console.log('🤖 AI-Powered Feature Generation and Git Workflow\n');
                try {
                    const { userRequest } = await inquirer.prompt([
                        {
                            type: 'input',
                            name: 'userRequest',
                            message: 'Describe what you want to create (e.g., "Create new branch AddCart and create a new feature file and implementation for login and add to cart. commit the code for review")',
                            validate: (input: string) => input.trim() ? true : 'Request is required'
                        }
                    ]);
                    
                    console.log('\n🚀 Starting AI Workflow...');
                    const workflowResult = await workflowService.executeWorkflow(userRequest);
                    
                    console.log('\n' + workflowResult.message);
                    
                    if (!workflowResult.success) {
                        console.error(`❌ Workflow failed: ${workflowResult.error}`);
                    }
                    
                } catch (error) {
                    console.error('❌ AI workflow error:', error instanceof Error ? error.message : 'Unknown error');
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