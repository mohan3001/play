# Enterprise Playwright AI Automation Framework

A comprehensive, enterprise-grade automation framework that combines Playwright with AI capabilities for intelligent test generation, execution, and management.

## 🚀 Features

### Core Automation
- **Playwright Integration**: Full Playwright support with TypeScript
- **Page Object Model**: Structured, maintainable test architecture
- **Cucumber BDD**: Behavior-driven development support
- **Multi-browser Testing**: Chrome, Firefox, Safari, and mobile browsers
- **Parallel Execution**: Scalable test execution
- **Comprehensive Reporting**: HTML, JSON, and JUnit reports

### AI-Powered Capabilities
- **Intelligent Test Generation**: AI-driven test case creation
- **Code Updates**: Automated test maintenance and updates
- **Smart Execution**: AI-assisted test execution
- **Result Analysis**: Intelligent test result interpretation
- **Local LLM Integration**: Ollama with Mistral/CodeLlama support

### Enterprise Features
- **Multi-tenancy**: Isolated tenant environments
- **Security & Compliance**: GDPR, audit logging, data protection
- **Performance Monitoring**: Real-time metrics and analytics
- **Resource Management**: Rate limiting and usage tracking
- **Audit Trail**: Comprehensive activity logging

## 🏗️ Architecture

```
enterprise-playwright-ai/
├── automation/                    # Core automation framework
│   ├── src/
│   │   ├── pages/                # Page Object Models
│   │   ├── utils/                # Utilities and helpers
│   │   └── config/               # Configuration files
│   ├── tests/                    # Test specifications
│   └── data/                     # Test data
├── ai-layer/                     # AI integration layer
│   ├── src/
│   │   ├── core/                 # Core AI components
│   │   ├── integrations/         # LLM integrations
│   │   └── utils/                # AI utilities
├── api-gateway/                  # API gateway (future)
├── web-dashboard/                # Web dashboard (future)
└── shared/                       # Shared components
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Ollama (for local LLM)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd enterprise-playwright-ai
```

2. **Install dependencies**
```bash
npm install
npm run setup
```

3. **Install Playwright browsers**
```bash
cd automation
npx playwright install
```

4. **Setup Ollama (for AI features)**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull mistral:7b-instruct
ollama pull codellama:7b-instruct
```

5. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run tests in headed mode
npm run test:headed

# Run tests with debug
npm run test:debug

# Run specific test file
cd automation && npx playwright test tests/login.spec.ts
```

### AI-Powered Test Generation

```bash
# Generate new test
npm run ai:generate

# Interactive chat with AI
npm run ai:chat
```

### Example: Generate Login Test

```typescript
// Using the AI controller
const aiController = new EnterpriseAIController(config);

const request = {
    userInput: "Create a test for login functionality with valid and invalid credentials",
    type: "test",
    framework: "playwright",
    language: "typescript"
};

const generatedCode = await aiController.generateTestCode(
    request, 
    "default", 
    "user123"
);
```

## 📁 Project Structure

### Automation Framework

#### Page Objects
```typescript
// automation/src/pages/auth/LoginPage.ts
export class LoginPage extends BasePage {
    async login(username: string, password: string): Promise<void> {
        await this.fillInput(this.locators.usernameInput, username);
        await this.fillInput(this.locators.passwordInput, password);
        await this.clickElement(this.locators.loginButton);
    }
}
```

#### Test Specifications
```typescript
// automation/tests/login.spec.ts
test('should login successfully with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL(/.*inventory\.html/);
});
```

### AI Layer

#### LLM Integration
```typescript
// ai-layer/src/integrations/OllamaClient.ts
const ollamaClient = new OllamaClient(config);
const result = await ollamaClient.generate(prompt);
```

#### Enterprise Controller
```typescript
// ai-layer/src/core/EnterpriseAIController.ts
const controller = new EnterpriseAIController(config);
const code = await controller.generateTestCode(request, tenantId, userId);
```

## 🔧 Configuration

### Playwright Configuration
```typescript
// automation/playwright.config.ts
export default defineConfig({
    testDir: './tests',
    use: {
        baseURL: 'https://www.saucedemo.com',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    ]
});
```

### AI Configuration
```typescript
// ai-layer/src/config/llm-config.ts
export const LLM_CONFIGS = {
    codeGeneration: {
        model: 'mistral:7b-instruct',
        temperature: 0.1,
        maxTokens: 2048,
        topP: 0.9,
        topK: 40,
    }
};
```

## 🧪 Test Examples

### Sauce Demo Application Tests

The framework includes comprehensive tests for the [Sauce Demo](https://www.saucedemo.com/) application:

#### Login Tests
- Valid credentials
- Invalid credentials
- Locked out user
- Performance glitch user
- Problem user

#### Inventory Tests
- Product display
- Add to cart
- Remove from cart
- Product sorting
- Shopping cart navigation

#### Checkout Tests
- Complete checkout flow
- Form validation
- Error handling
- Multiple items
- Order completion

## 🔒 Security & Compliance

### Multi-tenancy
- Isolated tenant environments
- Resource limits per tenant
- Permission-based access control

### Audit Logging
- Comprehensive activity tracking
- GDPR compliance
- Data retention policies
- Security event monitoring

### Data Protection
- Encrypted data storage
- Secure API communications
- Access control and authentication
- Privacy by design

## 📊 Monitoring & Analytics

### Performance Metrics
- Response time tracking
- Error rate monitoring
- Resource usage analytics
- Rate limiting enforcement

### Audit Reports
- User activity logs
- Security event reports
- Compliance status
- Export capabilities (JSON, CSV, TXT)

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Future)
```bash
docker build -t playwright-ai .
docker run -p 3000:3000 playwright-ai
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- Documentation: [Wiki](link-to-wiki)
- Issues: [GitHub Issues](link-to-issues)
- Discussions: [GitHub Discussions](link-to-discussions)

## 🔮 Roadmap

### Phase 1: Core Framework ✅
- [x] Playwright automation framework
- [x] Page Object Model implementation
- [x] Basic test structure
- [x] Sauce Demo test suite

### Phase 2: AI Integration ✅
- [x] Ollama integration
- [x] AI controller
- [x] Code generation capabilities
- [x] Security validation

### Phase 3: Enterprise Features ✅
- [x] Multi-tenancy
- [x] Audit logging
- [x] Performance monitoring
- [x] Compliance checking

### Phase 4: Advanced Features (Future)
- [ ] Web dashboard
- [ ] API gateway
- [ ] Kubernetes deployment
- [ ] Advanced analytics
- [ ] Machine learning insights

---

**Built with ❤️ for enterprise automation** 