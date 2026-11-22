/* FOODFIND backend: node server.js  (Node 18+, no npm install needed)
   Serves the website + JSON API. Keys go in .env (never in front-end code). */
const crypto = require("crypto"), http = require("http"), fs = require("fs"), path = require("path"), vm = require("vm");
if (fs.existsSync(".env")) fs.readFileSync(".env", "utf8").split("\n").forEach(l => { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) process.env[m[1]] = m[2]; });
const PORT = process.env.PORT || 3000;
const OVERPASS = process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";
const DATA = vm.runInNewContext(fs.readFileSync("js/data.js", "utf8") + ";FF_DATA");
const MSG_FILE = "data/messages.json", cache = new Map();
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };

/* ---- shops submitted by owners: pending -> (admin verifies) -> approved ---- */
const SHOP_FILE = "data/shops.json", hits = new Map();
const readShops = () => fs.existsSync(SHOP_FILE) ? JSON.parse(fs.readFileSync(SHOP_FILE)) : [];
const writeShops = a => { fs.mkdirSync("data", { recursive: true }); fs.writeFileSync(SHOP_FILE, JSON.stringify(a, null, 2)); };
const EMOJI = { "South Indian": "🥞", "North Indian": "🍛", Chinese: "🥡", Italian: "🍕", "Fast Food": "🍔", Biryani: "🍚", Desserts: "🍨", Beverages: "🥤", Cafe: "☕" };
const isAdmin = req => { const a = Buffer.from(String(req.headers["x-admin-token"] || "")), b = Buffer.from(process.env.ADMIN_TOKEN || "");
  return b.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b); };
const publicShop = s => ({ id: s.id, name: s.name, cuisine: s.cuisine, cats: s.cats, diet: s.diet, rating: null, lat: s.lat, lng: s.lng, address: s.address,
  phone: s.phone, hours: s.hours, emoji: s.emoji, color: "#7c2d12", special: s.special, menu: s.menu, verified: true });
