# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

Gmail MCP (Model Context Protocol) server built with TypeScript that provides tools for interacting with Gmail through the Google APIs. It uses OAuth2 authentication and exposes Gmail functionality as MCP tools, enabling AI assistants to perform email operations **safely with draft-first security**.

### Key Features
- **🛡️ Safety-first design**: Draft-only mode by default prevents accidental email sends
- **📝 Smart draft tools**: Create drafts for new emails and replies with custom content
- **🧵 Intelligent threading**: Drafts appear in original email conversations, not just Drafts folder
- Full Gmail API integration with OAuth2 authentication
- Type-safe TypeScript implementation with strict typing
- MCP protocol compliance for AI assistant integration
- Comprehensive error handling and user feedback
- Support for advanced Gmail search queries
- Draft creation with thread management

## 🏗️ Architecture Overview

### Core Components

1. **MCP Server Setup** (`src/index.ts:89-99`)
   - Uses `@modelcontextprotocol/sdk` to create an MCP server
   - Server name: `gmail-mcp-server` v1.2.0
   - Configured with tools capability
   - Communicates via StdioServerTransport

2. **OAuth2 Authentication** (`src/index.ts:60-90`)
   - Google OAuth2Client configured with credentials from environment
   - Uses refresh token for persistent authentication
   - Gmail API client initialized with authenticated OAuth2 client
   - **Security flag**: `GMAIL_ALLOW_DIRECT_SEND` controls email sending permissions
   - Validates environment variables on startup

3. **Type System** (`src/index.ts:11-58`)
   - `EmailDetails`: Core interface for email data
   - `ToolResponse`: Standardized tool response format
   - Argument interfaces for each tool (type-safe parameters)
   - Full TypeScript strict mode compliance

4. **Helper Functions** (`src/index.ts:102-145`)
   - `extractEmailBody()`: Extracts readable content from various email formats
   - `formatEmailDetails()`: Formats email data for user presentation
   - Handles both plain text and HTML emails
   - Smart content extraction from multipart messages

5. **Available Tools** (`src/index.ts:148-300`)
   - **list_emails**: Lists recent emails with filtering and pagination
   - **get_email_details**: Retrieves full email content by ID
   - **🛡️ create_draft**: Creates email drafts safely with optional threading support
   - **🔒 send_email**: Direct email sending (disabled by default for security)
   - **search_emails**: Advanced search using Gmail query syntax
   - **🧵 find_and_draft_reply**: Creates properly threaded draft replies (RECOMMENDED for replies)

### Key Implementation Details

- **Request Handling** (`src/index.ts:290-850`)
  - Switch statement pattern for tool request routing
  - **Security checks**: Validates `GMAIL_ALLOW_DIRECT_SEND` before email sending
  - Each tool handler includes comprehensive error handling
  - Type casting with proper interfaces for arguments
  - Detailed error messages with helpful tips and security warnings

- **Performance Optimizations**
  - Parallel promise execution for fetching multiple emails
  - Efficient pagination with maxResults validation
  - Smart content extraction to minimize API calls
  - Base64 URL-safe encoding for message transmission

- **Error Handling Strategy**
  - Try-catch blocks for all API operations
  - User-friendly error messages with emojis
  - Helpful tips for common issues
  - Validation of inputs before API calls

## 📝 Code Style and Conventions

### TypeScript Guidelines
- **Strict mode** enabled for type safety
- **Interfaces** for all data structures
- **Type annotations** for all function parameters and returns
- **No `any` types** except for error catching
- **Null safety** with proper optional chaining

### Naming Conventions
- **camelCase** for variables and functions
- **PascalCase** for interfaces and types
- **UPPER_SNAKE_CASE** for environment constants
- **Descriptive names** over abbreviations

### Error Messages Format
```typescript
❌ Error: [Brief description]

💡 [Helpful tip or solution]
```

### Response Format
- Use **emojis** for visual clarity
- **Markdown formatting** for structure
- **Bullet points** for lists
- **Bold text** for emphasis

## 🔧 Common Development Commands

### Build and Run
```bash
npm run build    # Compile TypeScript to JavaScript
npm start        # Run compiled server from dist/index.js
npm run dev      # Development mode with hot reloading (tsx)
```

### Setup and Configuration
```bash
npm run setup    # Generate OAuth2 refresh token
npm test         # Run test suite
npm run lint     # Check code quality
npm run format   # Auto-format code
```

### Environment Setup
Required environment variables:
```bash
GMAIL_CLIENT_ID      # OAuth2 client ID from Google Cloud Console
GMAIL_CLIENT_SECRET  # OAuth2 client secret
GMAIL_REFRESH_TOKEN  # OAuth2 refresh token for persistent auth
```

Optional security variables:
```bash
GMAIL_ALLOW_DIRECT_SEND=false  # Default: false (drafts only)
GMAIL_ALLOW_DIRECT_SEND=true   # Enable direct email sending (NOT recommended)
```

