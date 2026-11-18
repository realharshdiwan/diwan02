import type { ReactNode } from 'react';

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

/** Small monospace uppercase. Labels only — never body copy. */
export function Label({
  children,
  className,
  id,
  as: Tag = 'span',
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: 'span' | 'p' | 'dt' | 'div';
}) {
  return (
    <Tag id={id} className={cx('label', className)}>
      {children}
    </Tag>
  );
}
