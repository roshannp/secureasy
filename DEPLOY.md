# Deploy AM I SECURE to GitHub + Vercel

## Step 1: Create GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `secureasy` (or `secureasy-io`)
3. Keep it **public**
4. **Don't** add README, .gitignore, or license (we already have them)
5. Click **Create repository**

## Step 2: Push to GitHub

In your terminal, from the `secureasy` folder:

```bash
git remote add origin https://github.com/YOUR_USERNAME/secureasy.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 3: Deploy on Vercel (free)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New** → **Project**
3. Import your `secureasy` repository
4. Click **Deploy** (Vercel auto-detects Next.js)

Your app will be live at `secureasy-xxx.vercel.app`.

## Step 4: Add custom domain (when ready)

1. Buy `secureasy.io` from Namecheap, Cloudflare, or similar
2. In Vercel: **Project Settings** → **Domains** → Add `secureasy.io`
3. Update DNS as instructed by Vercel

---

**All changes you make locally:** Commit and push to GitHub. Vercel will auto-deploy.

```bash
git add .
git commit -m "Your message"
git push
```
