import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai'

dotenv.config()
const client = new GenAI({ apiKey: process.env.GOOGLE_KEY });

chrome.runtime.onMessage.addListener(async function (
   request,
   sender,
   sendResponse
) {
   console.log('Background Service Worker received message:', request)

   // Use the 'type' field to handle different messages
   if (request.type === 'GET_GAME_TITLE_FROM_VIDEO_DETAILS') {
      const videoId = request.videoId
      const identifiedGames = await identifyGameFromVideoDetails(videoId)
      const mappedGames = await mapGames(identifiedGames)

      console.log(`Background Service Worker received new Video ID: ${videoId}`)
      sendResponse({ title: identifiedGames.title })
   }

   // This is necessary if you use sendResponse asynchronously
   return true
})

async function identifyGameFromVideoDetails(videoId) {
   const videoDetails = await getVideoById(videoId)
   console.log('videoDetails:', videoDetails)
   const gameDetailsFromTitle = identifyGameFromTitle(
      videoDetails.snippet.title
   )
}

async function identifyGameFromTitle(videoTitle) {
   const prompt = `Identify the main video game mentioned in the following video title: "${videoTitle}". Respond with just the name of the game. If no game is mentioned, respond with "No game found".`
   const response = await client.generate({
      model: 'gemini-2.5-flash',
      contents: prompt,
   })

   console.log('AI Response:', response)

   return {
      id: videoId,
      title: 'Example Game Title from background',
      description: 'This is a description of the example game.',
   }
}

async function getVideoById(videoId) {
   const partsToRetrieve = 'snippet,contentDetails,statistics'
   const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=${partsToRetrieve}&key=${YOUTUBE_API_KEY}`
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
      console.log(`Channel: ${video.snippet.channelTitle}`)
      console.log(`Published At: ${video.snippet.publishedAt}`)
      console.log(`View Count: ${video.statistics.viewCount}`)
      console.log(`Duration (ISO 8601): ${video.contentDetails.duration}`)

      return video
   } catch (error) {
      console.error('Fetch Error:', error)
      return null
   }
}

async function mapGames(identifiedGames) {
   // Placeholder function to map identified games to a database or API
   console.log('Mapping identified games:', identifiedGames)
   return identifiedGames
}
