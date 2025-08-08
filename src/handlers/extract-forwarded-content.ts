import { GmailService } from "../services/gmail.service"
import { ExtractForwardedContentSchema } from "../schemas/tool-schemas"
import { extractForwardedContentFromRaw } from "../utils/email-parser"
import { ForwardedContentResult } from "../types"

export async function handleExtractForwardedContent(
  gmailService: GmailService,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    const input = ExtractForwardedContentSchema.parse(args || {})
    
    const detail = await gmailService.getClient().users.messages.get({ 
      userId: "me", 
      id: input.emailId, 
      format: "raw" 
    })
    
    const raw = detail.data.raw
    if (!raw) {
      throw new Error("RAW payload not available for this message")
    }

    const result = await extractForwardedContentFromRaw(raw, { 
      includeHtml: input.includeHtml || false, 
      maxDepth: Math.max(1, Math.min(10, input.maxDepth || 3)) 
    })

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
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
    
    console.error("Error extracting forwarded content:", error)
    const fail: ForwardedContentResult = { 
      success: false, 
      error: error?.message || String(error) 
    }
    return { 
      content: [
        { 
          type: "text", 
          text: JSON.stringify(fail, null, 2) 
        }
      ] 
    }
  }
}