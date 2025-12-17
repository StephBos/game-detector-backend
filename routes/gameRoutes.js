const express = require('express')
const router = express.Router()
const { identifyGame } = require('../src/identifyGames')

router.post('/', async (req, res) => {
   console.log('req.body:', req.body)

   try {
      const gameResponse = await identifyGame(req.body)

      res.json(gameResponse)
   } catch (error) {
      res.status(500).json({ error: 'Failed to identify game' })
   }
})

module.exports = router
