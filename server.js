import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import gameRoutes from './routes/gameRoutes.js'

const app = express()

app.use(cors()) // allow requests from your extension
app.use(express.json()) // parse JSON bodies

// Mount API routes
app.use('/gameRoutes', gameRoutes)

app.listen(process.env.PORT || 3000, () => {
   console.log(`Server running on port ${process.env.PORT}`)
})
