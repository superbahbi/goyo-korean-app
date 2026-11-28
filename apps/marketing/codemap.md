# apps/marketing/

The Goyo landing page links to the learner app at `goyo.bahbi.net`.
Vite bundles the static HTML and CSS with the existing app icon and
pronunciation clip. The build injects the light and dark palettes from
`@goyo/shared/theme`. The browser handles audio playback and meaning reveal.

Run `pnpm --filter @goyo/marketing dev` or `pnpm --filter @goyo/marketing build`
from the workspace root. The `goyo-marketing` Vercel project uses this directory
as its root, includes workspace files outside the root, and publishes `dist`
to `goyo.zenzoewich.com`.
