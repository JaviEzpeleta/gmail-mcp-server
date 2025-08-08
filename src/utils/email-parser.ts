import { gmail_v1 } from "googleapis"
import { EmailDetails, ForwardedContentResult, ParsedMail } from "../types"

const { simpleParser } = require("mailparser") as { 
  simpleParser: (input: Buffer | string) => Promise<ParsedMail> 
}

export function extractEmailBody(message: gmail_v1.Schema$Message): string {
  const payload = message.payload
  if (!payload) return "No content available"

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8")
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8")
      }
    }
    
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        const html = Buffer.from(part.body.data, "base64").toString("utf-8")
        return html.replace(/<[^>]*>/g, "")
      }
    }
  }

  return "No readable content found"
}

export function decodeBase64Url(data: string): Buffer {
  const padLength = (4 - (data.length % 4)) % 4
  const padded = data + "=".repeat(padLength)
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/")
  return Buffer.from(base64, "base64")
}

export function encodeToBase64Url(message: string): string {
  return Buffer.from(message, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`
}

export function extractEmailAddress(fromHeader: string): string {
  const emailRegex = /<([^<>]+@[^<>]+)>/
  const simpleEmailRegex = /([^\s<>]+@[^\s<>]+)/

  const complexMatch = fromHeader.match(emailRegex)
  const simpleMatch = fromHeader.match(simpleEmailRegex)

  if (complexMatch) {
    return complexMatch[1]
  } else if (simpleMatch) {
    return simpleMatch[1]
  } else {
    const emailValidationRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailValidationRegex.test(fromHeader) ? fromHeader : ""
  }
}

export function validateEmailAddress(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function formatEmailDetails(email: EmailDetails): string {
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

function headersFromParsedMail(pm: ParsedMail): {
  from?: string
  to?: string
  subject?: string
  date?: string
  messageId?: string
} {
  return {
    from: pm.from?.text,
    to: pm.to?.text,
    subject: pm.subject || undefined,
    date: pm.date ? pm.date.toUTCString() : pm.headers.get("date") as string | undefined,
    messageId: (pm.messageId as string | undefined) || (pm.headers.get("message-id") as string | undefined),
  }
}

function tryExtractInlineForwardText(text?: string): { 
  headers?: { from?: string; to?: string; subject?: string; date?: string }, 
  body?: string 
} | undefined {
  if (!text) return undefined
  const pattern = /(?:^-+\s*Forwarded message\s*-+\s*$\n)?\s*From:\s*(.+)\nDate:\s*(.+)\nSubject:\s*(.+)\nTo:\s*(.+)\n\n([\s\S]*)/im
  const m = text.match(pattern)
  if (!m) return undefined
  const [, from, date, subject, to, body] = m
  return {
    headers: { from: from?.trim(), date: date?.trim(), subject: subject?.trim(), to: to?.trim() },
    body: body?.trim(),
  }
}

export async function extractForwardedContentFromRaw(
  rawBase64Url: string, 
  options: { includeHtml: boolean; maxDepth: number }
): Promise<ForwardedContentResult> {
  try {
    const rawBuffer = decodeBase64Url(rawBase64Url)
    const parsed = await simpleParser(rawBuffer)

    const chain: ForwardedContentResult["chain"] = []

    const rfc822Attachment = (parsed.attachments || []).find(
      (a: any) => a.contentType?.toLowerCase() === "message/rfc822"
    )
    
    if (rfc822Attachment) {
      const nested = await simpleParser(rfc822Attachment.content as Buffer)
      chain.push({ 
        headers: headersFromParsedMail(nested), 
        preview: (nested.text || nested.htmlAsText || "").slice(0, 200) 
      })

      let current: ParsedMail | undefined = nested
      let depth = 1
      while (depth < options.maxDepth) {
        const nextAtt = (current.attachments || []).find(
          (a: any) => a.contentType?.toLowerCase() === "message/rfc822"
        )
        if (!nextAtt) break
        const nextParsed = await simpleParser(nextAtt.content as Buffer)
        chain.push({ 
          headers: headersFromParsedMail(nextParsed), 
          preview: (nextParsed.text || nextParsed.htmlAsText || "").slice(0, 200) 
        })
        current = nextParsed
        depth += 1
      }

      const last = current || nested
      return {
        success: true,
        source: "message/rfc822",
        depth: chain.length,
        original_headers: headersFromParsedMail(last),
        original_content: {
          text: last.text || last.htmlAsText || undefined,
          html: options.includeHtml ? last.html || undefined : undefined,
        },
        chain,
      }
    }

    const inline = tryExtractInlineForwardText(parsed.text || parsed.htmlAsText)
    if (inline) {
      return {
        success: true,
        source: "inline",
        depth: 1,
        original_headers: inline.headers,
        original_content: { text: inline.body },
        chain,
      }
    }

    return {
      success: false,
      source: "unknown",
      depth: 0,
      original_headers: headersFromParsedMail(parsed),
      original_content: {
        text: parsed.text || parsed.htmlAsText || undefined,
        html: options.includeHtml ? parsed.html || undefined : undefined,
      },
      chain,
      error: "Could not confidently detect forwarded content",
    }
  } catch (e: any) {
    return { success: false, error: e?.message || String(e) }
  }
}