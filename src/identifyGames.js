import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'

const systemInstruction = `You are a data extraction tool. 
Task: Extract video game names from titles.
Format: Return ONLY a JSON object with the key "game_names". 
Constraint: No conversational filler, no explanations, no "Here is the name". 
Rule: Include the full title including subtitles after colons (e.g., "Game: Subtitle").`

const client = new GoogleGenAI({
   apiKey: process.env.GOOGLE_KEY,
})

let tokenCache = {
   token: null,
   expiresAt: 0,
}

async function identifyGame(reqBody) {
   const videoDetails = await getVideoById(reqBody.videoId)
   if (!videoDetails) {
      return { error: 'Video not found or inaccessible' }
   }

   const gameNames = await identifyGamesByTitle(videoDetails.snippet.title)
   const gameData = await verifyGamesWithIGDB(gameNames)
}

async function getVideoById(videoId) {
   console.log('Getting video by ID:', videoId)
   const partsToRetrieve = 'snippet,contentDetails,statistics'
   const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=${partsToRetrieve}&key=${process.env.GOOGLE_KEY}`
   console.log(`Fetching video data from URL: ${url}`)

   try {
      const response = await fetch(url)

      // Check for HTTP errors (e.g., 400, 403, 404)
      if (!response.ok) {
         throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      if (data.items.length === 0) {
         console.log(
            `Error: No video found with ID ${videoId}. It might be private or deleted.`
         )
         return null
      }

      const video = data.items[0]

      console.log(`✅ Video Data Retrieved for ID: ${video.id}`)
      console.log(`Title: ${video.snippet.title}`)

      return video
   } catch (error) {
      console.error('Fetch Error:', error)
      return null
   }
}

async function identifyGamesByTitle(title) {
   const prompt = `Identify any video games mentioned in this title: "${title}". Respond with only the name of the games separated by a "|" If you cannot identify the game, respond with "Unknown". Make sure to read the whole title carefully. Even if you can easily identify a game read the rest of the title and see if there may be another game. Make sure to check for subtitles or sequels.`
   console.log('Prompt for AI:', prompt)

   try {
      const response = await client.models.generateContent({
         model: 'gemini-2.0-flash',
         systemInstruction: systemInstruction,
         contents: prompt,
         generationConfig: {
            temperature: 0,
            responseMimeType: 'application/json',
            responseSchema: {
               type: 'object',
               properties: {
                  game_names: {
                     type: 'array',
                     items: { type: 'string' },
                  },
               },
               required: ['game_names'],
            },
         },
      })

      console.log('AI Response:', response.text)
      return response.text.split('|').map((name) => name.trim())
   } catch (error) {
      console.error('Gemini API Error:', error)
      return 'Unknown'
   }
}

async function verifyGamesWithIGDB(gameNames) {
   // Placeholder for IGDB verification logic
   console.log('Verifying games with IGDB:', gameNames)
   let verifiedGames = []
   const token = await getTwitchToken()

   try {
      for (const name of gameNames) {
         console.log('name:', name)
         const response = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
               'Client-ID': process.env.TWITCH_CLIENT_ID,
               Authorization: `Bearer ${token}`,
               'Content-Type': 'text/plain',
            },
            body: `
               search "${name}";
               fields id, name, slug;
               `,
         })
         verifiedGames.push(await response.json())

         console.log('Verified Games:', verifiedGames)
         return verifiedGames
      }
   } catch (err) {
      console.error('IGDB Fetch Error:', err)
   }
}

async function getTwitchToken() {
   const now = Date.now()

   if (tokenCache.token && tokenCache.expiresAt > now) {
      return tokenCache.token
   }

   const res = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
         client_id: process.env.TWITCH_CLIENT_ID,
         client_secret: process.env.TWITCH_CLIENT_SECRET,
         grant_type: 'client_credentials',
      }),
   })

   const data = await res.json()

   tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 86400) * 1000,
   }

   return tokenCache.token
}

export { identifyGame }
