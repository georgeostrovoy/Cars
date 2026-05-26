# Deploy to Vercel (Android-friendly)

## Option A: Fastest (via GitHub import)
1. Push this repository to GitHub.
2. Open Vercel dashboard: `https://vercel.com/new`.
3. Import your repo.
4. Framework preset: **Other** (or auto-detected static).
5. Click **Deploy**.

Because `vercel.json` is included, root URL `/` will automatically serve `web/index.html`.

---

## Option B: From phone with Vercel CLI (Termux)
```bash
pkg update
pkg install nodejs git
npm i -g vercel

cd Cars
vercel
```
- First deploy gives preview URL.
- For production domain:
```bash
vercel --prod
```

---

## Notes
- Static files are served from `web/`.
- You can open your game directly from the Vercel URL (no localhost required).
