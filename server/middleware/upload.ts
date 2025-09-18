import multer, { StorageEngine } from 'multer'
import path from 'path'
import fs from 'fs'
import type { Request } from 'express'

// Base upload directory under the server folder
const BASE_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')

function ensureDirSync(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch (_) {
    // ignore if exists
  }
}

// Build a diskStorage that saves files under uploads/<entity>/<id>/
export function makeDiskStorage(entityFolder: 'tarefas' | 'propostas', idParam: string): StorageEngine {
  return multer.diskStorage({
  destination: (req: Request, _file: any, cb: (error: Error | null, destination: string) => void) => {
      const id = (req.params as any)?.[idParam]
      const dest = path.join(BASE_UPLOAD_DIR, entityFolder, String(id || 'unknown'))
      ensureDirSync(dest)
      cb(null, dest)
    },
  filename: (_req: Request, file: any, cb: (error: Error | null, filename: string) => void) => {
      const safeOriginal = file.originalname.replace(/[^\w\-. ]+/g, '_')
      const ext = path.extname(safeOriginal)
      const base = path.basename(safeOriginal, ext).slice(0, 80)
      const timestamp = Date.now()
      cb(null, `${base}-${timestamp}${ext}`)
    }
  })
}

export const uploadTarefa = multer({ storage: makeDiskStorage('tarefas', 'tarefa_id') })
export const uploadProposta = multer({ storage: makeDiskStorage('propostas', 'id') })

// Public URL path prefix used by server.ts when exposing static files
export const PUBLIC_UPLOADS_PREFIX = '/uploads'
export const PUBLIC_UPLOADS_DIR = BASE_UPLOAD_DIR
