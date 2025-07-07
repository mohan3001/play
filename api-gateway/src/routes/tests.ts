import { Router } from 'express'
import { TestExecutionService } from '../services/testExecution'
import { validateRequest } from '../middleware/validation'
import Joi from 'joi'
import path from 'path'
import fs from 'fs'
import { getLinkedRepoPathForUser } from '../utils/repoUtils'

const router = Router()
const testExecutionService = new TestExecutionService()

// Test execution schema
const executionSchema = Joi.object({
  testFile: Joi.string().required(),
  options: Joi.object({
    browser: Joi.string().valid('chromium', 'firefox', 'webkit'),
    headless: Joi.boolean(),
    workers: Joi.number().min(1).max(10),
    timeout: Joi.number().min(1000).max(300000),
    retries: Joi.number().min(0).max(5)
  }).optional()
})

// Get test files
router.get('/files', async (req, res) => {
  try {
    const userId = req.user?.id // or however you get the user ID
    const repoPath = await getLinkedRepoPathForUser(userId)
    if (!repoPath) {
      return res.status(400).json({ success: false, error: { message: 'No Playwright repo linked. Please link a repo first.' } })
    }
    const testFiles = await scanTestFiles(repoPath)
    res.json({ success: true, data: testFiles })
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to get test files', details: error instanceof Error ? error.message : 'Unknown error' } })
  }
})

// Start test execution
router.post('/execute', validateRequest(executionSchema), async (req, res) => {
  try {
    const { testFile, options } = req.body
    const executionId = await testExecutionService.startExecution(testFile, options)
    
    res.json({
      success: true,
      data: {
        executionId,
        status: 'started',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to start test execution',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})

// Get execution status
router.get('/execution/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params
    const status = testExecutionService.getExecutionStatus(executionId)
    
    if (!status) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Execution not found'
        }
      })
      return
    }
    
    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get execution status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})

// Cancel execution
router.post('/execution/:executionId/cancel', async (req, res) => {
  try {
    const { executionId } = req.params
    const cancelled = await testExecutionService.cancelExecution(executionId)
    
    if (!cancelled) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Execution not found or cannot be cancelled'
        }
      })
      return
    }
    
    res.json({
      success: true,
      data: {
        executionId,
        status: 'cancelled',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to cancel execution',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})

// Get all executions
router.get('/executions', async (_req, res) => {
  try {
    const executions = testExecutionService.getAllExecutions()
    
    res.json({
      success: true,
      data: executions
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get executions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})

// Get test execution service status
router.get('/status', async (_req, res) => {
  try {
    const isReady = testExecutionService.getReadyStatus()
    const healthCheck = await testExecutionService.healthCheck()
    
    res.json({
      success: true,
      data: {
        ready: isReady,
        healthy: healthCheck,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get test service status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})

// Helper function to scan test files
async function scanTestFiles(dir: string, repoRoot?: string): Promise<any[]> {
  const files: any[] = []
  repoRoot = repoRoot || dir
  try {
    const items = await fs.promises.readdir(dir, { withFileTypes: true })
    for (const item of items) {
      const fullPath = path.join(dir, item.name)
      if (item.isDirectory()) {
        const subFiles = await scanTestFiles(fullPath, repoRoot)
        files.push(...subFiles)
      } else if (item.isFile()) {
        const ext = path.extname(item.name)
        if (ext === '.spec.ts' || ext === '.feature' || ext === '.ts') {
          const stats = await fs.promises.stat(fullPath)
          files.push({
            name: item.name,
            path: fullPath,
            relativePath: path.relative(repoRoot, fullPath),
            size: stats.size,
            modified: stats.mtime
          })
        }
      }
    }
  } catch (error) {
    console.error('Error scanning directory:', error)
  }
  return files
}

export { router as testRoutes } 