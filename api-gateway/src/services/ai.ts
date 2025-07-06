import { spawn } from 'child_process'
import { logger } from '../utils/logger'
import path from 'path'

export interface AIResponse {
  message: string
  type: 'text' | 'command' | 'error'
  data?: any
  timestamp: string
}

export class AIService {
  private isConnected: boolean = false
  // private aiProcess: any = null

  constructor() {
    this.initializeAI()
  }

  private async initializeAI(): Promise<void> {
    try {
      // Connect to the existing AI layer
      const aiLayerPath = path.join(process.cwd(), '..', 'ai-layer')
      logger.info(`Initializing AI service from: ${aiLayerPath}`)
      
      // Check if AI layer exists
      const fs = require('fs')
      if (!fs.existsSync(aiLayerPath)) {
        logger.error('AI layer not found')
        return
      }

      this.isConnected = true
      logger.info('AI service initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize AI service:', error)
      this.isConnected = false
    }
  }

  public async processChatMessage(message: string, _sessionId: string): Promise<AIResponse> {
    try {
      logger.info(`Processing AI chat message: ${message}`)
      
      // For now, simulate AI processing
      // In real implementation, this would call the actual AI layer
      const response = await this.simulateAIResponse(message)
      
      return {
        message: response,
        type: 'text',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Error processing AI chat message:', error)
      return {
        message: 'Sorry, I encountered an error processing your request.',
        type: 'error',
        timestamp: new Date().toISOString()
      }
    }
  }

  private async simulateAIResponse(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase()
    
    // Simulate different AI responses based on message content
    if (lowerMessage.includes('count test')) {
      return '📊 **Test Analysis Results:**\n\n• **Total Test Files:** 15\n• **Feature Files:** 3 (.feature)\n• **Step Definitions:** 3 (.ts)\n• **Page Objects:** 8 (.ts)\n• **Test Specs:** 4 (.spec.ts)\n\n**Breakdown by Type:**\n- Playwright Tests: 12\n- Cucumber Features: 3\n- Page Objects: 8\n- Utilities: 4\n\n✅ Framework is well-structured with good test coverage!'
    }
    
    if (lowerMessage.includes('analyze framework')) {
      return '🔍 **Framework Analysis:**\n\n**✅ Strengths:**\n• Well-organized page object model\n• Comprehensive test coverage\n• Good separation of concerns\n• AI integration ready\n\n**📈 Metrics:**\n• Test Coverage: 85%\n• Code Quality: A+\n• Maintainability: High\n\n**💡 Recommendations:**\n• Add more edge case tests\n• Consider parallel execution\n• Implement visual regression testing'
    }
    
    if (lowerMessage.includes('run login')) {
      return '🚀 **Executing Login Feature Tests...**\n\n**Status:** Running\n**Browser:** Chrome\n**Scenarios:** 3\n\n✅ Background: User is on login page\n✅ Scenario: Valid login credentials\n✅ Scenario: Invalid login credentials\n✅ Scenario: Empty form validation\n\n**Results:** All tests passed! 🎉'
    }
    
    if (lowerMessage.includes('ai workflow')) {
      return '🤖 **AI Workflow Options:**\n\n1. **Create New Feature** - Generate complete test scenarios\n2. **Update Existing Tests** - Modify and improve current tests\n3. **Git Integration** - Branch, commit, and push changes\n4. **Code Generation** - Create page objects and step definitions\n\nWhat type of workflow would you like to start?'
    }
    
    return `I understand you're asking about: "${message}"\n\nI can help you with:\n\n• **Test Generation** - Create new test scenarios\n• **Framework Analysis** - Review your test structure\n• **Test Execution** - Run specific test suites\n• **Git Operations** - Manage branches and commits\n• **AI Workflows** - Complete automation workflows\n\nWhat would you like to focus on?`
  }

  public async executeCommand(command: string): Promise<AIResponse> {
    try {
      logger.info(`Executing AI command: ${command}`)
      
      // Execute the command in the AI layer
      const aiLayerPath = path.join(process.cwd(), '..', 'ai-layer')
      const result = await this.runCommandInAILayer(command, aiLayerPath)
      
      return {
        message: result,
        type: 'command',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Error executing AI command:', error)
      return {
        message: 'Failed to execute command',
        type: 'error',
        timestamp: new Date().toISOString()
      }
    }
  }

  private async runCommandInAILayer(command: string, aiLayerPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'chat'], {
        cwd: aiLayerPath,
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let output = ''
      let errorOutput = ''

      child.stdout.on('data', (data: Buffer) => {
        output += data.toString()
      })

      child.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString()
      })

      child.on('close', (code: number) => {
        if (code === 0) {
          resolve(output)
        } else {
          reject(new Error(`Command failed with code ${code}: ${errorOutput}`))
        }
      })

      // Send the command to the AI layer
      child.stdin.write(command + '\n')
      child.stdin.end()
    })
  }

  public getConnectionStatus(): boolean {
    return this.isConnected
  }

  public async healthCheck(): Promise<boolean> {
    try {
      // Check if AI layer is accessible
      const aiLayerPath = path.join(process.cwd(), '..', 'ai-layer')
      const fs = require('fs')
      return fs.existsSync(aiLayerPath)
    } catch (error) {
      logger.error('AI health check failed:', error)
      return false
    }
  }
} 