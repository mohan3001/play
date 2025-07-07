#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validating Playwright AI Framework...\n');

const issues = [];
const warnings = [];

// Check directory structure
function checkDirectoryStructure() {
    console.log('📁 Checking directory structure...');
    
    const requiredDirs = [
        'ai-layer',
        'ai-layer/src',
        'ai-layer/src/core',
        'ai-layer/src/integrations',
        'ai-layer/src/types',
        'ai-layer/src/config',
        'ai-layer/src/cli'
    ];
    
    requiredDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            issues.push(`❌ Missing directory: ${dir}`);
        } else {
            console.log(`✅ ${dir}`);
        }
    });
}

// Check required files
function checkRequiredFiles() {
    console.log('\n📄 Checking required files...');
    
    const requiredFiles = [
        'package.json',
        'ai-layer/package.json',
        'ai-layer/tsconfig.json',
        'ai-layer/src/index.ts',
        'ai-layer/src/types/AITypes.ts',
        'ai-layer/src/integrations/OllamaClient.ts',
        'ai-layer/src/core/EnterpriseAIController.ts',
        'ai-layer/src/core/SecurityValidator.ts',
        'ai-layer/src/core/ComplianceChecker.ts',
        'ai-layer/src/core/MultiTenantManager.ts',
        'ai-layer/src/core/AuditLogger.ts',
        'ai-layer/src/core/PerformanceMonitor.ts',
        'ai-layer/src/config/llm-config.ts',
        'ai-layer/src/cli/generate.ts',
        'ai-layer/src/cli/chat.ts',
        'env.example',
        '.env'
    ];
    
    requiredFiles.forEach(file => {
        if (!fs.existsSync(file)) {
            issues.push(`❌ Missing file: ${file}`);
        } else {
            console.log(`✅ ${file}`);
        }
    });
}

// Check package.json dependencies
function checkDependencies() {
    console.log('\n📦 Checking dependencies...');
    
    try {
        const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const aiPkg = JSON.parse(fs.readFileSync('ai-layer/package.json', 'utf8'));
        
        // Check root dependencies
        if (!rootPkg.dependencies) {
            warnings.push('⚠️ Root package.json missing dependencies');
        }
        
        // Check AI layer dependencies
        if (!aiPkg.dependencies.ollama) {
            issues.push('❌ Missing ollama in AI layer dependencies');
        }
        if (!aiPkg.dependencies['dir-assistant']) {
            warnings.push('⚠️ Missing dir-assistant in AI layer dependencies');
        }
        
        console.log('✅ Dependencies checked');
        
    } catch (error) {
        issues.push(`❌ Error reading package.json files: ${error.message}`);
    }
}

// Check TypeScript compilation
function checkTypeScript() {
    console.log('\n🔧 Checking TypeScript compilation...');
    
    try {
        // Check AI layer
        console.log('Checking AI layer...');
        execSync('cd ai-layer && npx tsc --noEmit', { stdio: 'pipe' });
        console.log('✅ AI layer TypeScript compilation OK');
    } catch (error) {
        issues.push(`❌ AI layer TypeScript compilation failed: ${error.message}`);
    }
}

// Check for placeholder code
function checkPlaceholders() {
    console.log('\n🔍 Checking for placeholder code...');
    
    const filesToCheck = [
        'ai-layer/src/core/EnterpriseAIController.ts',
        'ai-layer/src/core/SecurityValidator.ts',
        'ai-layer/src/core/ComplianceChecker.ts',
        'ai-layer/src/core/MultiTenantManager.ts',
        'ai-layer/src/core/AuditLogger.ts',
        'ai-layer/src/core/PerformanceMonitor.ts'
    ];
    
    filesToCheck.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            const placeholderPatterns = [
                /\/\/ TODO/,
                /\/\/ FIXME/,
                /\/\/ placeholder/,
                /\/\/ implement/,
                /throw new Error\('Not implemented'\)/,
                /return \{\}/,
                /return null/
            ];
            
            placeholderPatterns.forEach(pattern => {
                if (pattern.test(content)) {
                    warnings.push(`⚠️ Potential placeholder code in ${file}`);
                }
            });
        }
    });
    
    console.log('✅ Placeholder check completed');
}

// Check environment setup
function checkEnvironment() {
    console.log('\n🌍 Checking environment setup...');
    
    if (!fs.existsSync('.env')) {
        issues.push('❌ Missing .env file (copy from env.example)');
    } else {
        console.log('✅ .env file exists');
    }
    
    if (!fs.existsSync('env.example')) {
        issues.push('❌ Missing env.example file');
    } else {
        console.log('✅ env.example file exists');
    }
}

// Check Ollama setup
function checkOllama() {
    console.log('\n🤖 Checking Ollama setup...');
    
    try {
        execSync('ollama --version', { stdio: 'pipe' });
        console.log('✅ Ollama is installed');
        
        try {
            execSync('ollama list', { stdio: 'pipe' });
            console.log('✅ Ollama is running');
        } catch (error) {
            warnings.push('⚠️ Ollama might not be running (start with: ollama serve)');
        }
    } catch (error) {
        warnings.push('⚠️ Ollama not found (install from https://ollama.ai)');
    }
}

// Main validation
function main() {
    checkDirectoryStructure();
    checkRequiredFiles();
    checkDependencies();
    checkTypeScript();
    checkPlaceholders();
    checkEnvironment();
    checkOllama();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    
    if (issues.length === 0 && warnings.length === 0) {
        console.log('🎉 All checks passed! Framework is ready for testing.');
    } else {
        if (issues.length > 0) {
            console.log('\n❌ CRITICAL ISSUES:');
            issues.forEach(issue => console.log(issue));
        }
        
        if (warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            warnings.forEach(warning => console.log(warning));
        }
        
        console.log('\n🔧 NEXT STEPS:');
        console.log('1. Install dependencies: npm install && cd ../ai-layer && npm install');
        console.log('2. Install Ollama: https://ollama.ai');
        console.log('3. Start Ollama: ollama serve');
        console.log('4. Pull model: ollama pull mistral:7b-instruct');
        console.log('5. Run tests: cd ../ai-layer && npm test');
    }
    
    console.log('\n📚 DOCUMENTATION:');
    console.log('- README.md contains detailed setup and usage instructions');
    console.log('- Check individual package.json files for available scripts');
}

main(); 