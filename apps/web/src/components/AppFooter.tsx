const REPO_URL = "https://github.com/superbahbi/goyo-korean-app";

const LINKS = [
  { label: "Source code", href: REPO_URL },
  { label: "Send feedback", href: `${REPO_URL}/issues` },
  { label: "MIT License", href: `${REPO_URL}/blob/main/LICENSE` },
] as const;

/**
 * The dashboard's closing note: what Goyo stores, what it measures, where the
 * audio comes from, and where to send feedback. Plain text and outbound links,
 * so it needs no state and works offline.
 */
export function AppFooter() {
  return (
    <footer className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
      <div className="space-y-2 border-t border-border/70 pt-6 text-xs leading-relaxed text-muted-foreground">
        <p>
          Goyo is free and needs no account. Your study progress is saved only
          in this browser and is never uploaded.
        </p>
        <p>
          <span className="font-semibold text-foreground/80">Privacy:</span>{" "}
          Goyo counts page views and measures page speed with Vercel Web
          Analytics and Speed Insights. They use no cookies and report only
          anonymous totals.
        </p>
        <p>Pronunciation audio is generated with ElevenLabs.</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
          {LINKS.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded font-semibold text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-300"
              >
                {link.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
