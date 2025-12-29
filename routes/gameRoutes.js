import express from 'express'
import { identifyGame } from '../src/identifyGames.js'

const router = express.Router()

router.post('/', async (req, res) => {
   console.log('req.body:', req.body)

   try {
      const gameResponse = await identifyGame(req.body)

      res.json(gameResponse)
   } catch (error) {
      res.status(500).json({ error: 'Failed to identify game' })
   }
})

export default router