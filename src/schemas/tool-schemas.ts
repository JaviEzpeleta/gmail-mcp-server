import { z } from "zod"

export const ListEmailsSchema = z.object({
  maxResults: z.number().min(1).max(100).default(10).optional(),
  query: z.string().default("").optional(),
  includeSpamTrash: z.boolean().default(false).optional(),
})

export const GetEmailDetailsSchema = z.object({
  emailId: z.string(),
  format: z.enum(["full", "minimal", "metadata"]).default("full").optional(),
})

export const SendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
})

export const SearchEmailsSchema = z.object({
  query: z.string().min(1),
  maxResults: z.number().min(1).max(100).default(10).optional(),
  includeSpamTrash: z.boolean().default(false).optional(),
})

export const CreateDraftSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  threadId: z.string().optional(),
  inReplyToMessageId: z.string().optional(),
})

export const FindAndDraftReplySchema = z.object({
  senderName: z.string().min(1),
  replyBody: z.string().optional(),
})

export const ExtractForwardedContentSchema = z.object({
  emailId: z.string(),
  includeHtml: z.boolean().default(false).optional(),
  maxDepth: z.number().min(1).max(10).default(3).optional(),
})

export type ListEmailsInput = z.infer<typeof ListEmailsSchema>
export type GetEmailDetailsInput = z.infer<typeof GetEmailDetailsSchema>
export type SendEmailInput = z.infer<typeof SendEmailSchema>
export type SearchEmailsInput = z.infer<typeof SearchEmailsSchema>
export type CreateDraftInput = z.infer<typeof CreateDraftSchema>
export type FindAndDraftReplyInput = z.infer<typeof FindAndDraftReplySchema>
export type ExtractForwardedContentInput = z.infer<typeof ExtractForwardedContentSchema>