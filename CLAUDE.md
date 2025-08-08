# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gmail MCP (Model Context Protocol) server that enables AI assistants to interact with Gmail through OAuth2 authentication. Built with TypeScript, it implements the MCP protocol to expose Gmail functionality as tools with a safety-first design that creates drafts by default rather than sending emails directly.

## Essential Commands

```bash
# Build and run
npm run build          # Compile TypeScript to JavaScript
npm start              # Run compiled server from dist/
npm run dev            # Development mode with tsx

# OAuth setup
npm run setup          # Generate OAuth refresh token (interactive browser flow)

# Testing
npm run test           # Test Gmail connection
npm run test:list      # Test listing emails

# Development workflow
npm run rebuild        # Clean and rebuild (rm -rf dist && tsc)
npm run typecheck      # Type checking without emitting files
```

## Fork Management

This is a fork with a dual-branch strategy. The `stable` branch contains production-ready code with all fixes merged, while `main` stays synchronized with upstream.

Current fixes in stable branch:
- UTF-8 encoding fix for email subjects with emojis
- Configurable OAuth redirect port (OAUTH_REDIRECT_PORT env var)
- Corrected OAuth setup documentation

To update from upstream:
```bash
git checkout main
git fetch upstream
git pull upstream main
# Then rebuild stable if needed
```

## Architecture

### Core Flow
The server operates as a stdio-based MCP server that receives tool requests from Claude and translates them into Gmail API calls. Authentication happens once via OAuth2 refresh token, then the server maintains a persistent Gmail client.

### Key Components

**Entry Point** (`src/index.ts`)
- MCP server initialization with stdio transport
- OAuth2 client setup using environment credentials
- Gmail API client creation
- Tool request routing through switch statement

**OAuth Setup** (`src/get-refresh-token-desktop.ts`)
- Temporary local server on configurable port (default 8765)
- Browser-based OAuth flow for refresh token generation
- Stores credentials for persistent authentication

**Available Tools** (defined in ListToolsRequestSchema handler)
- `list_emails` - List with filtering, pagination
- `get_email_details` - Full email content retrieval
- `send_email` - Direct sending (disabled by default via GMAIL_ALLOW_DIRECT_SEND)
- `create_draft` - Safe draft creation (recommended)
- `search_emails` - Gmail search syntax support
- `find_and_draft_reply` - Threaded reply drafts

### Environment Configuration

Required environment variables:
```bash
GMAIL_CLIENT_ID       # OAuth2 client ID from Google Cloud Console
GMAIL_CLIENT_SECRET   # OAuth2 client secret
GMAIL_REFRESH_TOKEN   # Generated via npm run setup
```

Optional:
```bash
GMAIL_ALLOW_DIRECT_SEND=false  # Keep false for safety (drafts only)
OAUTH_REDIRECT_PORT=8765       # OAuth callback port
```

### Message Processing

Email content extraction handles multiple formats:
1. Simple messages with direct body data
2. Multipart messages with text/plain parts
3. HTML fallback with basic tag stripping
4. Base64 decoding for all content

Subject encoding uses RFC 2047 for UTF-8 support:
```typescript
Subject: =?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=
```

### Error Handling

All tool handlers wrap operations in try-catch blocks and return user-friendly error messages with helpful tips. Security checks validate `GMAIL_ALLOW_DIRECT_SEND` before email sending operations.

## Local Development Files

The `.local/` directory contains fork-specific documentation and is gitignored. This includes fork management strategies and custom development notes.

## Testing Approach

Test files validate both connection (`test-gmail-connection.ts`) and functionality (`test-list-emails.js`). These use the same OAuth credentials and provide quick validation of the setup.

## TypeScript Configuration

Targets ES2022 with CommonJS modules for Node.js compatibility. Strict mode enabled with full type checking. Source maps and declarations generated for debugging.