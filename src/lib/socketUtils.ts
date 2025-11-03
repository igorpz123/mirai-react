import { io, Socket } from 'socket.io-client'

/**
 * Resolves the Socket.IO URL based on environment and current location
 * Consolidates the logic previously duplicated across multiple contexts
 */
export function resolveSocketURL(): string {
  // Use explicit env var if set
  if (import.meta.env.VITE_API_WS_URL) {
    return import.meta.env.VITE_API_WS_URL as string
  }
  
  // In development, if running on Vite's default port, use backend port
  const { protocol, hostname, port } = window.location
  if (port === '5173') {
    return `${protocol}//${hostname}:5000`
  }
  
  // Production: use same origin
  return window.location.origin
}

/**
 * Creates a configured Socket.IO client with standard options
 */
export function createSocket(url?: string): Socket {
  const socketURL = url || resolveSocketURL()
  
  return io(socketURL, {
    transports: ['websocket'],
    autoConnect: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000
  })
}

/**
 * Setup standard presence ping intervals for a socket
 * Returns cleanup function to clear intervals
 */
export function setupPresencePing(
  socket: Socket,
  token: string,
  options: {
    socketPingInterval?: number
    httpPingInterval?: number
  } = {}
): () => void {
  const {
    socketPingInterval = 10_000,
    httpPingInterval = 15_000
  } = options

  // Immediate HTTP ping
  fetch('/api/presenca/ping', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }).catch(() => {})

  // Socket ping interval
  const pingInterval = setInterval(() => {
    socket.emit('presence:ping')
  }, socketPingInterval)

  // HTTP fallback interval
  const httpInterval = setInterval(() => {
    if (!socket.connected) {
      fetch('/api/presenca/ping', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {})
    }
  }, httpPingInterval)

  // Return cleanup function
  return () => {
    clearInterval(pingInterval)
    clearInterval(httpInterval)
  }
}
