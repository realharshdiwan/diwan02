import { NAV, REGISTRATION, SITE } from '@/src/lib/site';
import { Label } from './Ui';

interface SiteFooterProps {
  onNavigate: (href: string) => void;
}

export function SiteFooter({ onNavigate }: SiteFooterProps) {
  return (
    <footer className="gutter mt-20 pb-10 pt-10">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
        <div>
          <p className="text-[1.5rem] font-medium leading-none tracking-[-0.03em]">
            {SITE.name}
          </p>
          <p className="mt-3 max-w-[32ch] text-[13.5px] leading-[1.6] text-ink-3">
            Research, ventures, and software in {SITE.basedIn}.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2.5">
          <Label>Index</Label>
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.href);
              }}
              className="text-[14px] leading-none text-ink-2 transition-colors hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div>
          <Label>Registered</Label>
          <dl className="mt-3 space-y-1.5">
            <div className="flex gap-3">
              <dt className="label w-14">GSTIN</dt>
              <dd className="font-mono text-[11px] tracking-[0.02em]">
                {REGISTRATION.gstin}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="label w-14">Udyam</dt>
              <dd className="font-mono text-[11px] tracking-[0.02em]">
                {REGISTRATION.udyam}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="label w-14">Address</dt>
              <dd className="text-[12px]">{REGISTRATION.locality}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-2 pt-4 sm:flex-row sm:items-baseline sm:justify-between">
        <Label>
          © {SITE.year} {SITE.name}
        </Label>
        <a
          href={`mailto:${SITE.contactEmail}`}
          className="label underline decoration-line underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
        >
          {SITE.contactEmail}
        </a>
      </div>
    </footer>
  );
}
