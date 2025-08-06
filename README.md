# 📧 Gmail MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.17+-green)](https://modelcontextprotocol.org/)
[![Gmail API](https://img.shields.io/badge/Gmail%20API-v1-red?logo=gmail)](https://developers.google.com/gmail/api)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A powerful MCP (Model Context Protocol) server that enables AI assistants to
interact with Gmail through OAuth2 authentication **with safety-first design**.
Built with TypeScript and designed for seamless integration with Claude Desktop
and other MCP-compatible clients.

## 📑 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
  - [Google Cloud Setup](#1-google-cloud-console-setup)
  - [OAuth2 Credentials](#2-create-oauth2-credentials)
  - [Generate Refresh Token](#3-generate-refresh-token)
- [Usage](#-usage)
  - [Standalone Server](#standalone-server)
  - [Claude Desktop Integration](#claude-desktop-integration)
- [Available Tools](#-available-tools)
- [Examples](#-examples)
- [Troubleshooting](#-troubleshooting)
- [Development](#-development)

## ✨ Features

- 🛡️ **Safety First** - Draft-only mode by default prevents accidental email sends
- 📝 **Smart Drafts** - Create drafts for new emails and replies with custom content
- 📬 **List Emails** - Retrieve recent emails with advanced filtering options
- 📖 **Get Email Details** - Fetch complete email content including attachments info
- 🔍 **Search Emails** - Use Gmail's powerful search syntax to find specific emails
- ✉️ **Send Emails** - Direct sending (disabled by default, enable with caution)
- 🔐 **Secure OAuth2** - Industry-standard authentication with refresh token support
- 🎯 **Type-Safe** - Full TypeScript implementation with strict typing
- 🚀 **High Performance** - Optimized with parallel processing and smart caching

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Google Account** with Gmail enabled
- **Google Cloud Console** access
- **Claude Desktop** (optional, for integration)

## 📦 Installation

1. **Clone the repository:**

```bash
git clone https://github.com/JaviEzpeleta/gmail-mcp-server.git
cd gmail-mcp-server
```

2. **Install dependencies:**

```bash
npm install
```

3. **Create environment file:**

```bash
cp .env.example .env
```

> **🛡️ Security Note**: By default, direct email sending is disabled for safety. The server will create drafts instead, which you can review and send manually from Gmail.

## ⚙️ Configuration

### 1. Google Cloud Console Setup

1. **Create or select a project:**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click on the project dropdown and select "New Project"
   - Give your project a name (e.g., "Gmail MCP Server")
   - Click "Create"

2. **Enable Gmail API:**
   - In the sidebar, navigate to **APIs & Services** → **Library**
   - Search for "Gmail API"
   - Click on **Gmail API** from the results
   - Click **Enable**
   - Wait for the API to be enabled (usually takes a few seconds)

### 2. Create OAuth2 Credentials

1. **Configure OAuth consent screen:**

   - Go to **APIs & Services** → **OAuth consent screen**
   - Select "External" user type (unless you have a Google Workspace account)
   - Fill in the required fields:
     - App name: "Gmail MCP Server"
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
   - Add test users (important!):
     - Add your Gmail address and any other accounts you want to use
   - Save and continue through all steps

2. **Create OAuth client:**
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Desktop app**
   - Name: "Gmail MCP Desktop Client"
   - Click **Create**
   - **Download the credentials** (you'll see a download button or JSON option)
   - Save the `client_id` and `client_secret` from the downloaded file

### 3. Generate Refresh Token

1. **Add credentials to .env:**

```bash
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REFRESH_TOKEN=
# Security: Keep this false unless you need direct sending
GMAIL_ALLOW_DIRECT_SEND=false
```

2. **Run the setup script:**

```bash
npm run setup
# or
npm run dev src/get-refresh-token-desktop.ts
```

3. **Authorize the application:**

   - A browser window will open automatically
   - Sign in with your Google account
   - Grant all requested permissions
   - You'll be redirected to a success page

4. **Save the refresh token:**
   - The terminal will display your refresh token
   - Copy the complete `GMAIL_REFRESH_TOKEN` value
   - Add it to your `.env` file

## 🚀 Usage

### Standalone Server

1. **Build the project:**

```bash
npm run build
```

2. **Start the server:**

```bash
npm start
```

The server will start and listen for MCP commands via stdio.

### Claude Desktop Integration

1. **Build the project first:**

```bash
npm run build
```

2. **Locate Claude Desktop config:**

   - **macOS**:
     `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

3. **Edit the configuration file:**

```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["/absolute/path/to/gmail-mcp-server/dist/index.js"],
      "env": {
        "GMAIL_CLIENT_ID": "your_client_id",
        "GMAIL_CLIENT_SECRET": "your_client_secret",
        "GMAIL_REFRESH_TOKEN": "your_refresh_token",
        "GMAIL_ALLOW_DIRECT_SEND": "false"
      }
    }
  }
}
```

4. **Restart Claude Desktop**

5. **Verify the connection:**
   - Open Claude Desktop
   - Look for the 🔌 icon indicating MCP connection
   - Try: "List my recent emails"

## 🛠️ Available Tools

> **🛡️ Safety Notice**: Tools marked with 🛡️ create drafts by default for your safety. Direct sending tools marked with 🚨 are disabled by default.

### 📬 list_emails

List recent emails with optional filtering.

**Parameters:**

- `maxResults` (number, 1-100): Maximum emails to return (default: 10)
- `query` (string): Gmail search query (e.g., "is:unread")
- `includeSpamTrash` (boolean): Include SPAM/TRASH folders (default: false)

**Example:**

```
List my 5 most recent unread emails
```

### 📖 get_email_details

Get complete details and content of a specific email.

**Parameters:**

- `emailId` (string, required): The email ID to retrieve
- `format` (string): Level of detail - "full", "minimal", or "metadata"
  (default: "full")

**Example:**

```
Get the full content of email ID 18abc123def
```

### 🛡️ create_draft

Create an email draft with optional CC/BCC recipients (recommended for AI assistants).

**Parameters:**

- `to` (string, required): Recipient email address
- `subject` (string, required): Email subject
- `body` (string, required): Email body (plain text or HTML)
- `cc` (string): CC recipients (comma-separated)
- `bcc` (string): BCC recipients (comma-separated)

**Example:**

```
Create a draft email to john@example.com with subject "Meeting Tomorrow" and body "Let's meet at 10 AM"
```

### 🚨 send_email (Disabled by Default)

Send an email directly with optional CC/BCC recipients.

**⚠️ Security Warning**: This tool is disabled by default. Set `GMAIL_ALLOW_DIRECT_SEND=true` to enable.

**Parameters:**

- `to` (string, required): Recipient email address
- `subject` (string, required): Email subject
- `body` (string, required): Email body (plain text or HTML)
- `cc` (string): CC recipients (comma-separated)
- `bcc` (string): BCC recipients (comma-separated)

**Example:**

```
Send an email to john@example.com with subject "Meeting Tomorrow" and body "Let's meet at 10 AM"
```

### 🔍 search_emails

Search emails using Gmail's advanced search syntax.

**Parameters:**

- `query` (string, required): Gmail search query
- `maxResults` (number, 1-100): Maximum results (default: 10)
- `includeSpamTrash` (boolean): Include SPAM/TRASH (default: false)

**Example Gmail search queries:**

- `from:user@example.com` - Emails from a specific sender
- `subject:"important meeting"` - Emails with exact phrase in subject
- `has:attachment` - Emails with attachments
- `is:unread` - Unread emails
- `newer_than:2d` - Emails from last 2 days
- `label:work` - Emails with specific label

### 🛡️ find_and_draft_reply

Find the latest email from a sender and create a draft reply with optional custom content.

**Parameters:**

- `senderName` (string, required): Sender name or email address
- `replyBody` (string, optional): Custom reply content (template used if not provided)

**Example:**

```
Create a draft reply to the latest email from John Smith saying "Thanks for your message. I'll get back to you soon."
```

## 📚 Examples

### Basic Usage Examples

**List recent emails:**

```
Show me my 10 most recent emails
```

**Search for specific emails:**

```
Search for emails from alice@example.com with attachments
```

**Create a draft email:**

```
Create a draft email to bob@example.com saying "Thanks for your help!"
```

**Create a draft reply:**

```
Draft a reply to the latest email from support@company.com
```

### Advanced Usage Examples

**Complex search:**

```
Find all unread emails from the last week with "invoice" in the subject
```

**Draft with CC:**

```
Create a draft email to team@company.com with CC to manager@company.com about the project update
```

**Get email details:**

```
Show me the full content of the most recent email from my boss
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### ❌ Error: Missing required environment variables

**Solution:** Ensure all required environment variables are set in your `.env` file:

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET` 
- `GMAIL_REFRESH_TOKEN`
- `GMAIL_ALLOW_DIRECT_SEND` (optional, defaults to `false`)

#### 🛡️ Security: Direct email sending is disabled

**This is normal and safe behavior.** By default, the server creates drafts instead of sending emails directly.

**Solutions:**
- **Recommended**: Use `create_draft` tool instead of `send_email`
- **Alternative**: Set `GMAIL_ALLOW_DIRECT_SEND=true` in your `.env` file (not recommended for AI assistants)

#### ❌ Error 403: access_denied

**Solution:**

1. Go to Google Cloud Console → OAuth consent screen
2. Add your email as a test user
3. Re-run the token generation process

#### ❌ Error: invalid_grant

**Solution:** Your refresh token has expired or is invalid

1. Delete the old refresh token from `.env`
2. Run `npm run setup` again
3. Complete the authorization flow
4. Update `.env` with the new token

#### ❌ Gmail API not enabled

**Solution:**

1. Go to Google Cloud Console
2. Navigate to APIs & Services → Library
3. Search for "Gmail API"
4. Click Enable

#### ❌ Claude Desktop doesn't show the MCP server

**Solution:**

1. Verify the config file path is correct
2. Ensure all paths in the config are absolute paths
3. Check that the built files exist in `dist/`
4. Restart Claude Desktop completely
5. Check Claude Desktop logs for errors

#### ❌ Rate limit exceeded

**Solution:**

- Gmail API has quotas (250 quota units per user per second)
- Implement exponential backoff for retries
- Reduce the number of parallel requests

## 🔒 Security Guidelines

### Draft-First Approach

This server implements a **safety-first design** to prevent accidental email sends:

- **Default behavior**: Creates drafts that require manual review
- **Protection**: `send_email` tool is disabled by default
- **User control**: Explicit environment variable required for direct sending

### Recommended Usage

✅ **Safe for AI assistants:**
- `create_draft` - Creates email drafts
- `find_and_draft_reply` - Creates reply drafts
- `list_emails`, `search_emails`, `get_email_details` - Read-only operations

⚠️ **Use with caution:**
- `send_email` - Only enable if you fully trust the AI assistant and understand the risks

### Best Practices

1. **Keep `GMAIL_ALLOW_DIRECT_SEND=false`** unless absolutely necessary
2. **Review all drafts** before sending manually from Gmail
3. **Test thoroughly** in a safe environment before production use
4. **Monitor usage** and check for unexpected behavior

## 🔨 Development

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Generate OAuth refresh token
npm run setup

# Run tests
npm test

# Lint code
npm run lint

```

### Project Structure

```
gmail-mcp-server/
├── src/
│   ├── index.ts                 # Main server implementation
│   └── get-refresh-token-desktop.ts # OAuth setup utility
├── dist/                        # Compiled JavaScript (generated)
├── examples/                    # Usage examples
├── docs/                       # Additional documentation
├── .env.example                # Environment variables template
├── tsconfig.json              # TypeScript configuration
├── package.json              # Project dependencies
└── README.md                # This file
```

### Testing

Test the connection and basic functionality:

```bash
# Test Gmail connection
npm run dev test-gmail-connection.ts

# Test with MCP client
npm run dev test-list-emails.js
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🙏 Acknowledgments

- [Google Gmail API](https://developers.google.com/gmail/api) for email
  functionality
- [Model Context Protocol](https://modelcontextprotocol.org/) for the MCP
  specification
- [Anthropic](https://anthropic.com/) for Claude and MCP development

## 📞 Support

For issues, questions, or suggestions:

- Open an issue on
  [GitHub](https://github.com/JaviEzpeleta/gmail-mcp-server/issues)
- Check existing issues for solutions
- Read the
  [Gmail API documentation](https://developers.google.com/gmail/api/guides)

---

Made with ❤️ by [Javi Ezpeleta](https://github.com/JaviEzpeleta)
