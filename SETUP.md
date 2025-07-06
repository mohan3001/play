# 🚀 Playwright AI Framework Setup Guide

## 📋 Prerequisites

### System Requirements
- **OS**: macOS (Apple Silicon M1/M2/M4 recommended)
- **Node.js**: v18+ 
- **npm**: v9+
- **Ollama**: Latest version
- **Memory**: 8GB+ RAM (16GB+ recommended for AI operations)

### Required Software
1. **Node.js & npm**: https://nodejs.org/
2. **Ollama**: https://ollama.ai/
3. **Git**: https://git-scm.com/

## 🔧 Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install automation layer dependencies
cd automation
npm install

# Install AI layer dependencies
cd ../ai-layer
npm install

# Return to root
cd ..
```

### 2. Setup Ollama

```bash
# Install Ollama (if not already installed)
# Download from https://ollama.ai/

# Start Ollama service
ollama serve

# In a new terminal, pull the required model
ollama pull mistral:7b-instruct

# Verify installation
ollama list
```

### 3. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env file with your settings
# Key settings to configure:
# - OLLAMA_BASE_URL=http://localhost:11434
# - OLLAMA_MODEL=mistral:7b-instruct
# - BASE_URL=https://www.saucedemo.com
```

### 4. Install Playwright Browsers

```bash
cd automation
npx playwright install
```

## 🧪 Testing the Setup

### 1. Validate Framework

```bash
# Run the validation script
node validate-framework.js
```

### 2. Run Basic Tests

```bash
# Run Playwright tests
cd automation
npm test

# Run with UI
npm run test:ui

# Run in headed mode
npm run test:headed
```

### 3. Test AI Integration

```bash
# Test AI code generation
cd ai-layer
npm run generate test "login with valid credentials"

# Test AI chat
npm run chat
```

### 4. Test Cucumber BDD

```bash
# Run Cucumber tests
cd automation
npm run cucumber

# Run with headed mode
npm run cucumber:headed
```

## 🔍 Troubleshooting

### Common Issues

#### 1. TypeScript Compilation Errors
```bash
# Clean and rebuild
cd automation && npm run build
cd ../ai-layer && npm run build
```

#### 2. Ollama Connection Issues
```bash
# Check if Ollama is running
ollama list

# Restart Ollama service
pkill ollama
ollama serve
```

#### 3. Missing Dependencies
```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 4. Playwright Browser Issues
```bash
# Reinstall browsers
cd automation
npx playwright install --force
```

### Performance Optimization

#### For Apple Silicon Macs
```bash
# Use native ARM64 builds
export OLLAMA_HOST=0.0.0.0
export OLLAMA_ORIGINS=*

# Optimize for M-series chips
ollama pull mistral:7b-instruct-q4_K_M
```

#### Memory Management
```bash
# Monitor memory usage
top -pid $(pgrep ollama)

# Restart Ollama if memory usage is high
pkill ollama && ollama serve
```

## 📊 Verification Checklist

- [ ] Node.js v18+ installed
- [ ] npm v9+ installed
- [ ] Ollama installed and running
- [ ] mistral:7b-instruct model pulled
- [ ] All dependencies installed
- [ ] Environment file configured
- [ ] Playwright browsers installed
- [ ] Validation script passes
- [ ] Basic tests run successfully
- [ ] AI integration works
- [ ] Cucumber tests run

## 🎯 Next Steps

1. **Explore the Framework**:
   - Read `README.md` for detailed documentation
   - Check `automation/tests/` for example tests
   - Review `ai-layer/src/` for AI integration

2. **Start Developing**:
   - Create new tests in `automation/tests/`
   - Add page objects in `automation/src/pages/`
   - Use AI to generate tests: `npm run generate`

3. **Customize Configuration**:
   - Modify `automation/playwright.config.ts`
   - Update `ai-layer/src/config/llm-config.ts`
   - Configure environment variables in `.env`

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review error logs in console output
3. Verify all prerequisites are met
4. Run validation script: `node validate-framework.js`
5. Check GitHub issues or create new ones

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Ollama Documentation](https://ollama.ai/docs)
- [Cucumber Documentation](https://cucumber.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) 