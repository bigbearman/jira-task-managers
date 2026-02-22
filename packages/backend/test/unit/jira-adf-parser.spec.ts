import { parseAdfToText } from '../../src/shared/utils/jira-adf-parser';

describe('parseAdfToText', () => {
  it('should return empty string for null', () => {
    expect(parseAdfToText(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(parseAdfToText(undefined)).toBe('');
  });

  it('should return string as-is', () => {
    expect(parseAdfToText('plain text')).toBe('plain text');
  });

  it('should parse simple paragraph', () => {
    const adf = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world' }],
        },
      ],
    };
    expect(parseAdfToText(adf)).toBe('Hello world');
  });

  it('should parse heading', () => {
    const adf = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'My Heading' }],
        },
      ],
    };
    const result = parseAdfToText(adf);
    expect(result).toContain('## My Heading');
  });

  it('should parse bullet list', () => {
    const adf = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Item 1' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Item 2' }],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = parseAdfToText(adf);
    expect(result).toContain('- Item 1');
    expect(result).toContain('- Item 2');
  });

  it('should parse code block', () => {
    const adf = {
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          content: [{ type: 'text', text: 'const x = 1;' }],
        },
      ],
    };
    const result = parseAdfToText(adf);
    expect(result).toContain('```');
    expect(result).toContain('const x = 1;');
  });
});
