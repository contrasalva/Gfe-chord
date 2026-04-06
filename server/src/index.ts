import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'

import authRoutes from './routes/auth.routes'
import songRoutes from './routes/songs.routes'
import setlistRoutes from './routes/setlists.routes'
import { errorHandler } from './middleware/error.middleware'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001
const isProd = process.env.NODE_ENV === 'production'

// Middlewares
if (!isProd) {
  app.use(cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  }))
}
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'GFE Chord API corriendo' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/songs', songRoutes)
app.use('/api/setlists', setlistRoutes)

// Error handler (siempre al final)
app.use(errorHandler)

// Serve React client in production
if (isProd) {
  const clientDist = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`🎸 GFE Chord Server corriendo en http://localhost:${PORT}`)
})
