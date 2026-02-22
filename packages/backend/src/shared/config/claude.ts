import { registerAs } from '@nestjs/config';

export const configClaude = registerAs('claude', () => ({
  cliPath: process.env.CLAUDE_CLI_PATH || 'claude',
  defaultModel: process.env.CLAUDE_DEFAULT_MODEL || 'sonnet',
  maxTokens: Number(process.env.CLAUDE_MAX_TOKENS) || 8192,
  timeout: Number(process.env.CLAUDE_TIMEOUT_MS) || 300000,
  allowedTools: (process.env.CLAUDE_ALLOWED_TOOLS || 'Edit,Write,Bash,Read,Glob,Grep').split(','),
}));
