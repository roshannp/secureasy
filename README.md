# AM I SECURE

**Attack surface visibility for small businesses.** See what attackers can see.

Enter a domain and get instant visibility into subdomains, DNS records, and SSL certificates—all from passive, public sources.

## Features

- **Subdomain discovery** — From Certificate Transparency logs (crt.sh)
- **DNS records** — A, AAAA, MX, TXT, CNAME for root domain
- **SSL/TLS info** — Certificate validity and expiry for discovered subdomains
- **Risk indicators** — Expired certs, dev/staging subdomains exposed

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Blank page? Fix it:

1. **Stop everything** — Close all terminals running `npm run dev`, or run:
   ```bash
   pkill -f "next dev"
   ```

2. **Raise file limit** (fixes EMFILE / blank page on macOS):
   ```bash
   ulimit -n 65536
   ```

3. **Clean start**:
   ```bash
   rm -rf .next
   npm run dev
   ```

4. **Hard refresh** the browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

Or use the helper script: `bash scripts/dev.sh`

**Alternative — run production build** (no file watcher, avoids EMFILE):
```bash
npm run build
npm run start
```
Then open http://localhost:3000

## Deploy (free)

### Option 1: Vercel (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Import this repository
4. Deploy — Vercel auto-detects Next.js

Your app will be live at `your-project.vercel.app`. Custom domain (e.g. secureasy.io) can be added in project settings.

### Option 2: Railway / Render / Fly.io

All support Next.js. Connect your GitHub repo and deploy.

## Tech

- Next.js 14, React, TypeScript, Tailwind
- Certificate Transparency (crt.sh) for subdomains
- Node.js `dns` and `tls` for DNS and SSL checks
