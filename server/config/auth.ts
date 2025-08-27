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

export default config