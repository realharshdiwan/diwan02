import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateReadingMinutes,
  parseInlineTokens,
  parseMarkdownBlocks,
  sanitizeHref,
  slugifyTitle,
} from './markdown.ts';

test('parseMarkdownBlocks parses headings, lists, blockquotes, and code blocks cleanly', () => {
  const md = [
    '## Section Heading',
    '',
    'Paragraph with **bold**, *italic*, `code`, and [link](https://example.com).',
    '',
    '- First bullet',
    '- Second bullet',
    '',
    '1. Step one',
    '2. Step two',
    '',
    '> Key studio observation.',
    '',
    '```ts',
    'const x = 1;',
    '```',
  ].join('\n');

  const blocks = parseMarkdownBlocks(md);
  assert.equal(blocks[0].type, 'heading');
  assert.equal(blocks[1].type, 'paragraph');
  assert.equal(blocks[2].type, 'ul');
  assert.equal(blocks[3].type, 'ol');
  assert.equal(blocks[4].type, 'blockquote');
  assert.equal(blocks[5].type, 'code');

  if (blocks[1].type === 'paragraph') {
    const tokens = parseInlineTokens(blocks[1].text);
    assert.ok(tokens.some((t) => t.type === 'strong' && t.text === 'bold'));
    assert.ok(tokens.some((t) => t.type === 'em' && t.text === 'italic'));
    assert.ok(tokens.some((t) => t.type === 'code' && t.text === 'code'));
    assert.ok(
      tokens.some(
        (t) => t.type === 'link' && t.href === 'https://example.com',
      ),
    );
  }
});

test('sanitizeHref rejects javascript: URLs and permits http/https and relative paths', () => {
  assert.equal(sanitizeHref('javascript:alert(1)'), null);
  assert.equal(sanitizeHref('data:text/html,hi'), null);
  assert.equal(sanitizeHref('https://diwanmercantile.in'), 'https://diwanmercantile.in');
  assert.equal(sanitizeHref('/research/test'), '/research/test');
});

test('slugifyTitle and estimateReadingMinutes behave deterministically', () => {
  assert.equal(
    slugifyTitle('Why Local-First Beats Cloud CRUD!'),
    'why-local-first-beats-cloud-crud',
  );
  assert.equal(estimateReadingMinutes('short text'), 1);
  assert.equal(estimateReadingMinutes('word '.repeat(540)), 3);
});