function cleanShop(m) {                                   // returns {shop} or {error}
  const t = (v, max) => String(v || "").trim().slice(0, max);
  const name = t(m.name, 80), address = t(m.address, 200), cuisine = t(m.cuisine, 30), email = t(m.email, 120);
  const lat = +m.lat, lng = +m.lng;
  if (name.length < 2 || address.length < 5) return { error: "Shop name and full address are required" };
  if (!EMOJI[cuisine]) return { error: "Choose a cuisine from the list" };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "A valid email is required" };
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return { error: "Valid latitude and longitude are required" };
  const phone = t(m.phone, 15); if (phone && !/^[0-9+\- ]{7,15}$/.test(phone)) return { error: "Phone number looks invalid" };
  if (!Array.isArray(m.menu) || !m.menu.length || m.menu.length > 30) return { error: "Add 1 to 30 menu items" };
  const menu = [];
  for (const d of m.menu) {
    const price = Math.round(+d.price), dn = t(d.name, 60);
    if (!dn || !(price >= 1 && price <= 5000)) return { error: "Each dish needs a name and a price between 1 and 5000" };
    menu.push({ name: dn, price, veg: !!d.veg, emoji: d.veg ? "🥗" : "🍽️", desc: t(d.desc, 120) });
  }
  const special = (menu.find(d => d.name === t(m.special, 60)) || menu[0]).name;
  const cats = [cuisine === "Cafe" ? "Cafes" : cuisine]; if (Math.min(...menu.map(d => d.price)) <= 100) cats.push("Budget");
  return { shop: { name, address, cuisine, email, lat, lng, phone, hours: t(m.hours, 60), menu, special, cats, emoji: EMOJI[cuisine], diet: menu.every(d => d.veg) ? "veg" : "both" } };
}
const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
const body = req => new Promise((ok, no) => { let b = ""; req.on("data", c => { b += c; if (b.length > 20000) { req.destroy(); no(); } }); req.on("end", () => { try { ok(JSON.parse(b)); } catch (e) { no(e); } }); });

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname === "/api/health") return send(res, 200, { ok: true });
    if (url.pathname === "/api/restaurants") {            // swap this for a database later
      const q = (url.searchParams.get("q") || "").toLowerCase();
      return send(res, 200, DATA.restaurants.filter(r => !q || JSON.stringify(r).toLowerCase().includes(q)));
    }
    if (url.pathname === "/api/nearby") {                 // Overpass proxy + 10 min cache
      const lat = +url.searchParams.get("lat"), lng = +url.searchParams.get("lng"), km = Math.min(+url.searchParams.get("r") || 5, 20);
      if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return send(res, 400, { error: "lat/lng required" });
      const key = [lat.toFixed(3), lng.toFixed(3), km].join();
      const hit = cache.get(key); if (hit && Date.now() - hit.t < 600000) return send(res, 200, hit.d);
      const q = `[out:json][timeout:25];(node["amenity"~"restaurant|cafe|fast_food"](around:${km * 1000},${lat},${lng}););out body 120;`;
      let r; try { r = await fetch(OVERPASS, { method: "POST", body: "data=" + encodeURIComponent(q) }); } catch (e) { return send(res, 502, { error: "Overpass unreachable" }); }
      if (!r.ok) return send(res, 502, { error: "Overpass status " + r.status });
      const d = await r.json(); cache.set(key, { t: Date.now(), d }); return send(res, 200, d);
    }
    if (url.pathname === "/api/config") return send(res, 200, { tileUrl: process.env.MAPTILER_KEY ? `https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}.png?key=${process.env.MAPTILER_KEY}` : null });
    if (url.pathname === "/api/contact" && req.method === "POST") {
      const m = await body(req);
      if (!m.name || !/^\S+@\S+\.\S+$/.test(m.email || "") || !m.message) return send(res, 400, { error: "name, valid email and message are required" });
      fs.mkdirSync("data", { recursive: true });
      const all = fs.existsSync(MSG_FILE) ? JSON.parse(fs.readFileSync(MSG_FILE)) : [];
      all.push({ name: String(m.name).slice(0, 80), email: String(m.email).slice(0, 120), message: String(m.message).slice(0, 1000), at: new Date().toISOString() });
      fs.writeFileSync(MSG_FILE, JSON.stringify(all, null, 2)); return send(res, 201, { saved: true });
    }
    if (url.pathname === "/api/shops" && req.method === "GET") return send(res, 200, readShops().filter(x => x.status === "approved").map(publicShop));
    if (url.pathname === "/api/shops" && req.method === "POST") {
      const ip = req.socket.remoteAddress, now = Date.now(), recent = (hits.get(ip) || []).filter(t => now - t < 3600000);
      if (recent.length >= 5) return send(res, 429, { error: "Too many submissions. Try again in an hour." });
      const m = await body(req);
      if (m.website) return send(res, 201, { saved: true });            // honeypot: bots fill this hidden field
      const c = cleanShop(m); if (c.error) return send(res, 400, { error: c.error });
      hits.set(ip, [...recent, now]);
      const all = readShops(); all.push({ ...c.shop, id: "s" + now, status: "pending", submittedAt: new Date(now).toISOString() }); writeShops(all);
      return send(res, 201, { saved: true, status: "pending" });
    }
    if (url.pathname === "/api/admin/shops" && req.method === "GET") {
      if (!isAdmin(req)) return send(res, 401, { error: "Wrong or missing admin token" });
      return send(res, 200, readShops().filter(x => x.status === (url.searchParams.get("status") || "pending")));
    }
    if (url.pathname === "/api/admin/decide" && req.method === "POST") {
      if (!isAdmin(req)) return send(res, 401, { error: "Wrong or missing admin token" });
      const m = await body(req), all = readShops(), shop = all.find(x => x.id === m.id);
      if (!shop || !["approve", "reject"].includes(m.action)) return send(res, 400, { error: "id and action (approve|reject) required" });
      shop.status = m.action === "approve" ? "approved" : "rejected"; shop.decidedAt = new Date().toISOString(); writeShops(all);
      return send(res, 200, { id: shop.id, status: shop.status });
    }
    // static files
    const file = path.join(__dirname, url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname));
    if (!file.startsWith(__dirname) || /server\.js|\.env|data[\\/]/.test(file) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, { error: "not found" });
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" }); fs.createReadStream(file).pipe(res);
  } catch (e) { send(res, 500, { error: "server error" }); }
}).listen(PORT, () => console.log("FOODFIND running on http://localhost:" + PORT));
