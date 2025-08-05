# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Gmail MCP (Model Context Protocol) server built with TypeScript that provides tools for interacting with Gmail through the Google APIs. It uses OAuth2 authentication and exposes Gmail functionality as MCP tools.

## Common Development Commands

### Build and Run
- **Build TypeScript**: `npm run build` - Compiles TypeScript files to JavaScript
- **Start server**: `npm start` - Runs the compiled server from dist/index.js
- **Development mode**: `npm run dev` - Runs the TypeScript files directly using tsx for hot reloading

### Environment Setup
The server requires three environment variables for Gmail OAuth2 authentication:
- `GMAIL_CLIENT_ID`: OAuth2 client ID from Google Cloud Console
- `GMAIL_CLIENT_SECRET`: OAuth2 client secret
- `GMAIL_REFRESH_TOKEN`: OAuth2 refresh token for persistent authentication

## Architecture Overview

### Core Components

1. **MCP Server Setup** (src/index.ts:28-38)
   - Uses `@modelcontextprotocol/sdk` to create an MCP server
   - Configured with tools capability
   - Communicates via StdioServerTransport

2. **OAuth2 Authentication** (src/index.ts:10-25)
   - Google OAuth2Client configured with credentials from environment
   - Uses refresh token for persistent authentication
   - Gmail API client initialized with authenticated OAuth2 client

3. **Available Tools**
   - **list_emails**: Lists recent emails with optional search query
   - **send_email**: Sends an email with to, subject, and body
   - **search_emails**: Searches emails using Gmail query syntax

### Key Implementation Details

- The server uses a switch statement pattern (src/index.ts:110-280) to handle tool requests
- Each tool handler includes error handling with try-catch blocks
- Email details are fetched with parallel promises for performance
- Message encoding for sending uses base64 URL-safe encoding

### Dependencies
- **@modelcontextprotocol/sdk**: Core MCP functionality
- **googleapis**: Google APIs client library for Gmail integration
- **TypeScript toolchain**: typescript, tsx, @types/node for development