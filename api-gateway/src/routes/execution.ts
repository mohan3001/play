import { Router } from 'express'
import { TestExecutionService } from '../services/testExecution'

const router = Router()
const testExecutionService = new TestExecutionService()

// Get execution status
router.get('/status/:executionId', async (req, res) => {
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
router.post('/cancel/:executionId', async (req, res) => {
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
router.get('/list', async (_req, res) => {
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

export { router as executionRoutes } 