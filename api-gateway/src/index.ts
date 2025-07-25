import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
// import { validateRequest } from './middleware/validation'
import { aiRoutes } from './routes/ai'
import { testRoutes } from './routes/tests'
import { analyticsRoutes } from './routes/analytics'
import { executionRoutes } from './routes/execution'
import gitRoutes from './routes/git'
// import { WebSocketManager } from './services/websocket'
import { AIService } from './services/ai'
import { TestExecutionService } from './services/testExecution'

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env['WEB_DASHBOARD_URL'] || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

const PORT = process.env['PORT'] || 3001

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env['WEB_DASHBOARD_URL'] || "http://localhost:3000",
  credentials: true
}))
app.use(compression())
app.use(morgan('combined'))
app.use(limiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] || '1.0.0',
    services: {
      ai: 'connected',
      testExecution: 'ready',
      websocket: 'active'
    }
  })
})

// API Routes
app.use('/api/ai', aiRoutes)
app.use('/api/tests', testRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/execution', executionRoutes)
app.use('/api/git', gitRoutes)

// WebSocket connection
// const wsManager = new WebSocketManager(io)
const aiService = new AIService()
const testExecutionService = new TestExecutionService()

// Attach services to app for route access
app.set('services', { ai: aiService, testExecution: testExecutionService });

// WebSocket event handlers
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`)
  
  socket.on('join-room', (room: string) => {
    socket.join(room)
    logger.info(`Client ${socket.id} joined room: ${room}`)
  })
  
  socket.on('ai-chat', async (data: { message: string; sessionId: string; userId?: string }) => {
    try {
      const userId = data.userId || socket.id; // Use socket.id as fallback for userId
      const response = await aiService.processChatMessage(data.message, userId)
      socket.emit('ai-response', {
        message: response,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      logger.error('AI chat error:', error)
      socket.emit('ai-error', {
        error: 'Failed to process message',
        timestamp: new Date().toISOString()
      })
    }
  })
  
  socket.on('execute-test', async (data: { testFile: string; options: any }) => {
    try {
      const executionId = await testExecutionService.startExecution(data.testFile, data.options)
      socket.emit('execution-started', { executionId })
      
      // Stream execution updates
      testExecutionService.onExecutionUpdate(executionId, (update) => {
        socket.emit('execution-update', update)
      })
    } catch (error) {
      logger.error('Test execution error:', error)
      socket.emit('execution-error', {
        error: 'Failed to start execution',
        timestamp: new Date().toISOString()
      })
    }
  })
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })
})

// Error handling
app.use(errorHandler)

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 API Gateway running on port ${PORT}`)
  logger.info(`📊 WebSocket server ready`)
  logger.info(`🔗 AI Service: ${aiService.getConnectionStatus() ? 'Connected' : 'Disconnected'}`)
  logger.info(`🧪 Test Execution: ${testExecutionService.getReadyStatus() ? 'Ready' : 'Not Ready'}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
}) 