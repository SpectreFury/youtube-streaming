import 'dotenv/config'
import express from 'express'

import cors from 'cors'

import uploadRouter from './routes/upload.js'

const app = express()

app.use(cors())

const PORT = process.env.PORT

app.use("/api/upload", uploadRouter)

app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`)
})
