#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

const program = new Command();

program
    .name('ai-analyze')
    .description('Analyze and count tests in the Playwright framework')
    .version('1.0.0');

program
    .command('tests')
    .description('Count and analyze all available tests')
    .option('-p, --path <path>', 'Path to automation directory', './automation')
    .action(async (options) => {
        console.log(chalk.blue('🔍 Analyzing Playwright Test Framework...\n'));
        
        const automationPath = path.resolve(options.path);
        
        if (!fs.existsSync(automationPath)) {
            console.error(chalk.red('❌ Automation directory not found'));
            process.exit(1);
        }

        const analysis = analyzeTests(automationPath);
        displayAnalysis(analysis);
    });

program
    .command('coverage')
    .description('Analyze test coverage for different features')
    .option('-p, --path <path>', 'Path to automation directory', './automation')
    .action(async (options) => {
        console.log(chalk.blue('📊 Analyzing Test Coverage...\n'));
        
        const automationPath = path.resolve(options.path);
        const analysis = analyzeTests(automationPath);
        displayCoverage(analysis);
    });

function analyzeTests(automationPath: string) {
    const analysis = {
        totalTestFiles: 0,
        totalTestCases: 0,
        totalCucumberFeatures: 0,
        totalCucumberSteps: 0,
        testCategories: {
            login: 0,
            inventory: 0,
            cart: 0,
            checkout: 0,
            other: 0
        },
        pageObjects: 0,
        utilities: 0,
        testFiles: [] as string[],
        featureFiles: [] as string[]
    };

    // Analyze test files
    const testsPath = path.join(automationPath, 'tests');
    if (fs.existsSync(testsPath)) {
        const testFiles = findFiles(testsPath, '.spec.ts');
        analysis.testFiles = testFiles;
        analysis.totalTestFiles = testFiles.length;

        testFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            const testCount = (content.match(/test\(/g) || []).length;
            analysis.totalTestCases += testCount;

            // Categorize tests
            if (file.includes('login')) {
                analysis.testCategories.login += testCount;
            } else if (file.includes('inventory')) {
                analysis.testCategories.inventory += testCount;
            } else if (file.includes('cart')) {
                analysis.testCategories.cart += testCount;
            } else if (file.includes('checkout')) {
                analysis.testCategories.checkout += testCount;
            } else {
                analysis.testCategories.other += testCount;
            }
        });
    }

    // Analyze Cucumber features
    const featuresPath = path.join(automationPath, 'tests', 'features');
    if (fs.existsSync(featuresPath)) {
        const featureFiles = findFiles(featuresPath, '.feature');
        analysis.featureFiles = featureFiles;
        analysis.totalCucumberFeatures = featureFiles.length;

        featureFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            const scenarioCount = (content.match(/Scenario:/g) || []).length;
            analysis.totalCucumberSteps += scenarioCount;
        });
    }

    // Analyze step definitions
    const stepsPath = path.join(automationPath, 'tests', 'steps');
    if (fs.existsSync(stepsPath)) {
        const stepFiles = findFiles(stepsPath, '.ts');
        stepFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            const stepCount = (content.match(/Given\(|When\(|Then\(/g) || []).length;
            analysis.totalCucumberSteps += stepCount;
        });
    }

    // Count page objects
    const pagesPath = path.join(automationPath, 'src', 'pages');
    if (fs.existsSync(pagesPath)) {
        const pageFiles = findFiles(pagesPath, '.ts');
        analysis.pageObjects = pageFiles.length;
    }

    // Count utilities
    const utilsPath = path.join(automationPath, 'src', 'utils');
    if (fs.existsSync(utilsPath)) {
        const utilFiles = findFiles(utilsPath, '.ts');
        analysis.utilities = utilFiles.length;
    }

    return analysis;
}

function findFiles(dir: string, extension: string): string[] {
    const files: string[] = [];
    
    function traverse(currentDir: string) {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                traverse(fullPath);
            } else if (item.endsWith(extension)) {
                files.push(fullPath);
            }
        }
    }
    
    traverse(dir);
    return files;
}

