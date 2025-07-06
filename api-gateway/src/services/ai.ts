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
      
      // Call the real AI layer
      const workingDirectory = await this.getWorkingDirectory()
      const response = await this.runCommandInAILayer(message, workingDirectory)
      
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

  public async executeCommand(command: string): Promise<AIResponse> {
    try {
      logger.info(`Executing AI command: ${command}`)
      
      // Execute the command in the AI layer
      const workingDirectory = await this.getWorkingDirectory()
      const result = await this.runCommandInAILayer(command, workingDirectory)
      
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
      const child = spawn('npm', ['run', 'ai-batch', '--', command], {
        cwd: aiLayerPath,
        stdio: ['ignore', 'pipe', 'pipe']
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
          reject(new Error(`Command failed with code ${code}: ${errorOutput || 'Command Execution Error'}`))
        }
      })
    })
  }

  private async getWorkingDirectory(): Promise<string> {
    try {
      const response = await fetch('http://localhost:3001/api/git/working-directory')
      if (response.ok) {
        const data = await response.json() as { workingDirectory: string }
        return data.workingDirectory
      }
    } catch (error) {
      console.warn('Failed to get linked repo, using default automation directory')
    }
    
    // Fallback to default automation directory
    return path.join(__dirname, '../../../automation')
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