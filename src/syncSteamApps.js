import fetch from 'node-fetch'
import pg from 'pg'

const STEAM_URL = `https://partner.steam-api.com/IStoreService/GetAppList/v1/?key=${process.env.STEAM_API_KEY}`

const pool = new pg.Pool({
   connectionString: process.env.DATABASE_URL,
})

async function fetchSteamApps() {
   console.log('Fetching Steam apps from API...')

   const response = await fetch(STEAM_URL, { timeout: 60000 })
   console.log('Response status:', response.status)
   if (!response.ok) {
      throw new Error(`Failed to fetch Steam apps: ${response.statusText}`)
   }

   const data = await response.json()
   return data.applist.apps
}

async function syncSteamApps() {
   const apps = await fetchSteamApps()

   const client = await pool.connect()
   try {
      console.log(`Fetched ${apps.length} apps from Steam.`)

      await client.query('BEGIN')

      // 1. Clear stage
      await client.query('TRUNCATE games.steam_apps_stage')

      // 2. COPY stream (special)
      const copyStream = client.query(
         copyFrom(
            'COPY games.steam_apps_stage (appid, name) FROM STDIN WITH (FORMAT csv)'
         )
      )

      for (const app of apps) {
         if (!app.name) continue
         copyStream.write(`${app.appid},"${app.name.replace(/"/g, '""')}"\n`)
      }

      copyStream.end()
      await new Promise((resolve, reject) => {
         copyStream.on('finish', resolve)
         copyStream.on('error', reject)
      })

      // 3. Upsert
      await client.query(`
        INSERT INTO steam_apps (appid, name, normalized_name, last_seen_at)
        SELECT
        appid,
        name,
        normalize_steam_name(name),
        NOW()
        FROM steam_apps_stage
        ON CONFLICT (appid)
        DO UPDATE SET
        name = EXCLUDED.name,
        normalized_name = EXCLUDED.normalized_name,
        last_seen_at = NOW()
    `)

      await client.query('COMMIT')
   } catch (err) {
      await client.query('ROLLBACK')
      throw err
   } finally {
      client.release()
   }
}

syncSteamApps()
   .then(() => {
      console.log('Steam apps sync completed successfully.')
   })
   .catch((err) => {
      console.error('Error syncing Steam apps:', err)
   })