function displayAnalysis(analysis: any) {
    console.log(chalk.green('📊 TEST FRAMEWORK ANALYSIS'));
    console.log(chalk.cyan('='.repeat(50)));
    
    console.log(chalk.yellow('\n📁 Test Files:'));
    console.log(`   Total Test Files: ${chalk.bold(analysis.totalTestFiles)}`);
    console.log(`   Total Test Cases: ${chalk.bold(analysis.totalTestCases)}`);
    
    console.log(chalk.yellow('\n🥒 Cucumber BDD:'));
    console.log(`   Feature Files: ${chalk.bold(analysis.totalCucumberFeatures)}`);
    console.log(`   Total Scenarios: ${chalk.bold(analysis.totalCucumberSteps)}`);
    
    console.log(chalk.yellow('\n📋 Test Categories:'));
    console.log(`   Login Tests: ${chalk.bold(analysis.testCategories.login)}`);
    console.log(`   Inventory Tests: ${chalk.bold(analysis.testCategories.inventory)}`);
    console.log(`   Cart Tests: ${chalk.bold(analysis.testCategories.cart)}`);
    console.log(`   Checkout Tests: ${chalk.bold(analysis.testCategories.checkout)}`);
    console.log(`   Other Tests: ${chalk.bold(analysis.testCategories.other)}`);
    
    console.log(chalk.yellow('\n🏗️ Framework Components:'));
    console.log(`   Page Objects: ${chalk.bold(analysis.pageObjects)}`);
    console.log(`   Utilities: ${chalk.bold(analysis.utilities)}`);
    
    console.log(chalk.yellow('\n📄 Test Files:'));
    analysis.testFiles.forEach((file: string) => {
        const relativePath = path.relative(process.cwd(), file);
        console.log(`   ${chalk.blue(relativePath)}`);
    });
    
    if (analysis.featureFiles.length > 0) {
        console.log(chalk.yellow('\n🥒 Feature Files:'));
        analysis.featureFiles.forEach((file: string) => {
            const relativePath = path.relative(process.cwd(), file);
            console.log(`   ${chalk.blue(relativePath)}`);
        });
    }
    
    console.log(chalk.cyan('\n' + '='.repeat(50)));
}

function displayCoverage(analysis: any) {
    console.log(chalk.green('📊 TEST COVERAGE ANALYSIS'));
    console.log(chalk.cyan('='.repeat(50)));
    
    const totalTests = analysis.totalTestCases;
    const totalFeatures = analysis.totalCucumberFeatures;
    
    console.log(chalk.yellow('\n🎯 Test Coverage:'));
    console.log(`   Total Test Cases: ${chalk.bold(totalTests)}`);
    console.log(`   Total BDD Features: ${chalk.bold(totalFeatures)}`);
    
    if (totalTests > 0) {
        const loginCoverage = ((analysis.testCategories.login / totalTests) * 100).toFixed(1);
        const inventoryCoverage = ((analysis.testCategories.inventory / totalTests) * 100).toFixed(1);
        const cartCoverage = ((analysis.testCategories.cart / totalTests) * 100).toFixed(1);
        const checkoutCoverage = ((analysis.testCategories.checkout / totalTests) * 100).toFixed(1);
        
        console.log(chalk.yellow('\n📈 Coverage by Category:'));
        console.log(`   Login: ${chalk.bold(loginCoverage)}% (${analysis.testCategories.login} tests)`);
        console.log(`   Inventory: ${chalk.bold(inventoryCoverage)}% (${analysis.testCategories.inventory} tests)`);
        console.log(`   Cart: ${chalk.bold(cartCoverage)}% (${analysis.testCategories.cart} tests)`);
        console.log(`   Checkout: ${chalk.bold(checkoutCoverage)}% (${analysis.testCategories.checkout} tests)`);
    }
    
    console.log(chalk.cyan('\n' + '='.repeat(50)));
}

program.parse(); 