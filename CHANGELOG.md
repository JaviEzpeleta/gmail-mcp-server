# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-08-06

### 🛡️ MAJOR SECURITY OVERHAUL

### Added
- **🔒 Draft-first security system**: New `GMAIL_ALLOW_DIRECT_SEND` environment variable (defaults to `false`)
- **📝 `create_draft` tool**: Safe alternative to `send_email` for creating email drafts
- **⚡ Enhanced `find_and_draft_reply`**: Now accepts optional `replyBody` parameter for custom reply content  
- **🚨 Security warnings**: Clear messaging throughout all responses about drafts vs sent emails
- **📋 Comprehensive documentation**: Updated all documentation with security best practices
- **🛡️ Safety indicators**: All tools now clearly indicate "DRAFT CREATED" vs "EMAIL SENT"

### Changed
- **🔐 `send_email` tool behavior**: Now disabled by default for safety (requires explicit enabling)
- **📬 Server startup messages**: Now shows security status (direct sending enabled/disabled)
- **📝 All response messages**: Enhanced with clear safety indicators and next steps
- **🎯 Tool descriptions**: Updated to emphasize draft-first approach
- **📚 Examples and documentation**: Rewritten to prioritize safe draft creation
- **⚙️ Environment setup**: `.env.example` includes new security variable with documentation

### Security
- **🛡️ Prevents accidental email sends**: AI assistants can no longer send emails directly without explicit user permission
- **👀 Mandatory review process**: All emails must be reviewed as drafts before sending
- **⚠️ Clear safety messaging**: Users always know whether an email was sent or drafted  
- **🔧 Explicit opt-in**: Direct sending requires conscious environment variable configuration
- **📖 Security documentation**: Complete security guidelines in README.md and CLAUDE.md

## [1.1.0] - 2024-12-XX

### Added
- New `get_email_details` tool for retrieving full email content by ID
- Support for different detail formats (full, minimal, metadata) in `get_email_details`
- CC/BCC support in `send_email` tool
- `includeSpamTrash` option for search and list operations
- Comprehensive TypeScript interfaces for all tool arguments
- Email body extraction from multipart messages
- Better HTML to text conversion for email content
- Input validation for all tools (email format, query validation, etc.)
- Pagination limits (1-100) for list and search operations
- Enhanced error messages with helpful tips and emojis
- Response formatting with emojis and markdown structure

### Enhanced
- Improved error handling with more descriptive messages
- Better OAuth2 environment variable validation
- Enhanced server startup messages with connection info
- More robust email parsing for complex message structures
- Thread-aware draft replies (maintains conversation context)
- Improved search result formatting
- Better handling of edge cases (empty results, malformed data)

### Changed
- Server name from "gmail-server" to "gmail-mcp-server"
- Version bumped to 1.1.0
- Improved TypeScript strict mode compliance
- Enhanced response text formatting
- Better null safety throughout the codebase

### Fixed
- Email address extraction from complex "From" headers
- Proper base64 encoding for draft messages
- Thread ID handling for draft replies
- Error handling for invalid email addresses
- Search query validation

## [1.0.0] - 2024-11-XX

### Added
- Initial Gmail MCP Server implementation
- OAuth2 authentication with Google APIs
- Basic email tools:
  - `list_emails`: List recent emails with optional search
  - `send_email`: Send emails with basic parameters
  - `search_emails`: Search emails using Gmail query syntax
  - `find_and_draft_reply`: Create draft replies to specific senders
- MCP (Model Context Protocol) compliance
- TypeScript implementation with strict typing
- Environment variable configuration
- OAuth2 refresh token generation script
- Basic error handling
- Gmail API integration with googleapis library

### Dependencies
- @modelcontextprotocol/sdk ^1.17.1
- googleapis ^155.0.0
- dotenv ^17.2.1
- typescript ^5.9.2
- tsx ^4.20.3

## [Unreleased]

### Planned Features
- Email attachment support
- Bulk operations (mark as read/unread, delete, archive)
- Label management (add/remove labels)
- Advanced filtering options
- Email templates
- Scheduled sending
- Email signature management
- Contact integration
- Calendar event creation from emails
- Email thread management
- Advanced search filters (size, has:attachment types)
- Performance optimizations and caching
- Rate limiting and quota management
- Comprehensive test suite
- CI/CD pipeline
- Docker support

### Known Issues
- Large email content may cause response timeouts
- HTML email formatting could be improved
- Rate limiting not implemented (relies on Gmail API limits)
- No support for email encryption/decryption
- Limited attachment metadata (filename only)

### Breaking Changes (Future)
- None planned for v1.x series
- v2.0 may introduce breaking changes to tool interfaces

---

## Version History Summary

- **v1.2.0**: 🛡️ MAJOR SECURITY OVERHAUL - Draft-first safety system, prevents accidental sends
- **v1.1.0**: Enhanced functionality, better error handling, new tools
- **v1.0.0**: Initial release with core Gmail functionality

## Migration Guide

### From 1.1.0 to 1.2.0
**⚠️ SECURITY BEHAVIOR CHANGE**: `send_email` tool is now disabled by default.

**What changed:**
- `send_email` tool is disabled unless `GMAIL_ALLOW_DIRECT_SEND=true` is set
- All email composition now creates drafts by default for safety
- New `create_draft` tool available as safe alternative

**Action required:**
1. **Recommended**: Update your AI prompts to use "create draft" instead of "send email"
2. **Alternative**: Add `GMAIL_ALLOW_DIRECT_SEND=true` to your environment (not recommended for AI assistants)
3. Update Claude Desktop config to include the new environment variable

**New features available:**
1. Use `create_draft` tool for safe email composition
2. Enhanced `find_and_draft_reply` with custom `replyBody` parameter
3. Clear safety warnings and draft indicators in all responses

### From 1.0.0 to 1.1.0
No breaking changes. All existing functionality remains compatible.

New features available:
1. Use `get_email_details` to get full email content by ID
2. Add `cc` and `bcc` parameters to `send_email` calls
3. Use `includeSpamTrash: true` to include SPAM/TRASH in searches
4. Enjoy improved error messages and response formatting

## Support

For support and bug reports, please visit:
- [GitHub Issues](https://github.com/JaviEzpeleta/gmail-mcp-server/issues)
- [Documentation](README.md)
- [Gmail API Documentation](https://developers.google.com/gmail/api)