interface AdfNode {
  type: string;
  content?: AdfNode[];
  text?: string;
  attrs?: Record<string, any>;
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
}

export function parseAdfToText(adf: AdfNode | string | null | undefined): string {
  if (!adf) return '';
  if (typeof adf === 'string') return adf;

  const parts: string[] = [];

  function traverse(node: AdfNode, depth = 0): void {
    if (node.text) {
      parts.push(node.text);
      return;
    }

    switch (node.type) {
      case 'paragraph':
        if (node.content) node.content.forEach((child) => traverse(child, depth));
        parts.push('\n');
        break;

      case 'heading':
        const level = node.attrs?.level || 1;
        parts.push('\n' + '#'.repeat(level) + ' ');
        if (node.content) node.content.forEach((child) => traverse(child, depth));
        parts.push('\n');
        break;

      case 'bulletList':
      case 'orderedList':
        if (node.content) {
          node.content.forEach((item, index) => {
            const prefix = node.type === 'orderedList' ? `${index + 1}. ` : '- ';
            parts.push(prefix);
            if (item.content) item.content.forEach((child) => traverse(child, depth + 1));
          });
        }
        break;

      case 'listItem':
        if (node.content) node.content.forEach((child) => traverse(child, depth));
        break;

      case 'codeBlock':
        parts.push('\n```\n');
        if (node.content) node.content.forEach((child) => traverse(child, depth));
        parts.push('\n```\n');
        break;

      case 'blockquote':
        parts.push('> ');
        if (node.content) node.content.forEach((child) => traverse(child, depth));
        break;

      case 'rule':
        parts.push('\n---\n');
        break;

      case 'hardBreak':
        parts.push('\n');
        break;

      case 'mention':
        parts.push(`@${node.attrs?.text || 'unknown'}`);
        break;

      case 'emoji':
        parts.push(node.attrs?.shortName || '');
        break;

      case 'inlineCard':
      case 'blockCard':
        parts.push(node.attrs?.url || '');
        break;

      case 'table':
      case 'tableRow':
      case 'tableCell':
      case 'tableHeader':
        if (node.content) node.content.forEach((child) => traverse(child, depth));
        if (node.type === 'tableCell' || node.type === 'tableHeader') parts.push(' | ');
        if (node.type === 'tableRow') parts.push('\n');
        break;

      case 'mediaSingle':
      case 'media':
        parts.push('[media]');
        break;

      default:
        if (node.content) node.content.forEach((child) => traverse(child, depth));
        break;
    }
  }

  traverse(adf);
  return parts.join('').trim();
}
