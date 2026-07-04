import 'dotenv/config'
import express from 'express'

const app = express()

const PORT = process.env.PORT

app.get("/", (req, res) => {
  res.json("ok")
})

app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`)
})
