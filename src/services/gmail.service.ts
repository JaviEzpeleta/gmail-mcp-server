import { google, gmail_v1 } from "googleapis"
import { OAuth2Client } from "google-auth-library"
import { GmailConfig, EmailDetails, GmailClient } from "../types"
import { extractEmailBody } from "../utils/email-parser"

export class GmailService {
  private gmail: GmailClient
  private config: GmailConfig

  constructor(config: GmailConfig) {
    this.config = config
    
    const oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      "http://localhost"
    )

    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    })

    this.gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    })
  }

  getClient(): GmailClient {
    return this.gmail
  }

  isDirectSendAllowed(): boolean {
    return this.config.allowDirectSend
  }

  async getEmailDetails(messageId: string, format: "full" | "minimal" | "metadata" = "full"): Promise<gmail_v1.Schema$Message> {
    const response = await this.gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format,
    })
    return response.data
  }

  async listEmails(options: {
    maxResults?: number
    query?: string
    includeSpamTrash?: boolean
  }): Promise<gmail_v1.Schema$Message[]> {
    const response = await this.gmail.users.messages.list({
      userId: "me",
      maxResults: Math.min(Math.max(options.maxResults || 10, 1), 100),
      q: options.query || "",
      includeSpamTrash: options.includeSpamTrash || false,
    })

    const messages = response.data.messages || []
    
    const details = await Promise.all(
      messages.slice(0, options.maxResults || 10).map(async (message) => {
        return this.getEmailDetails(message.id!)
      })
    )

    return details
  }

  async sendEmail(raw: string): Promise<gmail_v1.Schema$Message> {
    const response = await this.gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
      },
    })
    return response.data
  }

  async createDraft(raw: string, threadId?: string): Promise<gmail_v1.Schema$Draft> {
    const requestBody: any = {
      message: {
        raw,
      },
    }

    if (threadId) {
      requestBody.message.threadId = threadId
    }

    const response = await this.gmail.users.drafts.create({
      userId: "me",
      requestBody,
    })

    return response.data
  }

  extractHeaders(message: gmail_v1.Schema$Message): { [key: string]: string } {
    const headers = message.payload?.headers || []
    const result: { [key: string]: string } = {}
    
    headers.forEach((header) => {
      if (header.name && header.value) {
        result[header.name] = header.value
      }
    })
    
    return result
  }

  parseEmailDetails(message: gmail_v1.Schema$Message): EmailDetails {
    const headers = this.extractHeaders(message)
    
    return {
      id: message.id!,
      subject: headers["Subject"] || "(No subject)",
      from: headers["From"] || "Unknown",
      to: headers["To"],
      date: headers["Date"] || "",
      snippet: message.snippet || "",
      labels: message.labelIds || undefined,
      threadId: message.threadId || undefined,
      body: message.payload ? extractEmailBody(message) : undefined,
    }
  }
}