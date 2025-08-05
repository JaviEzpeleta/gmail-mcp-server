import "dotenv/config"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { google } from "googleapis"
import { OAuth2Client } from "google-auth-library"

// Configuración OAuth2
const CLIENT_ID = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN

// Validar variables de entorno
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error("❌ Error: Faltan variables de entorno requeridas")
  console.error("Asegúrate de tener en tu archivo .env:")
  console.error("- GMAIL_CLIENT_ID")
  console.error("- GMAIL_CLIENT_SECRET")
  console.error("- GMAIL_REFRESH_TOKEN")
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

// Crear servidor MCP
const server = new Server(
  {
    name: "gmail-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Definir herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_emails",
        description: "Lista los emails más recientes",
        inputSchema: {
          type: "object",
          properties: {
            maxResults: {
              type: "number",
              description: "Número máximo de emails a retornar",
              default: 10,
            },
            query: {
              type: "string",
              description: "Query de búsqueda (ej: 'is:unread')",
              default: "",
            },
          },
        },
      },
      {
        name: "send_email",
        description: "Envía un email",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "Email del destinatario",
            },
            subject: {
              type: "string",
              description: "Asunto del email",
            },
            body: {
              type: "string",
              description: "Cuerpo del mensaje",
            },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "search_emails",
        description: "Busca emails específicos",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Query de búsqueda Gmail (ej: 'from:cliente@example.com')",
            },
            maxResults: {
              type: "number",
              description: "Número máximo de resultados",
              default: 10,
            },
          },
          required: ["query"],
        },
      },
    ],
  }
})

// Implementar las herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "list_emails": {
      const { maxResults = 10, query = "" } = request.params.arguments as any

      try {
        const response = await gmail.users.messages.list({
          userId: "me",
          maxResults,
          q: query,
        })

        const messages = response.data.messages || []

        // Obtener detalles de cada mensaje
        const emailDetails = await Promise.all(
          messages.slice(0, maxResults).map(async (message) => {
            const detail = await gmail.users.messages.get({
              userId: "me",
              id: message.id!,
            })

            const headers = detail.data.payload?.headers || []
            const subject =
              headers.find((h) => h.name === "Subject")?.value || "Sin asunto"
            const from =
              headers.find((h) => h.name === "From")?.value || "Desconocido"
            const date = headers.find((h) => h.name === "Date")?.value || ""

            return {
              id: message.id,
              subject,
              from,
              date,
              snippet: detail.data.snippet,
            }
          })
        )

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(emailDetails, null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listando emails: ${error}`,
            },
          ],
        }
      }
    }

    case "send_email": {
      const { to, subject, body } = request.params.arguments as any

      try {
        const message = [`To: ${to}`, `Subject: ${subject}`, "", body].join(
          "\n"
        )

        const encodedMessage = Buffer.from(message)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "")

        const result = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
          },
        })

        return {
          content: [
            {
              type: "text",
              text: `Email enviado exitosamente. ID: ${result.data.id}`,
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error enviando email: ${error}`,
            },
          ],
        }
      }
    }

    case "search_emails": {
      const { query, maxResults = 10 } = request.params.arguments as any

      try {
        const response = await gmail.users.messages.list({
          userId: "me",
          q: query,
          maxResults,
        })

        const messages = response.data.messages || []

        if (messages.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No se encontraron emails con esa búsqueda.",
              },
            ],
          }
        }

        const emailDetails = await Promise.all(
          messages.map(async (message) => {
            const detail = await gmail.users.messages.get({
              userId: "me",
              id: message.id!,
            })

            const headers = detail.data.payload?.headers || []
            const subject =
              headers.find((h) => h.name === "Subject")?.value || "Sin asunto"
            const from =
              headers.find((h) => h.name === "From")?.value || "Desconocido"
            const date = headers.find((h) => h.name === "Date")?.value || ""

            return {
              id: message.id,
              subject,
              from,
              date,
              snippet: detail.data.snippet,
            }
          })
        )

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(emailDetails, null, 2),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error buscando emails: ${error}`,
            },
          ],
        }
      }
    }

    default:
      throw new Error(`Herramienta desconocida: ${request.params.name}`)
  }
})

// Iniciar servidor
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("✅ Servidor Gmail MCP iniciado 🐣")
}

main().catch(console.error)
