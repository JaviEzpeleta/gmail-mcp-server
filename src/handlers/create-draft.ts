import { GmailService } from "../services/gmail.service"
import { CreateDraftSchema } from "../schemas/tool-schemas"
import { encodeToBase64Url, encodeSubject } from "../utils/email-parser"

export async function handleCreateDraft(
  gmailService: GmailService,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = CreateDraftSchema.parse(args || {})
    
    const messageParts = [
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      `To: ${input.to}`,
    ]

    if (input.cc) messageParts.push(`Cc: ${input.cc}`)
    if (input.bcc) messageParts.push(`Bcc: ${input.bcc}`)

    messageParts.push(`Subject: ${encodeSubject(input.subject)}`)

    let threadingInfo = ""
    if (input.inReplyToMessageId) {
      messageParts.push(`In-Reply-To: ${input.inReplyToMessageId}`)
      messageParts.push(`References: ${input.inReplyToMessageId}`)
      threadingInfo = "✅ Threaded (will appear in conversation)"
    } else if (input.threadId) {
      threadingInfo = "⚠️ Partial threading (threadId only)"
    } else {
      threadingInfo = "📧 Standalone draft (new conversation)"
    }

    messageParts.push("", input.body)

    const message = messageParts.join("\r\n")
    const encodedMessage = encodeToBase64Url(message)

    const result = await gmailService.createDraft(encodedMessage, input.threadId)

    return {
      content: [
        {
          type: "text",
          text: `✅ **EMAIL DRAFT CREATED (Safe Mode)** 📝

📝 **Draft Details:**
• To: ${input.to}
• Subject: ${input.subject}
• Draft ID: ${result.id}
${input.cc ? `• CC: ${input.cc}\n` : ""}${input.bcc ? `• BCC: ${input.bcc}\n` : ""}${input.threadId ? `• Thread ID: ${input.threadId}\n` : ""}${input.inReplyToMessageId ? `• Reply to Message: ${input.inReplyToMessageId}\n` : ""}
🧵 **Threading:** ${threadingInfo}

🛡️ **SAFETY NOTICE:** This is a DRAFT only - no email has been sent.
📬 **Next steps:** Go to Gmail → ${input.threadId ? "Inbox → Find original conversation" : "Drafts"} → Edit and review → Send when ready.
💡 **Tip:** ${input.threadId || input.inReplyToMessageId ? "This draft will appear in the existing email thread." : "Always review drafts before sending to ensure accuracy."}`,
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