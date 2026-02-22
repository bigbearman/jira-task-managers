import { registerAs } from '@nestjs/config';

export const configTelegram = registerAs('telegram', () => ({
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  allowedChatIds: (process.env.TELEGRAM_ALLOWED_CHAT_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
  webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
  pollingEnabled: process.env.TELEGRAM_POLLING_ENABLED !== 'false',
}));
