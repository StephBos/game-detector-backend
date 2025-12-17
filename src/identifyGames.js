require('dotenv').config()
const { GoogleGenAI } = require('@google/genai')
const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_KEY })

async function identifyGame(reqBody) {
   const videoDetails = await getVideoById(reqBody.videoId)
}

async function identifyGameFromVideoDetails(videoId) {
   const videoDetails = await getVideoById(videoId)
   console.log('videoDetails:', videoDetails)
   const gameDetailsFromTitle = identifyGameFromTitle(
      videoDetails.snippet.title
   )
}

async function getVideoById(videoId) {
   console.log('Getting video by ID:', videoId)
   console.log('Using YouTube API Key:', process.env.GOOGLE_KEY)
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

module.exports = { identifyGame }
