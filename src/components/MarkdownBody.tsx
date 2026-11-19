import { Fragment } from 'react';
import {
  parseInlineTokens,
  parseMarkdownBlocks,
  type InlineToken,
} from '@/src/lib/markdown';

function renderInline(tokens: InlineToken[]) {
  return tokens.map((token, idx) => {
    switch (token.type) {
      case 'strong':
        return (
          <strong key={idx} className="font-semibold text-ink">
            {token.text}
          </strong>
        );
      case 'em':
        return (
          <em key={idx} className="italic">
            {token.text}
          </em>
        );
      case 'code':
        return (
          <code
            key={idx}
            className="border border-line bg-paper px-1.5 py-0.5 font-mono text-[13px] text-ink"
          >
            {token.text}
          </code>
        );
      case 'link': {
        const isExternal = /^https?:\/\//i.test(token.href);
        return (
          <a
            key={idx}
            href={token.href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noreferrer' : undefined}
            className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:text-accent hover:decoration-accent"
          >
            {token.label}
          </a>
        );
      }
      default:
        return <Fragment key={idx}>{token.text}</Fragment>;
    }
  });
}

interface MarkdownBodyProps {
  markdown: string;
}

export function MarkdownBody({ markdown }: MarkdownBodyProps) {
  const blocks = parseMarkdownBlocks(markdown);

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            if (block.level === 1) {
              return (
                <h2
                  key={index}
                  className="pt-4 text-[1.45rem] font-medium leading-[1.2] tracking-[-0.025em] text-ink"
                >
                  {renderInline(parseInlineTokens(block.text))}
                </h2>
              );
            }
            if (block.level === 2) {
              return (
                <h3
                  key={index}
                  className="pt-3 text-[1.2rem] font-medium leading-[1.25] tracking-[-0.02em] text-ink"
                >
                  {renderInline(parseInlineTokens(block.text))}
                </h3>
              );
            }
            return (
              <h4
                key={index}
                className="pt-2 font-mono text-[12px] uppercase tracking-[0.12em] text-accent"
              >
                {renderInline(parseInlineTokens(block.text))}
              </h4>
            );
          case 'ul':
            return (
              <ul key={index} className="space-y-2.5 pl-5 text-[15.5px] leading-[1.72] text-ink-2 list-disc marker:text-accent">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{renderInline(parseInlineTokens(item))}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={index} className="space-y-2.5 pl-5 text-[15.5px] leading-[1.72] text-ink-2 list-decimal marker:font-mono marker:text-[12px] marker:text-accent">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{renderInline(parseInlineTokens(item))}</li>
                ))}
              </ol>
            );
          case 'blockquote':
            return (
              <blockquote
                key={index}
                className="border-y border-line bg-paper px-5 py-4 text-[15px] leading-[1.68] text-ink"
              >
                {renderInline(parseInlineTokens(block.text))}
              </blockquote>
            );
          case 'code':
            return (
              <pre
                key={index}
                className="overflow-x-auto border border-line bg-paper p-4 font-mono text-[12.5px] leading-[1.65] text-ink"
              >
                <code>{block.code}</code>
              </pre>
            );
          default:
            return (
              <p key={index} className="text-[15.5px] leading-[1.75] text-ink-2">
                {renderInline(parseInlineTokens(block.text))}
              </p>
            );
        }
      })}
    </div>
  );
}
