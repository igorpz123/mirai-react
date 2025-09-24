import { Server as SocketIOServer } from 'socket.io'

let ioInstance: SocketIOServer | null = null

export function setIO(instance: SocketIOServer) {
  ioInstance = instance
}

export function getIO(): SocketIOServer {
  if (!ioInstance) {
    throw new Error('Socket.IO instance not initialized yet')
  }
  return ioInstance
}
