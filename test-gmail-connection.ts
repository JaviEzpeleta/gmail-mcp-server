import "dotenv/config"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"

// Configuración OAuth2
const CLIENT_ID = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN

console.log("🔍 Verificando variables de entorno...")
console.log("CLIENT_ID:", CLIENT_ID ? "✅ Configurado" : "❌ Falta")
console.log("CLIENT_SECRET:", CLIENT_SECRET ? "✅ Configurado" : "❌ Falta")
console.log("REFRESH_TOKEN:", REFRESH_TOKEN ? "✅ Configurado" : "❌ Falta")

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error("\n❌ Error: Faltan variables de entorno requeridas")
  process.exit(1)
}

const oauth2Client = new OAuth2Client(
  CLIENT_ID,
  CLIENT_SECRET,
  "http://localhost"
)

oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
})

const gmail = google.gmail({ version: "v1", auth: oauth2Client })

console.log("\n🔄 Intentando conectar con Gmail API...")

async function testConnection() {
  try {
    // Intenta obtener el perfil del usuario
    const profile = await gmail.users.getProfile({ userId: "me" })
    console.log("\n✅ Conexión exitosa!")
    console.log("📧 Email:", profile.data.emailAddress)
    console.log("📊 Total de mensajes:", profile.data.messagesTotal)
    console.log("📈 Total de threads:", profile.data.threadsTotal)
    
    // Intenta listar algunos mensajes
    console.log("\n📬 Probando listar mensajes...")
    const messages = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5
    })
    
    if (messages.data.messages) {
      console.log(`✅ Se encontraron ${messages.data.messages.length} mensajes`)
    } else {
      console.log("📭 No se encontraron mensajes")
    }
    
  } catch (error: any) {
    console.error("\n❌ Error conectando con Gmail:")
    console.error("Tipo de error:", error.name)
    console.error("Mensaje:", error.message)
    
    if (error.response) {
      console.error("Status:", error.response.status)
      console.error("Status Text:", error.response.statusText)
      console.error("Data:", JSON.stringify(error.response.data, null, 2))
    }
    
    if (error.message.includes("invalid_grant")) {
      console.error("\n🔑 El refresh token parece estar expirado o ser inválido.")
      console.error("Necesitas generar un nuevo refresh token.")
    }
  }
}

testConnection()