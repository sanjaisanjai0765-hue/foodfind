/* FOODFIND app logic. Uses FF_DATA (data.js) and FFMap (map.js). */
const $ = s => document.querySelector(s);
const esc = FFMap.esc;
const state = { ref: { ...FF_DATA.cities.chennai, usingGps: false }, filter: "all", sort: "near", q: "", radius: 5, nearby: [], favs: [] };
try { state.favs = JSON.parse(localStorage.getItem("ff_favs")) || []; } catch (e) { state.favs = []; }

/* ---------- helpers ---------- */
// Sample restaurants sit at an offset from the chosen location, so they are always "nearby".
const pos = r => r.lat != null ? { lat: r.lat, lng: r.lng } : { lat: state.ref.lat + r.offset[0], lng: state.ref.lng + r.offset[1] };
const dist = r => FFMap.distance(state.ref, pos(r));
const minPrice = r => Math.min(...r.menu.map(m => m.price));
const pic = (e, color, img) => img ? `style="background-image:url('${esc(img)}')"` : `style="background:linear-gradient(135deg,${color || "#3a2412"},#15171D)"`;
const dietDot = r => r.diet === "veg" ? `<i class="dot v"></i>Veg` : `<i class="dot n"></i>Veg &amp; Non-Veg`;
const saveFavs = () => localStorage.setItem("ff_favs", JSON.stringify(state.favs));

/* ---------- filtering ---------- */
function matches(r) {
  const f = state.filter;
  if (f === "veg" && r.diet !== "veg") return false;
  if (f === "nonveg" && r.diet === "veg") return false;
  if (f === "fav" && !state.favs.includes(r.id)) return false;
  if (!["all", "veg", "nonveg", "fav"].includes(f) && !r.cats.includes(f)) return false;
  const q = state.q.trim().toLowerCase();
  if (!q) return true;
  return [r.name, r.cuisine, ...r.cats, ...r.menu.map(m => m.name)].join(" ").toLowerCase().includes(q);
}

function renderCards() {
  let list = FF_DATA.restaurants.filter(matches);
  const s = { near: (a, b) => dist(a) - dist(b), low: (a, b) => minPrice(a) - minPrice(b), high: (a, b) => minPrice(b) - minPrice(a), rating: (a, b) => (b.rating || 0) - (a.rating || 0) };
  list.sort(s[state.sort]);
  $("#count").textContent = `${list.length} restaurant${list.length === 1 ? "" : "s"} (sample unless marked Verified) · distances from ${state.ref.label}`;
  $("#cards").innerHTML = list.length ? list.map(r => `
    <article class="card">
      <div class="pic" ${pic(r.emoji, r.color, r.img)}>${r.img ? "" : r.emoji}<span class="tag">${r.verified ? "Verified" : "Sample"}</span>
        <button class="fav ${state.favs.includes(r.id) ? "on" : ""}" data-fav="${r.id}" aria-label="Toggle favourite">${state.favs.includes(r.id) ? "♥" : "♡"}</button></div>
      <div class="card-b">
        <h3>${esc(r.name)}</h3>
        <div class="row"><span>${esc(r.cuisine)}</span><span>${dietDot(r)}</span></div>
        <div class="row"><span>${r.rating ? "★ " + r.rating + (r.verified ? "" : " (sample)") : "New"}</span><span>${dist(r).toFixed(1)} km</span></div>
        <div class="row"><span>From ₹${minPrice(r)}</span></div>
        <div class="spec">Special: ${esc(r.special)}</div>
        <button class="btn" data-open="${r.id}">View Menu</button>
      </div></article>`).join("")
    : `<div class="empty">${state.filter === "fav" ? "No favourites yet. Tap ♡ on a restaurant to save it." : "No restaurants match. Try another search or filter."}</div>`;
}

