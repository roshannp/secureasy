# Deploy to GitHub Pages

The app needs a **backend API** (scan + CVE) because GitHub Pages only hosts static files.

## 1. Deploy the API to Vercel (one-time)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Import your repo (roshannp/secureasy)
3. Deploy (use default settings)
4. Copy the deployment URL and add it as the `API_BASE` secret

## 2. Add API_BASE secret

In **roshannp/secureasy** → Settings → Secrets and variables → Actions:

| Secret     | Value |
|------------|-------|
| `API_BASE` | Your Vercel URL (e.g. `https://secureasy-xxx.vercel.app`) |

## 3. Enable GitHub Pages

In **roshannp/secureasy** → Settings → Pages:
- Source: **GitHub Actions**

## 4. Push to trigger deploy

Push to `main` — the workflow builds the static site and deploys via the official GitHub Pages deployment. The site will be live at **https://roshannp.github.io/secureasy** within a few minutes.
