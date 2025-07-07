import { Router } from 'express'
import { AIService } from '../services/ai'
import { validateRequest } from '../middleware/validation'
import Joi from 'joi'

const router = Router()
const aiService = new AIService()

// Helper to get userId from request, fallback to a default for dev
function getUserId(req: any): string {
  // In production, req.user should be set by authentication middleware
  return req.user?.id || 'default-user';
}

// Chat message schema
const chatMessageSchema = Joi.object({
  message: Joi.string().required().min(1).max(1000),
  sessionId: Joi.string().required()
})

// Command execution schema
const commandSchema = Joi.object({
  command: Joi.string().required().min(1).max(500)
})

// Process chat message
router.post('/chat', validateRequest(chatMessageSchema), async (req, res) => {
  try {
    const { message } = req.body
    const userId = getUserId(req);
    const response = await aiService.processChatMessage(message, userId)
    
    return res.json({
      success: true,
      data: response
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})

// Execute AI command
router.post('/command', validateRequest(commandSchema), async (req, res) => {
  try {
    const { command } = req.body
    const response = await aiService.executeCommand(command)
    
    res.json({
      success: true,
      data: response
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to execute command',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})

// Get AI service status
router.get('/status', async (_req, res) => {
  try {
    const isConnected = aiService.getConnectionStatus()
    const healthCheck = await aiService.healthCheck()
    
    res.json({
      success: true,
      data: {
        connected: isConnected,
        healthy: healthCheck,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get AI status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})

// Get available AI commands
router.get('/commands', async (_req, res) => {
  try {
    const commands = [
      {
        name: 'count tests',
        description: 'Count total test files and scenarios',
        category: 'analysis'
      },
      {
        name: 'analyze framework',
        description: 'Analyze test framework structure and quality',
        category: 'analysis'
      },
      {
        name: 'run login feature',
        description: 'Execute login feature tests',
        category: 'execution'
      },
      {
        name: 'ai workflow',
        description: 'Start AI-powered workflow',
        category: 'workflow'
      },
      {
        name: 'git operations',
        description: 'Perform Git operations',
        category: 'git'
      }
    ]
    
    res.json({
      success: true,
      data: commands
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get commands',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
})

export { router as aiRoutes } 