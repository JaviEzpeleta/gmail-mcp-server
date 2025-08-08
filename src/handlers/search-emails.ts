import { GmailService } from "../services/gmail.service"
import { SearchEmailsSchema } from "../schemas/tool-schemas"

export async function handleSearchEmails(
  gmailService: GmailService,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = SearchEmailsSchema.parse(args || {})
    
    const messages = await gmailService.listEmails({
      maxResults: input.maxResults,
      query: input.query,
      includeSpamTrash: input.includeSpamTrash,
    })

    if (messages.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `📭 No emails found for query: "${input.query}"\n\n💡 Try different search terms or check the Gmail search syntax guide.`,
          },
        ],
      }
    }

    const emailDetails = messages.map((message) => 
      gmailService.parseEmailDetails(message)
    )

    let response_text = `🔍 **Search Results for: "${input.query}"**\n`
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