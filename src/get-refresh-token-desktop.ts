// get-refresh-token-desktop.ts
import "dotenv/config"
import { google } from "googleapis"
import * as http from "http"
import * as url from "url"
import { exec } from "child_process"

const CLIENT_ID = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const OAUTH_REDIRECT_PORT = parseInt(process.env.OAUTH_REDIRECT_PORT || "8765", 10)

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Error: Missing GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET environment variables")
  console.error("Make sure you have these variables in your .env file")
  process.exit(1)
}

// For Desktop apps, we can use localhost with configurable port
const REDIRECT_URI = `http://localhost:${OAUTH_REDIRECT_PORT}/oauth2callback`
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
)

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
]

async function getRefreshToken() {
  // Create temporary server to capture the authorization code
  const server = http.createServer(async (req, res) => {
    if (req.url && req.url.indexOf("/oauth2callback") > -1) {
      const qs = new url.URL(req.url, `http://localhost:${OAUTH_REDIRECT_PORT}`).searchParams
      const code = qs.get("code")

      res.end("✅ Authorization received! You can close this window.")
      server.close()

      if (code) {
        try {
          const { tokens } = await oauth2Client.getToken(code)

          console.log("\n✅ SUCCESS! Here are your tokens:\n")
          console.log("=".repeat(50))
          console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`)
          console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`)
          console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`)
          console.log("=".repeat(50))
          console.log("\n💾 Save these variables to your .env file")
          console.log("📝 The refresh token is permanent - don't lose it!\n")

          process.exit(0)
        } catch (error) {
          console.error("❌ Error obtaining tokens:", error)
          process.exit(1)
        }
      }
    }
  })

  server.listen(OAUTH_REDIRECT_PORT, () => {
    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      prompt: "consent",
    })

    console.log("🚀 Opening browser for authorization...\n")

    // Try to open browser automatically
    const start =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
        ? "start"
        : "xdg-open"

    exec(`${start} "${authUrl}"`, (error) => {
      if (error) {
        console.log("Could not open browser automatically.")
        console.log("Please open this URL manually:\n")
        console.log(authUrl)
      }
    })

    console.log("\n⏳ Waiting for authorization...")
  })
}

// Execute
console.log("🔐 Gmail OAuth Setup for Terminal/CLI")
console.log(`🔧 Using OAuth redirect port: ${OAUTH_REDIRECT_PORT} ${OAUTH_REDIRECT_PORT !== 8765 ? "(custom)" : "(default)"}\n`)
getRefreshToken()