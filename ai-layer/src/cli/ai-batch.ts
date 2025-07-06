#!/usr/bin/env ts-node

import { AILayer } from '../index';
import { IntelligentCommandParser } from '../core/IntelligentCommandParser';
import { GitAutomationService } from '../core/GitAutomationService';
import { AIWorkflowService } from '../core/AIWorkflowService';
import { LLMConfig } from '../types/AITypes';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import fetch from 'node-fetch';

async function main() {
  const input = process.argv.slice(2).join(' ').trim();
  if (!input) {
    console.error('No command provided. Usage: npm run ai-batch -- "<your command>"');
    process.exit(1);
  }

  const aiLayer = new AILayer();
  const config: LLMConfig = {
    model: 'mistral',
    temperature: 0.7,
    maxTokens: 2000
  };

  try {
    // Get working directory from Git integration API
    const workingDirectory = await getWorkingDirectory();
    
    // Parse the command
    const parser = new IntelligentCommandParser();
    const parsedCommand = parser.parseCommand(input);
    
    // Execute the command
    await executeCommand(parsedCommand, input, workingDirectory);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

async function getWorkingDirectory(): Promise<string> {
  try {
    const response = await fetch('http://localhost:3001/api/git/working-directory');
    if (response.ok) {
      const data = await response.json() as { workingDirectory: string };
      return data.workingDirectory;
    }
  } catch (error) {
    console.warn('Failed to get linked repo, using default automation directory');
  }
  
  // Fallback to default automation directory
  return path.join(__dirname, '../../../automation');
}

async function executeCommand(parsedCommand: any, input: string, workingDirectory: string) {
  const workflowService = new AIWorkflowService();
  const gitService = new GitAutomationService();

  switch (parsedCommand.command) {
    case 'run_all_tests': {
      const result = execSync('npx playwright test', { 
        encoding: 'utf8',
        cwd: workingDirectory
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
        cwd: workingDirectory
      });
      console.log(result);
      break;
    }
    case 'run_tests_by_tag': {
      const tag = input.match(/tagged (@\w+)/i)?.[1]?.trim();
      if (!tag) {
        console.log('❌ Please specify the tag (e.g., @smoke).');
        break;
      }
      const result = execSync(`npx playwright test --grep "${tag}"`, { 
        encoding: 'utf8',
        cwd: workingDirectory
      });
      console.log(result);
      break;
    }
    case 'list_all_tests': {
      const testFiles = fs.readdirSync(path.join(workingDirectory, 'tests'))
        .filter(file => file.endsWith('.spec.ts') || file.endsWith('.spec.js'))
        .map(file => `📄 ${file}`)
        .join('\n');
      console.log('📋 Test Files:\n' + testFiles);
      break;
    }
    case 'show_last_test_run': {
      const resultPath = path.join(workingDirectory, 'test-results');
      if (fs.existsSync(resultPath)) {
        const files = fs.readdirSync(resultPath);
        console.log('📊 Last Test Results:\n' + files.map(f => `📄 ${f}`).join('\n'));
      } else {
        console.log('❌ No test results found.');
      }
      break;
    }
    case 'show_failed_tests': {
      const resultPath = path.join(workingDirectory, 'test-results');
      if (fs.existsSync(resultPath)) {
        console.log('🔍 Checking for failed tests...');
        // This would parse the actual test results
        console.log('📋 Failed tests will be shown here.');
      } else {
        console.log('❌ No test results found.');
      }
      break;
    }
    case 'rerun_last_failed_tests': {
      console.log('🔄 Rerunning failed tests...');
      const result = execSync('npx playwright test --reporter=list', { 
        encoding: 'utf8',
        cwd: workingDirectory
      });
      console.log(result);
      break;
    }
    case 'list_feature_files': {
      const featuresPath = path.join(workingDirectory, 'tests/features');
      if (fs.existsSync(featuresPath)) {
        const files = fs.readdirSync(featuresPath)
          .filter(file => file.endsWith('.feature'))
          .map(file => `📄 ${file}`)
          .join('\n');
        console.log('📋 Feature Files:\n' + files);
      } else {
        console.log('❌ No feature files found.');
      }
      break;
    }
    case 'run_feature_file': {
      const featureFile = input.match(/feature file (.+)/i)?.[1]?.trim();
      if (!featureFile) {
        console.log('❌ Please specify the feature file name.');
        break;
      }
      const result = execSync(`npx cucumber-js tests/features/${featureFile}`, { 
        encoding: 'utf8',
        cwd: workingDirectory
      });
      console.log(result);
      break;
    }
    case 'show_test_history': {
      console.log('📈 Test History:\n');
      console.log('🕒 Recent test runs will be shown here.');
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
    case 'open_report': {
      const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      let opened = false;

      // Try Cucumber HTML report
      const cucumberReportPath = path.join(workingDirectory, 'cucumber-report.html');
      if (fs.existsSync(cucumberReportPath)) {
        console.log('Opening Cucumber HTML Report...');
        try {
          execSync(`${openCmd} "${cucumberReportPath}"`);
          console.log('✅ Cucumber report opened successfully');
          opened = true;
        } catch (error) {
          console.log('❌ Failed to open Cucumber report');
        }
      }

      // Try Playwright HTML report
      const playwrightReportPath = path.join(workingDirectory, 'playwright-report/index.html');
      if (fs.existsSync(playwrightReportPath)) {
        console.log('Opening Playwright HTML Report...');
        try {
          execSync(`${openCmd} "${playwrightReportPath}"`);
          console.log('✅ Playwright report opened successfully');
          opened = true;
        } catch (error) {
          console.log('❌ Failed to open Playwright report');
        }
      }

      if (!opened) {
        console.log('❌ No reports found to open');
      }
      break;
    }
    default:
      if (command === 'ai_workflow' || command === 'git_operations') {
        // Run the full AI workflow for natural language git/code requests
        const workflowResult = await workflowService.executeWorkflow(input);
        console.log(workflowResult.message);
        if (!workflowResult.success) {
          process.exit(1);
        }
      } else {
        console.log(`❌ Unknown or unsupported command: ${parsedCommand.command}`);
        console.log('💡 Try: run all tests, list all tests, show failed tests, etc.');
      }
  }
}

main(); 