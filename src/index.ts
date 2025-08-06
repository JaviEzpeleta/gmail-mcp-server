import "dotenv/config"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { google, gmail_v1 } from "googleapis"
import { OAuth2Client } from "google-auth-library"

// Type definitions
interface EmailDetails {
  id: string
  subject: string
  from: string
  to?: string
  date: string
  snippet: string
  body?: string
  labels?: string[]
  threadId?: string
}

// OAuth2 Configuration
const CLIENT_ID = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN
const ALLOW_DIRECT_SEND = process.env.GMAIL_ALLOW_DIRECT_SEND === "true"

// Validate environment variables
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error("❌ Error: Missing required environment variables")
  console.error("\n📋 Required variables:")
  console.error("  • GMAIL_CLIENT_ID")
  console.error("  • GMAIL_CLIENT_SECRET")
  console.error("  • GMAIL_REFRESH_TOKEN")
  console.error("\n🔧 Optional variables:")
  console.error("  • GMAIL_ALLOW_DIRECT_SEND=true (enables direct email sending)")
  console.error("\n💡 Run 'npm run setup' to generate these credentials")
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

const gmail: gmail_v1.Gmail = google.gmail({
  version: "v1",
  auth: oauth2Client,
})

// Create MCP server
const server = new Server(
  {
    name: "gmail-mcp-server",
    version: "1.3.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Helper function to extract email body
function extractEmailBody(message: gmail_v1.Schema$Message): string {
  const payload = message.payload
  if (!payload) return "No content available"

  // Simple messages
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8")
  }

  // Multipart messages
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8")
      }
    }
    // If no plain text, try HTML
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        const html = Buffer.from(part.body.data, "base64").toString("utf-8")
        // Basic HTML to text conversion
        return html.replace(/<[^>]*>/g, "")
      }
    }
  }

  return "No readable content found"
}

// Helper function to format email details
function formatEmailDetails(email: EmailDetails): string {
  let formatted = `📧 **${email.subject}**\n`
  formatted += `👤 From: ${email.from}\n`
  if (email.to) formatted += `📬 To: ${email.to}\n`
  formatted += `📅 Date: ${email.date}\n`
  if (email.labels && email.labels.length > 0) {
    formatted += `🏷️ Labels: ${email.labels.join(", ")}\n`
  }
  formatted += `\n📝 Preview: ${email.snippet}\n`
  if (email.body) {
    formatted += `\n📄 Full Content:\n${email.body}\n`
  }
  return formatted
}

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_emails",
        description: "List recent emails with optional filtering",
        inputSchema: {
          type: "object",
          properties: {
            maxResults: {
              type: "number",
              description: "Maximum number of emails to return (1-100)",
              default: 10,
              minimum: 1,
              maximum: 100,
            },
            query: {
              type: "string",
              description:
                "Gmail search query (e.g., 'is:unread', 'from:user@example.com')",
              default: "",
            },
            includeSpamTrash: {
              type: "boolean",
              description: "Include emails from SPAM and TRASH folders",
              default: false,
            },
          },
        },
      },
      {
        name: "get_email_details",
        description: "Get full details and content of a specific email by ID",
        inputSchema: {
          type: "object",
          properties: {
            emailId: {
              type: "string",
              description: "The email ID to retrieve",
            },
            format: {
              type: "string",
              description: "Level of detail to retrieve",
              enum: ["full", "minimal", "metadata"],
              default: "full",
            },
          },
          required: ["emailId"],
        },
      },
      {
        name: "send_email",
        description: "Send an email with optional CC/BCC",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "Recipient email address",
            },
            subject: {
              type: "string",
              description: "Email subject",
            },
            body: {
              type: "string",
              description: "Email body (plain text or HTML)",
            },
            cc: {
              type: "string",
              description: "CC recipients (comma-separated)",
            },
            bcc: {
              type: "string",
              description: "BCC recipients (comma-separated)",
            },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "search_emails",
        description: "Search emails using Gmail's advanced search syntax",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Gmail search query (e.g., 'from:user@example.com', 'subject:invoice', 'has:attachment')",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of results (1-100)",
              default: 10,
              minimum: 1,
              maximum: 100,
            },
            includeSpamTrash: {
              type: "boolean",
              description: "Include results from SPAM and TRASH",
              default: false,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "find_and_draft_reply",
        description:
          "Find the latest email from a sender and create a properly threaded draft reply. The draft will appear in the original email conversation in your inbox. RECOMMENDED for replying to existing emails.",
        inputSchema: {
          type: "object",
          properties: {
            senderName: {
              type: "string",
              description:
                "Sender name or email to search for (e.g., 'John', 'user@example.com')",
            },
            replyBody: {
              type: "string",
              description:
                "Custom reply message body. If not provided, a template will be used.",
            },
          },
          required: ["senderName"],
        },
      },
      {
        name: "create_draft",
        description: "Create a new email draft (safer alternative to send_email). For replies to existing emails, consider using find_and_draft_reply instead.",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "Recipient email address",
            },
            subject: {
              type: "string",
              description: "Email subject",
            },
            body: {
              type: "string",
              description: "Email body (plain text or HTML)",
            },
            cc: {
              type: "string",
              description: "CC recipients (comma-separated)",
            },
            bcc: {
              type: "string",
              description: "BCC recipients (comma-separated)",
            },
            threadId: {
              type: "string",
              description: "Optional: Thread ID to add this draft to an existing conversation",
            },
            inReplyToMessageId: {
              type: "string", 
              description: "Optional: Message ID of the email this is replying to (enables proper threading)",
            },
          },
          required: ["to", "subject", "body"],
        },
      },
    ],
  }
})

