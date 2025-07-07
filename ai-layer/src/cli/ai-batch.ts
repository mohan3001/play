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
    maxTokens: 2000,
    topP: 1,
    topK: 40,
    repeatPenalty: 1,
    contextWindow: 2048,
    batchSize: 1
  };

  try {
    // Get working directory from Git integration API
    const workingDirectory = await getWorkingDirectory();
    
    // Parse the command
    const parser = new IntelligentCommandParser(config);
    const parsedCommand = await parser.parseCommand(input);
    
    // Execute the command
    await executeCommand(parsedCommand, input, workingDirectory, config);
    
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

async function executeCommand(parsedCommand: any, input: string, workingDirectory: string, config: LLMConfig) {
  const workflowService = new AIWorkflowService(config);
  const gitService = new GitAutomationService();

  switch (parsedCommand.command) {
    case 'count_tests': {
      const testAnalysis = await analyzeTestStructure(workingDirectory);
      console.log('📊 Test Analysis:');
      console.log(`📁 Repository: ${path.basename(workingDirectory)}`);
      console.log(`📍 Path: ${workingDirectory}`);
      console.log('');
      console.log('🧪 Test Files Found:');
      console.log(`   • Playwright Tests: ${testAnalysis.playwrightTests.length}`);
      console.log(`   • Cucumber Features: ${testAnalysis.cucumberFeatures.length}`);
      console.log(`   • Jest Tests: ${testAnalysis.jestTests.length}`);
      console.log(`   • Other Test Files: ${testAnalysis.otherTests.length}`);
      console.log(`   • Total Test Files: ${testAnalysis.totalTests}`);
      console.log('');
      
      if (testAnalysis.playwrightTests.length > 0) {
        console.log('📄 Playwright Test Files:');
        testAnalysis.playwrightTests.forEach(file => console.log(`   • ${file}`));
        console.log('');
      }
      
      if (testAnalysis.cucumberFeatures.length > 0) {
        console.log('🥒 Cucumber Feature Files:');
        testAnalysis.cucumberFeatures.forEach(file => console.log(`   • ${file}`));
        console.log('');
      }
      
      console.log('📈 Summary:');
      console.log(`   • Framework: ${testAnalysis.primaryFramework}`);
      console.log(`   • Test Structure: ${testAnalysis.testStructure}`);
      console.log(`   • Configuration: ${testAnalysis.hasConfig ? 'Found' : 'Not found'}`);
      break;
    }
    
    case 'analyze_framework': {
      const analysis = await analyzeTestStructure(workingDirectory);
      console.log('🔍 Framework Analysis:');
      console.log(`📁 Repository: ${path.basename(workingDirectory)}`);
      console.log(`📍 Path: ${workingDirectory}`);
      console.log('');
      console.log('🏗️  Framework Details:');
      console.log(`   • Primary Framework: ${analysis.primaryFramework}`);
      console.log(`   • Test Structure: ${analysis.testStructure}`);
      console.log(`   • Configuration Files: ${analysis.configFiles.join(', ') || 'None found'}`);
      console.log(`   • Package Manager: ${analysis.packageManager}`);
      console.log('');
      console.log('📊 Test Statistics:');
      console.log(`   • Total Test Files: ${analysis.totalTests}`);
      console.log(`   • Playwright Tests: ${analysis.playwrightTests.length}`);
      console.log(`   • Cucumber Features: ${analysis.cucumberFeatures.length}`);
      console.log(`   • Jest Tests: ${analysis.jestTests.length}`);
      console.log(`   • Other Tests: ${analysis.otherTests.length}`);
      console.log('');
      console.log('📁 Directory Structure:');
      console.log(`   • Test Directories: ${analysis.testDirectories.join(', ') || 'None found'}`);
      console.log(`   • Page Objects: ${analysis.pageObjects.length > 0 ? 'Found' : 'Not found'}`);
      console.log(`   • Utilities: ${analysis.utilities.length > 0 ? 'Found' : 'Not found'}`);
      break;
    }

    case 'run_all_tests': {
      const analysis = await analyzeTestStructure(workingDirectory);
      console.log('🚀 Running all tests...');
      
      if (analysis.primaryFramework === 'playwright') {
        const result = execSync('npx playwright test', { 
          encoding: 'utf8',
          cwd: workingDirectory
        });
        console.log(result);
      } else if (analysis.primaryFramework === 'jest') {
        const result = execSync('npm test', { 
          encoding: 'utf8',
          cwd: workingDirectory
        });
        console.log(result);
      } else {
        console.log('❌ No supported test framework detected. Please ensure Playwright or Jest is configured.');
      }
      break;
    }
    
    case 'run_test': {
      const testName = input.match(/run (.+)/i)?.[1]?.trim();
      if (!testName) {
        console.log('❌ Please specify the test name.');
        break;
      }
      
      const analysis = await analyzeTestStructure(workingDirectory);
      if (analysis.primaryFramework === 'playwright') {
        const result = execSync(`npx playwright test ${testName}`, { 
          encoding: 'utf8',
          cwd: workingDirectory
        });
        console.log(result);
      } else {
        console.log('❌ Test execution is currently only supported for Playwright.');
      }
      break;
    }
    
    case 'run_tests_by_tag': {
      const tag = input.match(/tagged (@\w+)/i)?.[1]?.trim();
      if (!tag) {
        console.log('❌ Please specify the tag (e.g., @smoke).');
        break;
      }
      
      const analysis = await analyzeTestStructure(workingDirectory);
      if (analysis.primaryFramework === 'playwright') {
        const result = execSync(`npx playwright test --grep "${tag}"`, { 
          encoding: 'utf8',
          cwd: workingDirectory
        });
        console.log(result);
      } else {
        console.log('❌ Tag-based execution is currently only supported for Playwright.');
      }
      break;
    }
    
    case 'list_all_tests': {
      const analysis = await analyzeTestStructure(workingDirectory);
      console.log('📋 All Test Files:');
      
      if (analysis.playwrightTests.length > 0) {
        console.log('\n🧪 Playwright Tests:');
        analysis.playwrightTests.forEach(file => console.log(`   📄 ${file}`));
      }
      
      if (analysis.cucumberFeatures.length > 0) {
        console.log('\n🥒 Cucumber Features:');
        analysis.cucumberFeatures.forEach(file => console.log(`   📄 ${file}`));
      }
      
      if (analysis.jestTests.length > 0) {
        console.log('\n⚡ Jest Tests:');
        analysis.jestTests.forEach(file => console.log(`   📄 ${file}`));
      }
      
      if (analysis.otherTests.length > 0) {
        console.log('\n📄 Other Test Files:');
        analysis.otherTests.forEach(file => console.log(`   📄 ${file}`));
      }
      
      console.log(`\n📊 Total: ${analysis.totalTests} test files`);
      break;
    }
    
    case 'show_last_test_run': {
      const resultPaths = [
        path.join(workingDirectory, 'test-results'),
        path.join(workingDirectory, 'playwright-report'),
        path.join(workingDirectory, 'coverage'),
        path.join(workingDirectory, 'reports')
      ];
      
      let foundResults = false;
      for (const resultPath of resultPaths) {
        if (fs.existsSync(resultPath)) {
          console.log(`📊 Test Results in: ${path.relative(workingDirectory, resultPath)}`);
          const files = fs.readdirSync(resultPath);
          files.forEach(f => console.log(`   📄 ${f}`));
          foundResults = true;
        }
      }
      
      if (!foundResults) {
        console.log('❌ No test results found in common directories.');
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
      const analysis = await analyzeTestStructure(workingDirectory);
      
      if (analysis.primaryFramework === 'playwright') {
        const result = execSync('npx playwright test --reporter=list', { 
          encoding: 'utf8',
          cwd: workingDirectory
        });
        console.log(result);
      } else {
        console.log('❌ Failed test rerun is currently only supported for Playwright.');
      }
      break;
    }
    
    case 'list_feature_files': {
      const analysis = await analyzeTestStructure(workingDirectory);
      if (analysis.cucumberFeatures.length > 0) {
        console.log('🥒 Cucumber Feature Files:');
        analysis.cucumberFeatures.forEach(file => console.log(`   📄 ${file}`));
      } else {
        console.log('❌ No Cucumber feature files found.');
      }
      break;
    }
    
    case 'run_feature_file': {
      const featureFile = input.match(/feature file (.+)/i)?.[1]?.trim();
      if (!featureFile) {
        console.log('❌ Please specify the feature file name.');
        break;
      }
      
      const analysis = await analyzeTestStructure(workingDirectory);
      if (analysis.cucumberFeatures.length > 0) {
        const result = execSync(`npx cucumber-js tests/features/${featureFile}`, { 
          encoding: 'utf8',
          cwd: workingDirectory
        });
        console.log(result);
      } else {
        console.log('❌ No Cucumber feature files found.');
      }
      break;
    }
    
    case 'show_test_history': {
      console.log('📈 Test History:');
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

      // Try multiple report locations
      const reportPaths = [
        path.join(workingDirectory, 'cucumber-report.html'),
        path.join(workingDirectory, 'playwright-report/index.html'),
        path.join(workingDirectory, 'coverage/lcov-report/index.html'),
        path.join(workingDirectory, 'reports/index.html'),
        path.join(workingDirectory, 'test-results/index.html')
      ];

      for (const reportPath of reportPaths) {
        if (fs.existsSync(reportPath)) {
          const reportName = path.basename(path.dirname(reportPath)) === 'playwright-report' ? 'Playwright' : 
                           path.basename(reportPath).includes('cucumber') ? 'Cucumber' : 'Test';
          console.log(`Opening ${reportName} Report...`);
          try {
            execSync(`${openCmd} "${reportPath}"`);
            console.log(`✅ ${reportName} report opened successfully`);
            opened = true;
            break;
          } catch (error) {
            console.log(`❌ Failed to open ${reportName} report`);
          }
        }
      }

      if (!opened) {
        console.log('❌ No reports found to open');
      }
      break;
    }
    
    default:
      if (parsedCommand.command === 'ai_workflow' || parsedCommand.command === 'git_operations') {
        // Run the full AI workflow for natural language git/code requests
        const workflowResult = await workflowService.executeWorkflow(input);
        console.log(workflowResult.message);
        if (!workflowResult.success) {
          process.exit(1);
        }
      } else {
        console.log(`❌ Unknown or unsupported command: ${parsedCommand.command}`);
        console.log('💡 Try: count tests, analyze framework, run all tests, list all tests, etc.');
      }
  }
}

// Dynamic test structure analysis function
async function analyzeTestStructure(workingDirectory: string) {
  const testFiles: string[] = [];
  const playwrightTests: string[] = [];
  const cucumberFeatures: string[] = [];
  const jestTests: string[] = [];
  const otherTests: string[] = [];
  const testDirectories: string[] = [];
  const pageObjects: string[] = [];
  const utilities: string[] = [];
  const configFiles: string[] = [];
  
  // Common test file patterns
  const testPatterns = [
    '**/*.spec.ts', '**/*.spec.js', '**/*.test.ts', '**/*.test.js',
    '**/*.feature', '**/*.e2e.ts', '**/*.e2e.js', '**/*.spec.tsx', '**/*.test.tsx'
  ];
  
  // Common test directories
  const testDirPatterns = ['tests', 'test', 'e2e', 'specs', 'spec', '__tests__'];
  
  // Common config files
  const configPatterns = [
    'playwright.config.ts', 'playwright.config.js', 'jest.config.js', 'jest.config.ts',
    'cypress.config.js', 'cypress.config.ts', 'cucumber.js', 'cucumber.config.js'
  ];
  
  // Recursively find all files
  function findFiles(dir: string, patterns: string[]): string[] {
    const files: string[] = [];
    const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt', 'out', 'target'];
    
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip excluded directories
          if (!excludeDirs.includes(item)) {
            files.push(...findFiles(fullPath, patterns));
          }
        } else if (stat.isFile()) {
          for (const pattern of patterns) {
            if (pattern.includes('**/*')) {
              const ext = pattern.split('.').pop();
              if (item.endsWith(`.${ext}`)) {
                files.push(fullPath);
                break;
              }
            } else if (item === pattern) {
              files.push(fullPath);
              break;
            }
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    return files;
  }
  
  // Find all test files
  const allFiles = findFiles(workingDirectory, testPatterns);
  
  // Categorize files
  for (const file of allFiles) {
    const relativePath = path.relative(workingDirectory, file);
    testFiles.push(relativePath);
    
    if (file.endsWith('.spec.ts') || file.endsWith('.spec.js') || file.endsWith('.e2e.ts') || file.endsWith('.e2e.js')) {
      playwrightTests.push(relativePath);
    } else if (file.endsWith('.feature')) {
      cucumberFeatures.push(relativePath);
    } else if (file.endsWith('.test.ts') || file.endsWith('.test.js') || file.endsWith('.test.tsx')) {
      jestTests.push(relativePath);
    } else {
      otherTests.push(relativePath);
    }
  }
  
  // Find test directories
  for (const pattern of testDirPatterns) {
    const testDir = path.join(workingDirectory, pattern);
    if (fs.existsSync(testDir)) {
      testDirectories.push(pattern);
    }
  }
  
  // Find config files
  for (const pattern of configPatterns) {
    const configFile = path.join(workingDirectory, pattern);
    if (fs.existsSync(configFile)) {
      configFiles.push(pattern);
    }
  }
  
  // Find page objects and utilities
  const pageObjectPatterns = ['**/pages/**/*.ts', '**/pages/**/*.js', '**/page-objects/**/*.ts', '**/page-objects/**/*.js'];
  const utilityPatterns = ['**/utils/**/*.ts', '**/utils/**/*.js', '**/helpers/**/*.ts', '**/helpers/**/*.js'];
  
  const pageObjectFiles = findFiles(workingDirectory, pageObjectPatterns);
  const utilityFiles = findFiles(workingDirectory, utilityPatterns);
  
  pageObjects.push(...pageObjectFiles.map(f => path.relative(workingDirectory, f)));
  utilities.push(...utilityFiles.map(f => path.relative(workingDirectory, f)));
  
  // Determine primary framework
  let primaryFramework = 'unknown';
  if (playwrightTests.length > 0 || configFiles.some(f => f.includes('playwright'))) {
    primaryFramework = 'playwright';
  } else if (jestTests.length > 0 || configFiles.some(f => f.includes('jest'))) {
    primaryFramework = 'jest';
  } else if (cucumberFeatures.length > 0) {
    primaryFramework = 'cucumber';
  }
  
  // Determine test structure
  let testStructure = 'unknown';
  if (testDirectories.includes('tests')) {
    testStructure = 'standard (tests/)';
  } else if (testDirectories.includes('e2e')) {
    testStructure = 'e2e-focused (e2e/)';
  } else if (testDirectories.includes('specs')) {
    testStructure = 'specs-based (specs/)';
  } else if (testDirectories.includes('__tests__')) {
    testStructure = 'jest-style (__tests__/)';
  }
  
  // Determine package manager
  let packageManager = 'unknown';
  if (fs.existsSync(path.join(workingDirectory, 'package-lock.json'))) {
    packageManager = 'npm';
  } else if (fs.existsSync(path.join(workingDirectory, 'yarn.lock'))) {
    packageManager = 'yarn';
  } else if (fs.existsSync(path.join(workingDirectory, 'pnpm-lock.yaml'))) {
    packageManager = 'pnpm';
  }
  
  return {
    totalTests: testFiles.length,
    playwrightTests,
    cucumberFeatures,
    jestTests,
    otherTests,
    testDirectories,
    pageObjects,
    utilities,
    configFiles,
    primaryFramework,
    testStructure,
    packageManager,
    hasConfig: configFiles.length > 0
  };
}

main(); 