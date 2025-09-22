// src/server.ts
import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import routes from './routes/router'
import path from 'path'
import fs from 'fs'
import { PUBLIC_UPLOADS_DIR, PUBLIC_UPLOADS_PREFIX } from './middleware/upload'
import authRoutes from './routes/auth';

const app = express()

// Middlewares
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Ensure uploads base directory exists (created on first server start)
try { fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true }) } catch {}

// Static hosting for uploaded files
app.use(PUBLIC_UPLOADS_PREFIX, express.static(PUBLIC_UPLOADS_DIR))

// Rotas principais
app.use('/api', routes)
app.use('/api/auth', authRoutes);

// Tratamento de erros
app.use(
  (err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error(err.stack)
    res.status(500).send('Erro interno do servidor!')
  }
)

const port = process.env.PORT || 5000
app.listen(port, (): void => {
  console.log(`Servidor rodando na porta ${port}`)
})