## 🚀 Development Workflow

### Adding New Features
1. Define TypeScript interface for arguments
2. Add tool definition in `ListToolsRequestSchema` handler
3. Implement handler in `CallToolRequestSchema` switch
4. **Add security checks** if tool involves sensitive operations
5. Add comprehensive error handling with safety warnings
6. Update documentation in README.md and CLAUDE.md
7. Test with Claude Desktop integration

### Testing Strategy
1. **Unit testing**: Test individual functions
2. **Integration testing**: Test Gmail API interactions
3. **End-to-end testing**: Test via MCP protocol
4. **Manual testing**: Verify with Claude Desktop

### Debugging Tips
- Use `console.error()` for server-side logging
- Check Chrome DevTools for Claude Desktop logs
- Monitor Gmail API quotas in Google Cloud Console
- Test with `test-gmail-connection.ts` for connectivity

## 📦 Dependencies

### Core Dependencies
- **@modelcontextprotocol/sdk** (^1.17.1): MCP protocol implementation
- **googleapis** (^155.0.0): Google APIs client library
- **dotenv** (^17.2.1): Environment variable management

### Development Dependencies
- **typescript** (^5.9.2): TypeScript compiler
- **tsx** (^4.20.3): TypeScript execution for development
- **@types/node** (^24.2.0): Node.js type definitions

## 🔒 Security Considerations

### OAuth2 Security
- Never commit credentials to version control
- Use refresh tokens instead of access tokens
- Implement token rotation when needed
- Validate all user inputs before API calls

### Email Safety
- **🛡️ Draft-first approach**: Default behavior creates drafts, not sent emails
- **🚨 Explicit confirmation**: Direct sending requires explicit environment flag
- **📝 Clear messaging**: Always indicate whether email was sent or drafted
- **🔍 User review**: Encourage manual review of all drafts before sending

### Data Privacy
- Don't log email content in production
- Minimize data retention
- Use secure communication channels
- Follow Gmail API usage policies

## 🐛 Common Issues and Solutions

### Authentication Issues
- **Problem**: `invalid_grant` error
- **Solution**: Regenerate refresh token using `npm run setup`

### API Quotas
- **Problem**: Rate limit exceeded
- **Solution**: Implement exponential backoff, reduce parallel requests

### Type Errors
- **Problem**: TypeScript compilation errors
- **Solution**: Ensure strict null checks, use proper type guards

### MCP Connection
- **Problem**: Claude Desktop doesn't connect
- **Solution**: Check absolute paths in config, restart Claude Desktop

## 📊 Performance Considerations

### API Call Optimization
- Batch requests when possible
- Use field masks to reduce payload size
- Implement caching for frequently accessed data
- Monitor quota usage in Google Cloud Console

### Response Time Improvements
- Parallel processing for multiple emails
- Lazy loading of email content
- Efficient search query construction
- Minimize unnecessary API calls

## 🔄 Version History

### v1.3.0 (Current)
- **🧵 THREADING OVERHAUL**: Enhanced email conversation threading
- **⚡ Improved `find_and_draft_reply`**: Better email parsing, robust error handling, proper References headers
- **🎯 Enhanced `create_draft`**: Optional threading support with `threadId` and `inReplyToMessageId` parameters
- **📍 Inbox integration**: Draft replies now appear in original email conversations, not just Drafts folder
- **🔍 Better search**: Excludes sent items when finding emails to reply to
- **📋 Clear tool guidance**: Updated descriptions to clarify when to use each tool

### v1.2.0
- **🛡️ SECURITY OVERHAUL**: Draft-first safety system
- **📝 New tool**: `create_draft` for safe email composition
- **🔒 Protected sending**: `send_email` disabled by default
- **⚡ Enhanced replies**: `find_and_draft_reply` accepts custom content
- **🚨 Safety warnings**: Clear messaging about drafts vs sent emails
- **📋 Documentation**: Complete security guidelines and best practices

### v1.1.0
- Added `get_email_details` tool
- Improved error handling and user feedback
- Enhanced TypeScript typing
- Better response formatting with emojis

### v1.0.0
- Initial implementation
- Basic email operations
- OAuth2 authentication
- MCP protocol support

## 📚 Additional Resources

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [MCP Specification](https://modelcontextprotocol.org/)
- [OAuth2 for Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

## 🎓 Learning Resources

For developers new to this codebase:
1. Start with `README.md` for setup instructions
2. **⚠️ Read security guidelines** in this file first
3. Review type definitions in `src/index.ts:11-58`
4. Understand tool implementations in `src/index.ts:290-850`
5. **🛡️ Test security features** with different `GMAIL_ALLOW_DIRECT_SEND` settings
6. Test with `test-gmail-connection.ts`
7. Integrate with Claude Desktop for real-world testing

---

**Note**: This document is continuously updated as the project evolves. Always refer to the latest version in the repository.