import { NAV } from '@/src/lib/site';

interface MobileNavProps {
  onNavigate: (href: string) => void;
}

/**
 * Native <details> disclosure — closes the panel when a destination is chosen.
 */
export function MobileNav({ onNavigate }: MobileNavProps) {
  return (
    <details className="relative md:hidden">
      <summary className="cursor-pointer list-none text-[1rem] leading-none tracking-[-0.01em] underline decoration-1 underline-offset-[0.28em] [&::-webkit-details-marker]:hidden">
        Menu
      </summary>
      <div className="absolute right-0 top-[calc(100%+0.75rem)] w-56 border border-line bg-paper p-5 shadow-[0_10px_30px_rgba(20,18,15,0.07)] z-50">
        <nav aria-label="Mobile" className="flex flex-col gap-3">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                const details = event.currentTarget.closest('details');
                if (details) details.open = false;
                onNavigate(item.href);
              }}
              className="text-[15px] leading-none text-ink hover:underline underline-offset-4"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </details>
  );
}
