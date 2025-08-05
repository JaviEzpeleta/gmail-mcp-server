#!/usr/bin/env node

// Simple test script to interact with Gmail MCP server
const { spawn } = require('child_process');

// Start the MCP server process
const serverProcess = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Send MCP request to list emails
const listEmailsRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "list_emails",
    arguments: {
      maxResults: 5
    }
  }
};

// Write the request to server stdin
serverProcess.stdin.write(JSON.stringify(listEmailsRequest) + '\n');

// Listen for response
serverProcess.stdout.on('data', (data) => {
  const response = data.toString();
  console.log('Gmail MCP Server Response:');
  console.log(response);
  
  try {
    const parsed = JSON.parse(response);
    if (parsed.result && parsed.result.content) {
      console.log('\nYour recent emails:');
      const emails = JSON.parse(parsed.result.content[0].text);
      emails.forEach((email, index) => {
        console.log(`\n${index + 1}. ${email.subject}`);
        console.log(`   From: ${email.from}`);
        console.log(`   Date: ${email.date}`);
        console.log(`   Preview: ${email.snippet}`);
      });
    }
  } catch (e) {
    console.log('Raw response:', response);
  }
  
  serverProcess.kill();
});

serverProcess.on('error', (error) => {
  console.error('Error starting server:', error);
});