import { spawn } from 'child_process'
import { logger } from '../utils/logger'
import path from 'path'
import { EventEmitter } from 'events'
import { getLinkedRepoPathForUser } from '../utils/repoUtils'

export interface TestExecutionOptions {
  browser?: 'chromium' | 'firefox' | 'webkit'
  headless?: boolean
  workers?: number
  timeout?: number
  retries?: number
}

export interface ExecutionUpdate {
  executionId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  progress?: number
  message?: string
  results?: any
  timestamp: string
}

export class TestExecutionService extends EventEmitter {
  private executions: Map<string, any> = new Map()
  private isReady: boolean = false

  constructor() {
    super()
    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      // Check if automation layer exists
      const repoPath = await getLinkedRepoPathForUser(userId)
      if (!repoPath) { throw new Error('No Playwright repo linked. Please link a repo first.') }

      this.isReady = true
      logger.info('Test execution service initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize test execution service:', error)
      this.isReady = false
    }
  }

  public async startExecution(testFile: string, options: TestExecutionOptions = {}): Promise<string> {
    const executionId = this.generateExecutionId()
    
    try {
      logger.info(`Starting test execution: ${testFile}`, { executionId, options })
      
      const execution = {
        id: executionId,
        testFile,
        options,
        status: 'running',
        startTime: new Date(),
        progress: 0
      }
      
      this.executions.set(executionId, execution)
      
      // Start the test execution in background
      this.runTestExecution(executionId, testFile, options)
      
      return executionId
    } catch (error) {
      logger.error('Failed to start test execution:', error)
      throw error
    }
  }

  private async runTestExecution(executionId: string, testFile: string, options: TestExecutionOptions): Promise<void> {
    try {
      const repoPath = await getLinkedRepoPathForUser(userId)
      if (!repoPath) { throw new Error('No Playwright repo linked. Please link a repo first.') }
      
      // Build the Playwright command
      const args = ['test', testFile]
      
      if (options.browser) {
        args.push('--project', options.browser)
      }
      
      if (options.headless !== false) {
        args.push('--headed')
      }
      
      if (options.workers) {
        args.push('--workers', options.workers.toString())
      }
      
      if (options.timeout) {
        args.push('--timeout', options.timeout.toString())
      }
      
      if (options.retries) {
        args.push('--retries', options.retries.toString())
      }
      
      logger.info(`Running Playwright command: npx playwright ${args.join(' ')}`)
      
      const child = spawn('npx', ['playwright', ...args], {
        cwd: repoPath,
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      let output = ''
      let errorOutput = ''
      
      child.stdout.on('data', (data: Buffer) => {
        const message = data.toString()
        output += message
        
        // Parse progress from output
        const progressMatch = message.match(/(\d+)\/(\d+) tests/)
        if (progressMatch) {
                   const current = parseInt(progressMatch[1] || '0')
         const total = parseInt(progressMatch[2] || '1')
          const progress = Math.round((current / total) * 100)
          
          this.updateExecution(executionId, {
            status: 'running',
            progress,
            message: `Running test ${current}/${total}`
          })
        }
      })
      
      child.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString()
      })
      
      child.on('close', (code: number) => {
        const execution = this.executions.get(executionId)
        if (!execution) return
        
        const endTime = new Date()
        const duration = endTime.getTime() - execution.startTime.getTime()
        
        if (code === 0) {
          this.updateExecution(executionId, {
            status: 'completed',
            progress: 100,
            message: 'All tests passed successfully',
            results: {
              output,
              duration,
              exitCode: code
            }
          })
        } else {
          this.updateExecution(executionId, {
            status: 'failed',
            progress: 100,
            message: 'Test execution failed',
            results: {
              output,
              errorOutput,
              duration,
              exitCode: code
            }
          })
        }
      })
      
      child.on('error', (error: Error) => {
        logger.error('Test execution error:', error)
        this.updateExecution(executionId, {
          status: 'failed',
          message: `Execution error: ${error.message}`
        })
      })
      
    } catch (error) {
      logger.error('Error in test execution:', error)
      this.updateExecution(executionId, {
        status: 'failed',
        message: `Failed to start execution: ${error}`
      })
    }
  }

  private updateExecution(executionId: string, update: Partial<ExecutionUpdate>): void {
    const execution = this.executions.get(executionId)
    if (!execution) return
    
    Object.assign(execution, update)
    
    const executionUpdate: ExecutionUpdate = {
      executionId,
      status: execution.status,
      progress: execution.progress,
      message: execution.message,
      results: execution.results,
      timestamp: new Date().toISOString()
    }
    
    // Emit update event
    this.emit('execution-update', executionUpdate)
    
    // Also emit to specific execution room
    this.emit(`execution-${executionId}`, executionUpdate)
    
    logger.info(`Execution update: ${executionId}`, executionUpdate)
  }

  public onExecutionUpdate(executionId: string, callback: (update: ExecutionUpdate) => void): void {
    this.on(`execution-${executionId}`, callback)
  }

  public async cancelExecution(executionId: string): Promise<boolean> {
    try {
      const execution = this.executions.get(executionId)
      if (!execution || execution.status !== 'running') {
        return false
      }
      
      // Cancel the execution
      this.updateExecution(executionId, {
        status: 'cancelled',
        message: 'Execution cancelled by user'
      })
      
      return true
    } catch (error) {
      logger.error('Error cancelling execution:', error)
      return false
    }
  }

  public getExecutionStatus(executionId: string): any {
    return this.executions.get(executionId)
  }

  public getAllExecutions(): any[] {
    return Array.from(this.executions.values())
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public getReadyStatus(): boolean {
    return this.isReady
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const repoPath = await getLinkedRepoPathForUser(userId)
      return repoPath !== null
    } catch (error) {
      logger.error('Test execution health check failed:', error)
      return false
    }
  }
} 