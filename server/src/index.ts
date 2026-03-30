import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes'
import songRoutes from './routes/songs.routes'
import setlistRoutes from './routes/setlists.routes'
import { errorHandler } from './middleware/error.middleware'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}))
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

app.listen(PORT, () => {
  console.log(`🎸 GFE Chord Server corriendo en http://localhost:${PORT}`)
})