function renderSpecials() {
  $("#specialGrid").innerHTML = FF_DATA.restaurants.map(r => {
    const d = r.menu.find(m => m.name === r.special) || r.menu[0];
    return `<article class="card"><div class="pic" ${pic(d.emoji, r.color, d.img)}>${d.img ? "" : d.emoji}<span class="tag">${r.verified ? "Verified" : "Sample"}</span></div>
      <div class="card-b"><h3>${esc(d.name)}</h3><div class="row"><span>${esc(r.name)}</span><span class="price">₹${d.price}</span></div>
      <p class="muted">${esc(d.desc)}</p><button class="btn ghost" data-open="${r.id}">View Menu</button></div></article>`;
  }).join("");
}

function renderStatic() {
  $("#filters").innerHTML = FF_DATA.filters.map(f => `<button class="chip" data-filter="${esc(f.id)}">${f.label}</button>`).join("");
  $("#radius").innerHTML = [2, 5, 10, 20].map(k => `<button class="chip" data-radius="${k}">${k} KM</button>`).join("");
  $("#catGrid").innerHTML = FF_DATA.categories.map(c => `<button class="cat" data-cat="${esc(c.id)}"><span>${c.emoji}</span>${c.id}</button>`).join("");
  document.querySelectorAll(".loc-select").forEach(s => {
    s.innerHTML = Object.entries(FF_DATA.cities).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join("") + `<option value="gps" hidden>My location</option>`;
  });
  syncChips();
}

function syncChips() {
  document.querySelectorAll("[data-filter]").forEach(c => c.classList.toggle("on", c.dataset.filter === state.filter));
  document.querySelectorAll("[data-radius]").forEach(c => c.classList.toggle("on", +c.dataset.radius === state.radius));
  $("#query").value = state.q;
}

/* ---------- restaurant modal ---------- */
function openRestaurant(id) {
  const r = FF_DATA.restaurants.find(x => x.id === id);
  const fav = state.favs.includes(id);
  $("#mBody").innerHTML = `
    <div class="m-head"><div class="pic" ${pic(r.emoji, r.color, r.img)}>${r.img ? "" : r.emoji}</div>
      <div><h2 id="mTitle">${esc(r.name)}</h2><span class="muted">${esc(r.cuisine)}${r.rating ? " · ★ " + r.rating : ""} · ${dietDot(r)}</span></div></div>
    <button class="btn ghost" data-fav="${r.id}" id="mFav">${fav ? "♥ Remove from favourites" : "♡ Add to favourites"}</button>
    ${r.verified ? '<div class="warn">✔ Submitted by the owner and verified by FOODFIND. Prices can change, so confirm with the shop.</div>' : '<div class="warn">⚠ Sample data: this is a fictional restaurant. Menu, prices, rating, address, hours and phone are placeholders, not real information.</div>'}
    <div class="facts"><span>📍 ${esc(r.address)}${r.verified ? "" : " (sample)"}</span><span>🚶 ${dist(r).toFixed(1)} km from ${esc(state.ref.label)}</span>
      <span>🕒 ${r.hours ? esc(r.hours) + " (owner-provided)" : "Opening hours: not available"}</span><span>📞 ${r.phone ? esc(r.phone) : "Contact number: not available"}</span></div>
    <h3>Menu</h3>
    ${r.menu.map(m => `<div class="dish"><div class="pic" ${pic(m.emoji, r.color, m.img)}>${m.img ? "" : m.emoji}</div>
      <div><b>${esc(m.name)}</b> ${m.name === r.special ? "<span class='spec'>★ Signature</span>" : ""}<p><i class="dot ${m.veg ? "v" : "n"}"></i>${esc(m.desc)}</p></div>
      <span class="price">₹${m.price}</span></div>`).join("")}
    <div id="miniMap"></div>`;
  $("#modal").hidden = false;
  FFMap.mini("miniMap", pos(r), r.name + (r.verified ? "" : " (sample location)"));
}
const closeModal = () => { $("#modal").hidden = true; };

