import { Server, Socket } from 'socket.io'
import { logger } from '../utils/logger'

export class WebSocketManager {
  private io: Server
  private connectedClients: Map<string, Socket> = new Map()

  constructor(io: Server) {
    this.io = io
    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket)
    })
  }

  private handleConnection(socket: Socket): void {
    logger.info(`Client connected: ${socket.id}`)
    this.connectedClients.set(socket.id, socket)

    // Handle client disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`)
      this.connectedClients.delete(socket.id)
    })

    // Handle room joining
    socket.on('join-room', (room: string) => {
      socket.join(room)
      logger.info(`Client ${socket.id} joined room: ${room}`)
    })

    // Handle room leaving
    socket.on('leave-room', (room: string) => {
      socket.leave(room)
      logger.info(`Client ${socket.id} left room: ${room}`)
    })

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() })
    })
  }

  public broadcastToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data)
    logger.info(`Broadcasted to room ${room}: ${event}`)
  }

  public sendToClient(clientId: string, event: string, data: any): void {
    const socket = this.connectedClients.get(clientId)
    if (socket) {
      socket.emit(event, data)
      logger.info(`Sent to client ${clientId}: ${event}`)
    } else {
      logger.warn(`Client ${clientId} not found`)
    }
  }

  public broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data)
    logger.info(`Broadcasted to all clients: ${event}`)
  }

  public getConnectedClientsCount(): number {
    return this.connectedClients.size
  }

  public getConnectedClients(): string[] {
    return Array.from(this.connectedClients.keys())
  }

  public isClientConnected(clientId: string): boolean {
    return this.connectedClients.has(clientId)
  }
} 