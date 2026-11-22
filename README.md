# FOODFIND (full version)
Run with backend:  node server.js   then open http://localhost:3000   (Node 18+, no npm install)
Run front-end only: VS Code Live Server on index.html (falls back to direct Overpass calls).
API: GET /api/health, /api/restaurants?q=, /api/nearby?lat=&lng=&r=, /api/config, POST /api/contact (saved to data/messages.json)
Keys: none required. Optional MAPTILER_KEY in .env (copy .env.example) for production map tiles. Never put keys in js/ files.
Host: any Node host (Render, Railway, Fly.io): start command `node server.js`.
Sample data: js/data.js (fictional). Real data: Overpass places only (names/locations, no menus or prices).

## Owners adding shops
Owners use "Add Your Shop" on the site. Submissions are saved as pending (data/shops.json) and are NOT public.
You verify at /admin.html (enter ADMIN_TOKEN from .env), check the location link, call or email the owner, then Approve or Reject.
Approved shops appear in Explore marked "Verified". Rate limit: 5 submissions per IP per hour; a hidden honeypot field blocks simple bots.
On free hosts the disk can reset on redeploy: use a persistent disk or move shops.json to a database before going live.
