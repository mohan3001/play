#!/usr/bin/env ts-node

import { AILayer } from '../index';
import { IntelligentCommandParser } from '../core/IntelligentCommandParser';
import { GitAutomationService } from '../core/GitAutomationService';
import { AIWorkflowService } from '../core/AIWorkflowService';
import { LLMConfig } from '../types/AITypes';

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
      default:
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