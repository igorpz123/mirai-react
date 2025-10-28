// src/config/auth.ts
import * as dotenv from 'dotenv'
dotenv.config()

export interface AuthConfig {
  jwtSecret: string
  jwtExpiresIn: string
}

const config: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || '35G5B4d2BqMheMs16xge8tWbmfAKiTkfovPUhzfQ',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h'
}

// Export individual values for easier use
export const JWT_SECRET = config.jwtSecret

export default config