/* ---------- live nearby ---------- */
async function loadNearby() {
  const st = $("#nearStatus");
  st.className = "status"; st.innerHTML = `<i class="spin"></i>Finding places within ${state.radius} km...`;
  $("#nearList").innerHTML = "";
  FFMap.setUser(state.ref, state.radius);
  try {
    state.nearby = await FFMap.fetchNearby(state.ref, state.radius);
    st.textContent = state.nearby.length ? `${state.nearby.length} places found near ${state.ref.label} (OpenStreetMap data).` : "No places found. Try a bigger radius.";
    $("#nearList").innerHTML = state.nearby.map(p => `<li data-place="${p.id}"><b>${esc(p.name)}</b><small>${esc(p.type)}${p.cuisine ? " · " + esc(p.cuisine) : ""} · ${p.distance.toFixed(1)} km</small></li>`).join("");
    FFMap.showPlaces(state.nearby, id => {
      const li = document.querySelector(`[data-place="${id}"]`); if (li) li.scrollIntoView({ block: "nearest" });
    });
  } catch (e) {
    st.className = "status err";
    st.textContent = "Could not load nearby places. Check your internet connection and try again (the free Overpass service can also be busy).";
  }
}

function useMyLocation() {
  const st = $("#nearStatus");
  if (!navigator.geolocation) { st.className = "status err"; st.textContent = "Your browser does not support location."; return; }
  st.className = "status"; st.innerHTML = `<i class="spin"></i>Waiting for location permission...`;
  navigator.geolocation.getCurrentPosition(p => {
    setRef({ lat: p.coords.latitude, lng: p.coords.longitude, label: "your location" }, true);
  }, err => {
    st.className = "status err";
    st.textContent = err.code === 1 ? "Location permission was denied. Allow location in your browser's site settings, or pick a city from the menu."
      : "Could not get your location. GPS needs https or localhost; you can pick a city instead.";
  }, { enableHighAccuracy: true, timeout: 12000 });
}

function setRef(ref, gps) {
  state.ref = ref;
  document.querySelectorAll(".loc-select").forEach(s => { if (gps) s.querySelector("[value=gps]").hidden = false; s.value = gps ? "gps" : s.value; });
  renderCards(); loadNearby();
}

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-open],[data-fav],[data-filter],[data-cat],[data-radius],[data-place]");
  if (!t) return;
  if (t.dataset.open) openRestaurant(+t.dataset.open);
  else if (t.dataset.fav) {
    const id = +t.dataset.fav;
    state.favs = state.favs.includes(id) ? state.favs.filter(x => x !== id) : [...state.favs, id];
    saveFavs(); renderCards();
    if (!$("#modal").hidden && $("#mFav")) $("#mFav").textContent = state.favs.includes(id) ? "♥ Remove from favourites" : "♡ Add to favourites";
  } else if (t.dataset.filter) { state.filter = t.dataset.filter; syncChips(); renderCards(); }
  else if (t.dataset.cat) { state.filter = t.dataset.cat; state.q = ""; syncChips(); renderCards(); location.hash = "explore"; }
  else if (t.dataset.radius) { state.radius = +t.dataset.radius; syncChips(); loadNearby(); }
  else if (t.dataset.place) FFMap.focus(+t.dataset.place);
});
$("#mClose").onclick = closeModal;
$("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
$("#query").addEventListener("input", e => { state.q = e.target.value; renderCards(); });
$("#sort").addEventListener("change", e => { state.sort = e.target.value; renderCards(); });
$("#heroSearch").addEventListener("submit", e => { e.preventDefault(); state.q = $("#heroQuery").value; state.filter = "all"; syncChips(); renderCards(); location.hash = "explore"; });
$("#locBtn").onclick = useMyLocation;
$("#burger").onclick = () => $("#menu").classList.toggle("open");
$("#menu").addEventListener("click", () => $("#menu").classList.remove("open"));
document.querySelectorAll(".loc-select").forEach(s => s.addEventListener("change", e => {
  const c = FF_DATA.cities[e.target.value]; if (!c) return;
  document.querySelectorAll(".loc-select").forEach(x => x.value = e.target.value);
  setRef({ ...c }, false);
  if (FFMap.map) FFMap.map.setView([c.lat, c.lng], 13);
}));
$("#contactForm").addEventListener("submit", async e => {
  e.preventDefault();
  const out = $("#cDone"); out.className = "status";
  try {
    const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: $("#cName").value, email: $("#cMail").value, message: $("#cMsg").value }) });
    if (!r.ok) throw new Error();
    out.textContent = "Thanks! Your message was saved."; e.target.reset();
  } catch (err) { out.className = "status err"; out.textContent = "Could not send. Start the backend with: node server.js"; }
});

