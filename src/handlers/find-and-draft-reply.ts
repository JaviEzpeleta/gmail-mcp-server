import { GmailService } from "../services/gmail.service"
import { FindAndDraftReplySchema } from "../schemas/tool-schemas"
import { encodeToBase64Url, encodeSubject, extractEmailAddress } from "../utils/email-parser"

export async function handleFindAndDraftReply(
  gmailService: GmailService,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = FindAndDraftReplySchema.parse(args || {})
    
    const searchQuery = `from:${input.senderName} -in:sent`
    
    const messages = await gmailService.listEmails({
      query: searchQuery,
      maxResults: 1,
    })

    if (messages.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `📭 No emails found from "${input.senderName}"\n\n💡 Try using:\n• Full email address (user@example.com)\n• Different name variation\n• Check if you received emails from this sender recently`,
          },
        ],
      }
    }

    const latestMessage = messages[0]
    const headers = gmailService.extractHeaders(latestMessage)
    const emailDetails = gmailService.parseEmailDetails(latestMessage)

    const originalSubject = headers["Subject"] || "(No subject)"
    const fromEmail = headers["From"] || "Unknown"
    const messageId = headers["Message-ID"] || ""
    const date = headers["Date"] || ""
    const existingReferences = headers["References"] || ""

    if (!latestMessage.threadId) {
      console.warn("Warning: No threadId found for email, draft may not thread properly")
    }
    if (!messageId) {
      console.warn("Warning: No Message-ID found for email, threading may be incomplete")
    }

    const replyToEmail = extractEmailAddress(fromEmail)
    
    if (!replyToEmail) {
      throw new Error(`Could not extract valid email address from: ${fromEmail}`)
    }

    const replySubject = originalSubject.startsWith("Re: ")
      ? originalSubject
      : `Re: ${originalSubject}`

    const referencesHeader = existingReferences
      ? `${existingReferences} ${messageId}`.trim()
      : messageId

    const draftMessage = [
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      `To: ${replyToEmail}`,
      `Subject: ${encodeSubject(replySubject)}`,
      messageId ? `In-Reply-To: ${messageId}` : "",
      referencesHeader ? `References: ${referencesHeader}` : "",
      "",
      input.replyBody || `Hi,

[Write your reply here]

Best regards`,
    ]
      .filter((line) => line !== "")
      .join("\n")

    const encodedDraftMessage = encodeToBase64Url(draftMessage)

    const draftResult = await gmailService.createDraft(
      encodedDraftMessage,
      latestMessage.threadId || undefined
    )

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
• Preview: ${emailDetails.snippet?.substring(0, 150)}${
            (emailDetails.snippet?.length || 0) > 150 ? "..." : ""
          }

📝 **Draft created:**
• To: ${replyToEmail}
• Subject: ${replySubject}
• Draft ID: ${draftResult.id}
• Thread ID: ${latestMessage.threadId}
• Threading: ${messageId ? "✅ Properly threaded" : "⚠️ Limited threading"}

🧵 **THREADING STATUS:** This draft will appear in your inbox as part of the original email conversation.
🛡️ **SAFETY NOTICE:** This is a DRAFT only - no email has been sent.
📬 **Next steps:** Go to Gmail → Inbox → Find original email → View conversation → Edit draft → Send when ready.
💡 **Custom content:** ${input.replyBody ? "Your custom reply body was used." : "Template reply was used - edit to personalize."}`,
        },
      ],
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return {
        content: [
          {
            type: "text",
            text: `❌ Invalid input: ${error.errors.map((e: any) => e.message).join(', ')}`
          }
        ]
      }
    }
    
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