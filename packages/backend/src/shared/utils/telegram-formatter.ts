const MARKDOWN_V2_SPECIAL = /[_*\[\]()~`>#+\-=|{}.!]/g;

export function escapeMarkdownV2(text: string): string {
  return text.replace(MARKDOWN_V2_SPECIAL, '\\$&');
}

export function bold(text: string): string {
  return `*${escapeMarkdownV2(text)}*`;
}

export function italic(text: string): string {
  return `_${escapeMarkdownV2(text)}_`;
}

export function code(text: string): string {
  return `\`${text.replace(/`/g, "'")}\``;
}

export function codeBlock(text: string, lang = ''): string {
  return `\`\`\`${lang}\n${text}\n\`\`\``;
}

export function link(text: string, url: string): string {
  return `[${escapeMarkdownV2(text)}](${url})`;
}

export const MAX_MESSAGE_LENGTH = 4096;

export function splitMessage(text: string, maxLength = MAX_MESSAGE_LENGTH): string[] {
  if (text.length <= maxLength) return [text];

  const messages: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      messages.push(remaining);
      break;
    }

    let splitIndex = remaining.lastIndexOf('\n\n', maxLength);
    if (splitIndex === -1 || splitIndex < maxLength * 0.3) {
      splitIndex = remaining.lastIndexOf('\n', maxLength);
    }
    if (splitIndex === -1 || splitIndex < maxLength * 0.3) {
      splitIndex = maxLength;
    }

    messages.push(remaining.substring(0, splitIndex));
    remaining = remaining.substring(splitIndex).trimStart();
  }

  return messages;
}
