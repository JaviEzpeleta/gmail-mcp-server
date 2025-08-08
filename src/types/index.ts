import { gmail_v1 } from "googleapis"

export interface EmailDetails {
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

export interface ForwardedContentResult {
  success: boolean
  source?: "message/rfc822" | "inline" | "unknown"
  depth?: number
  original_headers?: {
    from?: string
    to?: string
    subject?: string
    date?: string
    messageId?: string
  }
  original_content?: {
    text?: string
    html?: string
  }
  forwarding_info?: {
    forwarded_by?: string
    forward_date?: string
  }
  chain?: Array<{
    headers?: { 
      from?: string
      to?: string
      subject?: string
      date?: string
      messageId?: string 
    }
    preview?: string
  }>
  error?: string
}

export interface ParsedMail {
  from?: { text?: string }
  to?: { text?: string }
  subject?: string
  date?: Date
  headers: Map<string, string | string[]>
  messageId?: string
  text?: string
  html?: string
  htmlAsText?: string
  attachments?: Array<{
    contentType?: string
    content?: Buffer
  }>
}

export interface GmailConfig {
  clientId: string
  clientSecret: string
  refreshToken: string
  allowDirectSend: boolean
}

export type GmailClient = gmail_v1.Gmail