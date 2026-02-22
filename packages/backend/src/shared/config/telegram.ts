import { registerAs } from '@nestjs/config';

export const configTelegram = registerAs('telegram', () => {
  const allowedTopicIds = (process.env.TELEGRAM_ALLOWED_TOPIC_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map(Number)
    .filter((id) => !isNaN(id));

  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    allowedChatIds: (process.env.TELEGRAM_ALLOWED_CHAT_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
    allowedTopicIds,
    defaultTopicId: allowedTopicIds.length > 0 ? allowedTopicIds[0] : undefined,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
    pollingEnabled: process.env.TELEGRAM_POLLING_ENABLED !== 'false',
  };
});