// Implement tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "list_emails": {
      const args = (request.params.arguments as any) || {}
      const { maxResults = 10, query = "", includeSpamTrash = false } = args

      try {
        const response = await gmail.users.messages.list({
          userId: "me",
          maxResults: Math.min(Math.max(maxResults, 1), 100),
          q: query,
          includeSpamTrash,
        })

        const messages = response.data.messages || []

        if (messages.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "📭 No emails found matching your criteria.",
              },
            ],
          }
        }

        // Get details for each message
        const emailDetails: EmailDetails[] = await Promise.all(
          messages.slice(0, maxResults).map(async (message) => {
            const detail = await gmail.users.messages.get({
              userId: "me",
              id: message.id!,
            })

            const headers = detail.data.payload?.headers || []
            const subject =
              headers.find((h) => h.name === "Subject")?.value || "(No subject)"
            const from =
              headers.find((h) => h.name === "From")?.value || "Unknown"
            const to =
              headers.find((h) => h.name === "To")?.value ||
              undefined ||
              undefined
            const date = headers.find((h) => h.name === "Date")?.value || ""
            const labels = detail.data.labelIds || []

            return {
              id: message.id!,
              subject,
              from,
              to,
              date,
              snippet: detail.data.snippet || "",
              labels,
              threadId: detail.data.threadId || undefined,
            }
          })
        )

        let response_text = `📬 **Found ${emailDetails.length} email${
          emailDetails.length !== 1 ? "s" : ""
        }**\n\n`

        emailDetails.forEach((email, index) => {
          response_text += `**${index + 1}. ${email.subject}**\n`
          response_text += `   📤 From: ${email.from}\n`
          response_text += `   📅 Date: ${email.date}\n`
          response_text += `   🆔 ID: ${email.id}\n`
          if (email.labels && email.labels.length > 0) {
            response_text += `   🏷️ Labels: ${email.labels.join(", ")}\n`
          }
          response_text += `   📝 Preview: ${email.snippet.substring(0, 100)}${
            email.snippet.length > 100 ? "..." : ""
          }\n\n`
        })

        return {
          content: [
            {
              type: "text",
              text: response_text,
            },
          ],
        }
      } catch (error: any) {
        console.error("Error listing emails:", error)
        return {
          content: [
            {
              type: "text",
              text: `❌ Error listing emails: ${
                error.message || error
              }\n\n💡 Tip: Check your authentication credentials and Gmail API permissions.`,
            },
          ],
        }
      }
    }

    case "get_email_details": {
      const args = (request.params.arguments as any) || {}
      const { emailId, format = "full" } = args

      try {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: emailId,
          format: format === "full" ? "full" : format,
        })

        const headers = detail.data.payload?.headers || []
        const subject =
          headers.find((h) => h.name === "Subject")?.value || "(No subject)"
        const from = headers.find((h) => h.name === "From")?.value || "Unknown"
        const to = headers.find((h) => h.name === "To")?.value || undefined
        const date = headers.find((h) => h.name === "Date")?.value || ""
        const labels = detail.data.labelIds || []

        const emailDetail: EmailDetails = {
          id: emailId,
          subject,
          from,
          to,
          date,
          snippet: detail.data.snippet || "",
          labels,
          threadId: detail.data.threadId || undefined,
        }

        if (format === "full" && detail.data.payload) {
          emailDetail.body = extractEmailBody(detail.data)
        }

        return {
          content: [
            {
              type: "text",
              text: formatEmailDetails(emailDetail),
            },
          ],
        }
      } catch (error: any) {
        console.error("Error getting email details:", error)
        return {
          content: [
            {
              type: "text",
              text: `❌ Error getting email details: ${
                error.message || error
              }\n\n💡 Make sure the email ID is valid. You can get email IDs using list_emails or search_emails.`,
            },
          ],
        }
      }
    }

    case "send_email": {
      const args = (request.params.arguments as any) || {}
      const { to, subject, body, cc, bcc } = args

      // ⚠️ SECURITY CHECK: Direct email sending is disabled by default
      if (!ALLOW_DIRECT_SEND) {
        return {
          content: [
            {
              type: "text",
              text: `🚨 **SECURITY: Direct email sending is disabled**

❌ **send_email** tool is disabled for safety to prevent accidental sends.

💡 **Safe alternatives:**
• Use **create_draft** to create an email draft instead
• Use **find_and_draft_reply** to reply to existing emails as drafts
• Set GMAIL_ALLOW_DIRECT_SEND=true in your .env to enable direct sending

🛡️ **Why this protection exists:**
This prevents AI assistants from accidentally sending emails without your review.
Always prefer creating drafts that you can review and send manually.`,
            },
          ],
        }
      }

      try {
        // Validate email addresses
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(to)) {
          throw new Error(`Invalid recipient email address: ${to}`)
        }

        const messageParts = [
          `MIME-Version: 1.0`,
          `Content-Type: text/plain; charset=UTF-8`,
          `To: ${to}`,
        ]

        if (cc) messageParts.push(`Cc: ${cc}`)
        if (bcc) messageParts.push(`Bcc: ${bcc}`)

        messageParts.push(`Subject: ${subject}`, "", body)

        const message = messageParts.join("\n")

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
              text: `🚨 **EMAIL SENT DIRECTLY!** ⚠️

✅ **Email sent successfully!**

📧 To: ${to}
📋 Subject: ${subject}
🆔 Message ID: ${result.data.id}
${cc ? `📄 CC: ${cc}\n` : ""}${bcc ? `🔒 BCC: ${bcc}\n` : ""}

⚠️ **IMPORTANT:** This email was sent immediately without creating a draft.
💡 **Next time:** Consider using **create_draft** or **find_and_draft_reply** for safer email handling.`,
            },
          ],
        }
      } catch (error: any) {
        console.error("Error sending email:", error)
        return {
          content: [
            {
              type: "text",
              text: `❌ Error sending email: ${
                error.message || error
              }\n\n💡 Check that the recipient address is valid and you have send permissions.`,
            },
          ],
        }
      }
    }

    case "search_emails": {
      const args = (request.params.arguments as any) || {}
      const { query, maxResults = 10, includeSpamTrash = false } = args

      try {
        if (!query || query.trim() === "") {
          throw new Error("Search query cannot be empty")
        }

        const response = await gmail.users.messages.list({
          userId: "me",
          q: query,
          maxResults: Math.min(Math.max(maxResults, 1), 100),
          includeSpamTrash,
        })

        const messages = response.data.messages || []

        if (messages.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `📭 No emails found for query: "${query}"\n\n💡 Try different search terms or check the Gmail search syntax guide.`,
              },
            ],
          }
        }

        const emailDetails: EmailDetails[] = await Promise.all(
          messages.map(async (message) => {
            const detail = await gmail.users.messages.get({
              userId: "me",
              id: message.id!,
            })

            const headers = detail.data.payload?.headers || []
            const subject =
              headers.find((h) => h.name === "Subject")?.value || "(No subject)"
            const from =
              headers.find((h) => h.name === "From")?.value || "Unknown"
            const date = headers.find((h) => h.name === "Date")?.value || ""
            const labels = detail.data.labelIds || []

            return {
              id: message.id!,
              subject,
              from,
              date,
              snippet: detail.data.snippet || "",
              labels,
              threadId: detail.data.threadId || undefined,
            }
          })
        )

        let response_text = `🔍 **Search Results for: "${query}"**\n`
        response_text += `📊 Found ${emailDetails.length} email${
          emailDetails.length !== 1 ? "s" : ""
        }\n\n`

        emailDetails.forEach((email, index) => {
          response_text += `**${index + 1}. ${email.subject}**\n`
          response_text += `   📤 From: ${email.from}\n`
          response_text += `   📅 Date: ${email.date}\n`
          response_text += `   🆔 ID: ${email.id}\n`
          if (email.labels && email.labels.length > 0) {
            response_text += `   🏷️ Labels: ${email.labels.join(", ")}\n`
          }
          response_text += `   📝 Preview: ${email.snippet.substring(0, 100)}${
            email.snippet.length > 100 ? "..." : ""
          }\n\n`
        })

        return {
          content: [
            {
              type: "text",
              text: response_text,
            },
          ],
        }
      } catch (error: any) {
        console.error("Error searching emails:", error)
        return {
          content: [
            {
              type: "text",
              text: `❌ Error searching emails: ${
                error.message || error
              }\n\n💡 Check your search query syntax. Examples:\n  • from:user@example.com\n  • subject:"important"\n  • has:attachment\n  • is:unread`,
            },
          ],
        }
      }
    }

    case "find_and_draft_reply": {
      const args = (request.params.arguments as any) || {}
      const { senderName, replyBody } = args

      try {
        if (!senderName || senderName.trim() === "") {
          throw new Error("Sender name cannot be empty")
        }

        // Search for emails from the specific sender (excluding sent items to avoid replying to our own emails)
        const searchQuery = `from:${senderName} -in:sent`

        const response = await gmail.users.messages.list({
          userId: "me",
          q: searchQuery,
          maxResults: 1, // Only need the most recent
        })

        const messages = response.data.messages || []

        if (messages.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `📭 No emails found from "${senderName}"\n\n💡 Try using:\n• Full email address (user@example.com)\n• Different name variation\n• Check if you received emails from this sender recently`,
              },
            ],
          }
        }

        // Get details of the most recent email
        const latestMessage = messages[0]
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: latestMessage.id!,
          format: "full", // Get full message for complete headers
        })

        const headers = detail.data.payload?.headers || []
        const originalSubject =
          headers.find((h) => h.name === "Subject")?.value || "(No subject)"
        const fromEmail =
          headers.find((h) => h.name === "From")?.value || "Unknown"
        const messageId =
          headers.find((h) => h.name === "Message-ID")?.value || ""
        const date = headers.find((h) => h.name === "Date")?.value || ""
        const existingReferences = 
          headers.find((h) => h.name === "References")?.value || ""

        // Validate that we have threading information
        if (!detail.data.threadId) {
          console.warn("Warning: No threadId found for email, draft may not thread properly")
        }
        if (!messageId) {
          console.warn("Warning: No Message-ID found for email, threading may be incomplete")
        }

        // Extract email address from From header with improved regex
        let replyToEmail = ""
        const emailRegex = /<([^<>]+@[^<>]+)>/
        const simpleEmailRegex = /([^\s<>]+@[^\s<>]+)/
        
        const complexMatch = fromEmail.match(emailRegex)
        const simpleMatch = fromEmail.match(simpleEmailRegex)
        
        if (complexMatch) {
          replyToEmail = complexMatch[1]
        } else if (simpleMatch) {
          replyToEmail = simpleMatch[1]
        } else {
          // Fallback to original fromEmail, but validate it's an email
          const emailValidationRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          replyToEmail = emailValidationRegex.test(fromEmail) ? fromEmail : ""
        }

        if (!replyToEmail) {
          throw new Error(`Could not extract valid email address from: ${fromEmail}`)
        }

        // Create reply subject with proper formatting
        const replySubject = originalSubject.startsWith("Re: ")
          ? originalSubject
          : `Re: ${originalSubject}`

        // Build References header properly (include existing references + original message ID)
        const referencesHeader = existingReferences 
          ? `${existingReferences} ${messageId}`.trim()
          : messageId

        // Create draft reply with proper MIME headers for threading
        const draftMessage = [
          `MIME-Version: 1.0`,
          `Content-Type: text/plain; charset=UTF-8`,
          `Content-Transfer-Encoding: 8bit`,
          `To: ${replyToEmail}`,
          `Subject: ${replySubject}`,
          messageId ? `In-Reply-To: ${messageId}` : "",
          referencesHeader ? `References: ${referencesHeader}` : "",
          "",
          replyBody || `Hi,

[Write your reply here]

Best regards`,
        ]
          .filter((line) => line !== "")
          .join("\n")

        const encodedDraftMessage = Buffer.from(draftMessage, "utf-8")
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "")

        const draftResult = await gmail.users.drafts.create({
          userId: "me",
          requestBody: {
            message: {
              raw: encodedDraftMessage,
              threadId: detail.data.threadId || undefined, // Add draft to original email thread
            },
          },
        })

        return {
          content: [
            {
              type: "text",
              text: `✅ **THREADED DRAFT REPLY CREATED** 🧵📝

📧 **Original email:**
• From: ${fromEmail}
• Subject: ${originalSubject}
• Date: ${date}
• Message ID: ${messageId || "Not found"}
• Preview: ${detail.data.snippet?.substring(0, 150)}${
                (detail.data.snippet?.length || 0) > 150 ? "..." : ""
              }

📝 **Draft created:**
• To: ${replyToEmail}
• Subject: ${replySubject}
• Draft ID: ${draftResult.data.id}
• Thread ID: ${detail.data.threadId}
• Threading: ${messageId ? "✅ Properly threaded" : "⚠️ Limited threading"}

🧵 **THREADING STATUS:** This draft will appear in your inbox as part of the original email conversation.
🛡️ **SAFETY NOTICE:** This is a DRAFT only - no email has been sent.
📬 **Next steps:** Go to Gmail → Inbox → Find original email → View conversation → Edit draft → Send when ready.
💡 **Custom content:** ${replyBody ? "Your custom reply body was used." : "Template reply was used - edit to personalize."}`,
            },
          ],
        }
      } catch (error: any) {
        console.error("Error creating draft reply:", error)
        return {
          content: [
            {
              type: "text",
              text: `❌ Error creating draft reply: ${
                error.message || error
              }\n\n💡 **Troubleshooting tips:**
• Verify sender name/email is correct
• Check that you received emails from this sender
• Ensure Gmail API permissions include draft creation
• Try using exact email address instead of name`,
            },
          ],
        }
      }
    }

    case "create_draft": {
      const args = (request.params.arguments as any) || {}
      const { to, subject, body, cc, bcc, threadId, inReplyToMessageId } = args

      try {
        // Validate email addresses
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(to)) {
          throw new Error(`Invalid recipient email address: ${to}`)
        }

        // Build message headers
        const messageParts = [
          `MIME-Version: 1.0`,
          `Content-Type: text/plain; charset=UTF-8`,
          `To: ${to}`,
        ]

        if (cc) messageParts.push(`Cc: ${cc}`)
        if (bcc) messageParts.push(`Bcc: ${bcc}`)

        messageParts.push(`Subject: ${subject}`)

        // Add threading headers if provided
        let threadingInfo = ""
        if (inReplyToMessageId) {
          messageParts.push(`In-Reply-To: ${inReplyToMessageId}`)
          messageParts.push(`References: ${inReplyToMessageId}`)
          threadingInfo = "✅ Threaded (will appear in conversation)"
        } else if (threadId) {
          threadingInfo = "⚠️ Partial threading (threadId only)"
        } else {
          threadingInfo = "📧 Standalone draft (new conversation)"
        }

        // Add empty line before body
        messageParts.push("", body)

        const message = messageParts.join("\n")

        const encodedMessage = Buffer.from(message)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "")

        // Prepare draft creation request
        const draftRequest: any = {
          userId: "me",
          requestBody: {
            message: {
              raw: encodedMessage,
            },
          },
        }

        // Add threadId if provided
        if (threadId) {
          draftRequest.requestBody.message.threadId = threadId
        }

        const result = await gmail.users.drafts.create(draftRequest)

        return {
          content: [
            {
              type: "text",
              text: `✅ **EMAIL DRAFT CREATED (Safe Mode)** 📝

📝 **Draft Details:**
• To: ${to}
• Subject: ${subject}
• Draft ID: ${result.data.id}
${cc ? `• CC: ${cc}\n` : ""}${bcc ? `• BCC: ${bcc}\n` : ""}${threadId ? `• Thread ID: ${threadId}\n` : ""}${inReplyToMessageId ? `• Reply to Message: ${inReplyToMessageId}\n` : ""}
🧵 **Threading:** ${threadingInfo}

🛡️ **SAFETY NOTICE:** This is a DRAFT only - no email has been sent.
📬 **Next steps:** Go to Gmail → ${threadId ? "Inbox → Find original conversation" : "Drafts"} → Edit and review → Send when ready.
💡 **Tip:** ${threadId || inReplyToMessageId ? "This draft will appear in the existing email thread." : "Always review drafts before sending to ensure accuracy."}`,
            },
          ],
        }
      } catch (error: any) {
        console.error("Error creating draft:", error)
        return {
          content: [
            {
              type: "text",
              text: `❌ Error creating draft: ${
                error.message || error
              }\n\n💡 **Troubleshooting tips:**
• Check that the recipient address is valid
• Verify Gmail API permissions include draft creation
• If using threading parameters, ensure threadId/messageId are valid
• For replies, consider using find_and_draft_reply instead`,
            },
          ],
        }
      }
    }

    default:
      throw new Error(`Unknown tool: ${request.params.name}`)
  }
})

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("✅ Gmail MCP Server started successfully")
  console.error(
    `📧 Connected as: ${process.env.GMAIL_CLIENT_ID?.substring(0, 20)}...`
  )
  console.error(
    "🔧 Tools available: list_emails, get_email_details, send_email, search_emails, find_and_draft_reply, create_draft"
  )
  console.error(
    `🛡️ Security: Direct sending ${ALLOW_DIRECT_SEND ? "ENABLED" : "DISABLED (use create_draft instead)"}`
  )
}

main().catch(console.error)
