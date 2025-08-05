// get-refresh-token-desktop.ts
import "dotenv/config"
import { google } from "googleapis"
import * as http from "http"
import * as url from "url"
import { exec } from "child_process"

const CLIENT_ID = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Error: Faltan variables de entorno GMAIL_CLIENT_ID y GMAIL_CLIENT_SECRET")
  console.error("Asegúrate de tener estas variables en tu archivo .env")
  process.exit(1)
}

// Para Desktop apps, podemos usar localhost o el URI especial de Google
const REDIRECT_URI = "http://localhost:3000/oauth2callback"
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
  // Crear servidor temporal para capturar el código
  const server = http.createServer(async (req, res) => {
    if (req.url && req.url.indexOf("/oauth2callback") > -1) {
      const qs = new url.URL(req.url, `http://localhost:3000`).searchParams
      const code = qs.get("code")

      res.end("✅ Autorización recibida! Puedes cerrar esta ventana.")
      server.close()

      if (code) {
        try {
          const { tokens } = await oauth2Client.getToken(code)

          console.log("\n✅ ¡ÉXITO! Aquí están tus tokens:\n")
          console.log("=".repeat(50))
          console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`)
          console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`)
          console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`)
          console.log("=".repeat(50))
          console.log("\n💾 Guarda estas variables en tu archivo .env")
          console.log("📝 El refresh token es permanente - no lo pierdas!\n")

          process.exit(0)
        } catch (error) {
          console.error("❌ Error obteniendo tokens:", error)
          process.exit(1)
        }
      }
    }
  })

  server.listen(3000, () => {
    // Generar URL de autorización
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      prompt: "consent",
    })

    console.log("🚀 Abriendo navegador para autorización...\n")

    // Intentar abrir el navegador automáticamente
    const start =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
        ? "start"
        : "xdg-open"

    exec(`${start} "${authUrl}"`, (error) => {
      if (error) {
        console.log("No se pudo abrir el navegador automáticamente.")
        console.log("Por favor, abre esta URL manualmente:\n")
        console.log(authUrl)
      }
    })

    console.log("\n⏳ Esperando autorización...")
  })
}

// Ejecutar
console.log("🔐 Gmail OAuth Setup para Terminal/CLI\n")
getRefreshToken()