/* ---------- start ---------- */
renderStatic(); renderCards(); renderSpecials();
// Verified shops from the backend (silently skipped when running without it)
fetch("/api/shops").then(r => r.ok ? r.json() : []).then(list => {
  if (list.length) { FF_DATA.restaurants.push(...list); renderCards(); renderSpecials(); }
}).catch(() => {});
if (FFMap.init(state.ref)) loadNearby();
else { $("#nearStatus").className = "status err"; $("#nearStatus").textContent = "The map library could not load. Check your internet connection."; }

/* ---------- Add Your Shop form ---------- */
$("#sCuisine").innerHTML = `<option value="">Cuisine</option>` + [...FF_DATA.categories.map(c => c.id), "Cafe"].map(c => `<option>${c}</option>`).join("");
function addDishRow() {
  const d = document.createElement("div"); d.className = "menu-row";
  d.innerHTML = `<input class="d-name" placeholder="Dish name" maxlength="60"><input class="d-price" type="number" min="1" max="5000" placeholder="Price ₹">
    <label><input type="checkbox" class="d-veg"> Veg</label><label><input type="radio" name="sig" class="d-sig"> Signature</label>
    <input class="d-desc" placeholder="Short description (optional)" maxlength="120"><button type="button" class="x" aria-label="Remove dish">✕</button>`;
  d.querySelector(".x").onclick = () => { if (document.querySelectorAll(".menu-row").length > 1) d.remove(); };
  $("#menuRows").appendChild(d);
}
addDishRow();
$("#addDish").onclick = addDishRow;
$("#sGps").onclick = () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(p => { $("#sLat").value = p.coords.latitude.toFixed(6); $("#sLng").value = p.coords.longitude.toFixed(6); },
    () => { $("#sDone").className = "status err"; $("#sDone").textContent = "Could not read your location. Type the latitude and longitude instead (Google Maps: right-click the shop, click the numbers)."; });
};
$("#shopForm").addEventListener("submit", async e => {
  e.preventDefault();
  const out = $("#sDone"); out.className = "status"; out.innerHTML = '<i class="spin"></i>Submitting...';
  const rows = [...document.querySelectorAll(".menu-row")].map(r => ({ name: r.querySelector(".d-name").value, price: r.querySelector(".d-price").value,
    veg: r.querySelector(".d-veg").checked, desc: r.querySelector(".d-desc").value, sig: r.querySelector(".d-sig").checked })).filter(r => r.name && r.price);
  const payload = { name: $("#sName").value, cuisine: $("#sCuisine").value, address: $("#sAddr").value, lat: $("#sLat").value, lng: $("#sLng").value,
    phone: $("#sPhone").value, hours: $("#sHours").value, email: $("#sEmail").value, website: $("#sWebsite").value, menu: rows, special: (rows.find(r => r.sig) || {}).name };
  try {
    const r = await fetch("/api/shops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Submit failed");
    out.textContent = "Thanks! Your shop is waiting for verification. It will appear on FOODFIND once approved."; e.target.reset(); $("#menuRows").innerHTML = ""; addDishRow();
  } catch (err) { out.className = "status err"; out.textContent = err.message === "Failed to fetch" ? "Could not reach the server. Start it with: node server.js" : err.message; }
});
