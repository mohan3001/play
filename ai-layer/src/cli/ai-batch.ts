#!/usr/bin/env ts-node

import { AILayer } from '../index';
import { IntelligentCommandParser } from '../core/IntelligentCommandParser';
import { GitAutomationService } from '../core/GitAutomationService';
import { AIWorkflowService } from '../core/AIWorkflowService';
import { LLMConfig } from '../types/AITypes';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

async function main() {
  const input = process.argv.slice(2).join(' ').trim();
  if (!input) {
    console.error('No command provided. Usage: npm run ai-batch -- "<your command>"');
    process.exit(1);
  }

  const aiLayer = new AILayer();
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

  async function executeCommand(command: string, intent?: any): Promise<void> {
    const { execSync } = require('child_process');
    switch (command) {
      case 'count_tests': {
        const analysis = execSync('npm run analyze tests -- --path ../automation', {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        console.log(analysis);
        break;
      }
      case 'coverage': {
        const coverage = execSync('npm run analyze coverage -- --path ../automation', {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        console.log(coverage);
        break;
      }
      case 'run_login': {
        const result = execSync('cd ../automation && npx cucumber-js tests/features/login.feature --config cucumber.js --format summary', {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        console.log(result);
        break;
      }
      case 'count_features': {
        const featureCount = execSync('find ../automation/tests/features -name "*.feature" | wc -l', {
          encoding: 'utf8',
          cwd: process.cwd(),
        }).trim();
        console.log(`Found ${featureCount} feature file(s)`);
        const featureFiles = execSync('find ../automation/tests/features -name "*.feature" -exec basename {} \\;', {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        if (featureFiles.trim()) {
          console.log('Feature files:');
          featureFiles.split('\n').filter((f: string) => f.trim()).forEach((file: string) => {
            console.log(`  • ${file}`);
          });
        }
        break;
      }
      case 'analyze_framework': {
        const frameworkAnalysis = execSync('npm run analyze tests -- --path ../automation', {
          encoding: 'utf8',
          cwd: process.cwd(),
        });
        console.log(frameworkAnalysis);
        break;
      }
      case 'explain_feature': {
        const fs = require('fs');
        const path = require('path');
        const featurePath = path.join(__dirname, '../../../automation/tests/features/login.feature');
        const featureContent = fs.readFileSync(featurePath, 'utf8');
        const explanation = await commandParser.explainFeatureFile(featureContent);
        console.log('Feature Analysis:');
        console.log('='.repeat(50));
        console.log(explanation);
        console.log('='.repeat(50));
        break;
      }
      case 'view_results': {
        const fs = require('fs');
        const path = require('path');
        const cucumberReportPath = path.join(__dirname, '../../../automation/cucumber-report.html');
        if (fs.existsSync(cucumberReportPath)) {
          console.log('Cucumber HTML Report:');
          console.log(`${cucumberReportPath}\n`);
        }
        const cucumberJsonPath = path.join(__dirname, '../../../automation/cucumber-report.json');
        if (fs.existsSync(cucumberJsonPath)) {
          const jsonContent = JSON.parse(fs.readFileSync(cucumberJsonPath, 'utf8'));
          console.log(`Cucumber JSON Report: ${cucumberJsonPath}`);
          console.log(`Total Scenarios: ${jsonContent.length || 0}\n`);
        }
        const playwrightReportPath = path.join(__dirname, '../../../automation/playwright-report');
        if (fs.existsSync(playwrightReportPath)) {
          console.log('Playwright HTML Report:');
          console.log(`${playwrightReportPath}/index.html\n`);
        }
        const testResultsPath = path.join(__dirname, '../../../automation/test-results');
        if (fs.existsSync(testResultsPath)) {
          console.log('Test Results Directory:');
          const files = fs.readdirSync(testResultsPath);
          files.forEach((file: string) => {
            console.log(`  ${file}`);
          });
          console.log();
        }
        break;
      }
      case 'open_report': {
        const fs = require('fs');
        const path = require('path');
        const { execSync } = require('child_process');
        const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
        let opened = false;

        // Try Cucumber HTML report
        const cucumberReportPath = path.join(__dirname, '../../../automation/cucumber-report.html');
        if (fs.existsSync(cucumberReportPath)) {
          console.log('Opening Cucumber HTML Report...');
          try {
            execSync(`${openCmd} "${cucumberReportPath}"`);
            console.log(`✅ Opened: ${cucumberReportPath}`);
            opened = true;
          } catch (err) {
            console.error(`❌ Failed to open: ${cucumberReportPath}`);
          }
        }

        // Try Playwright HTML report
        const playwrightReportPath = path.join(__dirname, '../../../automation/playwright-report/index.html');
        if (fs.existsSync(playwrightReportPath)) {
          console.log('Opening Playwright HTML Report...');
          try {
            execSync(`${openCmd} "${playwrightReportPath}"`);
            console.log(`✅ Opened: ${playwrightReportPath}`);
            opened = true;
          } catch (err) {
            console.error(`❌ Failed to open: ${playwrightReportPath}`);
          }
        }

        if (!opened) {
          console.log('❌ No HTML report found to open.');
        }
        break;
      }
      case 'ai_workflow':
      case 'git_operations': {
        // Run the full AI workflow for natural language git/code requests
        const workflowResult = await workflowService.executeWorkflow(input);
        console.log(workflowResult.message);
        if (!workflowResult.success) {
          process.exit(1);
        }
        break;
      }
      case 'run_all_tests': {
        const result = execSync('npx playwright test', { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '../../../automation')
        });
        console.log(result);
        break;
      }
      case 'run_test': {
        const testName = input.match(/run (.+)/i)?.[1]?.trim();
        if (!testName) {
          console.log('❌ Please specify the test name.');
          break;
        }
        const result = execSync(`npx playwright test ${testName}`, { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '../../../automation')
        });
        console.log(result);
        break;
      }
      case 'run_tests_by_tag': {
        const tagMatch = input.match(/@\w+/);
        const tag = tagMatch ? tagMatch[0] : null;
        if (!tag) {
          console.log('❌ Please specify a tag (e.g., @smoke).');
          break;
        }
        const result = execSync(`npx playwright test --grep ${tag}`, { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '../../../automation')
        });
        console.log(result);
        break;
      }
      case 'list_all_tests': {
        const files = execSync('find tests -name "*.spec.ts"', { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '../../../automation')
        });
        console.log('Test files:\n' + files);
        break;
      }
      case 'show_last_test_run': {
        const reportPath = path.join(__dirname, '../../../automation/test-results/last-run.json');
        if (fs.existsSync(reportPath)) {
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          console.log('Last Test Run Summary:');
          console.log(JSON.stringify(report, null, 2));
        } else {
          console.log('❌ No last run report found.');
        }
        break;
      }
      case 'show_failed_tests': {
        const reportPath = path.join(__dirname, '../../../automation/test-results/last-run.json');
        if (fs.existsSync(reportPath)) {
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          const failed = report.failed || [];
          if (failed.length) {
            console.log('Failed tests:');
            failed.forEach((t: string) => console.log('  • ' + t));
          } else {
            console.log('✅ No failed tests in last run.');
          }
        } else {
          console.log('❌ No last run report found.');
        }
        break;
      }
      case 'rerun_last_failed_tests': {
        const reportPath = path.join(__dirname, '../../../automation/test-results/last-run.json');
        if (fs.existsSync(reportPath)) {
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          const failed = report.failed || [];
          if (failed.length) {
            const result = execSync(`npx playwright test ${failed.join(' ')}`, { 
              encoding: 'utf8',
              cwd: path.join(__dirname, '../../../automation')
            });
            console.log(result);
          } else {
            console.log('✅ No failed tests to rerun.');
          }
        } else {
          console.log('❌ No last run report found.');
        }
        break;
      }
      case 'list_feature_files': {
        const files = execSync('find tests/features -name "*.feature"', { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '../../../automation')
        });
        console.log('Feature files:\n' + files);
        break;
      }
      case 'run_feature_file': {
        const featureFile = input.match(/feature file (.+)/i)?.[1]?.trim();
        if (!featureFile) {
          console.log('❌ Please specify the feature file name.');
          break;
        }
        const result = execSync(`npx cucumber-js tests/features/${featureFile} --config cucumber.js --format summary`, { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '../../../automation')
        });
        console.log(result);
        break;
      }
      case 'show_test_history': {
        const testName = input.match(/history for (.+)/i)?.[1]?.trim();
        if (!testName) {
          console.log('❌ Please specify the test name.');
          break;
        }
        const historyPath = path.join(__dirname, '../../../automation/test-results/history', testName + '.json');
        if (fs.existsSync(historyPath)) {
          const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
          console.log('Test History:');
          console.log(JSON.stringify(history, null, 2));
        } else {
          console.log('❌ No history found for ' + testName);
        }
        break;
      }
      default:
        if (command === 'ai_workflow' || command === 'git_operations') {
          // Already handled above
          break;
        }
        console.log(`Unknown or unsupported command: ${command}`);
    }
  }

  // Parse and execute
  const parsedCommand = await commandParser.parseCommand(input);
  if (parsedCommand.isSpecialCommand && parsedCommand.command) {
    try {
      await executeCommand(parsedCommand.command, parsedCommand.intent);
    } catch (error) {
      console.error('Command Execution Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
    process.exit(0);
  }

  // Fallback: natural language to AI
  try {
    const result = await aiLayer.generateTestCode(input);
    console.log(result.code);
    if (result.explanation) {
      console.log(result.explanation);
    }
  } catch (error) {
    console.error('AI Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main(); 