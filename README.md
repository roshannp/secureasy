# Secureasy

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
