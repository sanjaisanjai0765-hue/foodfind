/* Map + location helpers (Leaflet, OpenStreetMap, Overpass API) */
const FFMap = {
  map: null, layer: null, markers: {}, userMarker: null,

  esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },

  // Distance in km between two points (haversine formula)
  distance(a, b) {
    const R = 6371, rad = d => d * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  },

  tiles() {
    // CARTO dark tiles (built from OpenStreetMap data). The default tile.openstreetmap.org
    // server can return "403 Access blocked" for local/dev sites, so we avoid it here.
    return L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19, subdomains: "abcd",
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
    });
  },

  init(ref) {
    if (typeof L === "undefined") return false; // Leaflet failed to load (offline)
    this.map = L.map("map").setView([ref.lat, ref.lng], 13);
    this.tiles().addTo(this.map);
    this.layer = L.layerGroup().addTo(this.map);
    return true;
  },

  setUser(ref, radiusKm) {
    if (!this.map) return;
    if (this.userMarker) this.userMarker.remove();
    this.userMarker = L.circleMarker([ref.lat, ref.lng], { radius: 9, color: "#fff", weight: 3, fillColor: "#FF7A1A", fillOpacity: 1 })
      .addTo(this.map).bindPopup("You are here");
    if (this.radiusCircle) this.radiusCircle.remove();
    this.radiusCircle = L.circle([ref.lat, ref.lng], { radius: radiusKm * 1000, color: "#FF9B45", weight: 1, fillOpacity: .04 }).addTo(this.map);
    this.map.fitBounds(this.radiusCircle.getBounds());
  },

  // Real places from OpenStreetMap. Returns [{id,name,type,lat,lng,distance}]
  async fetchNearby(ref, radiusKm) {
    const r = radiusKm * 1000;
    const q = `[out:json][timeout:25];(node["amenity"~"restaurant|cafe|fast_food"](around:${r},${ref.lat},${ref.lng}););out body 120;`;
    let res = null;
    try { res = await fetch(`/api/nearby?lat=${ref.lat}&lng=${ref.lng}&r=${radiusKm}`); } catch (e) {}
    if (!res || !res.ok) res = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q) }); // fallback without backend
    if (!res.ok) throw new Error("Overpass returned status " + res.status);
    const json = await res.json();
    return json.elements.map(e => ({
      id: e.id, name: (e.tags && e.tags.name) || "Unnamed place", type: (e.tags && e.tags.amenity || "").replace("_", " "),
      cuisine: e.tags && e.tags.cuisine, lat: e.lat, lng: e.lon,
      distance: this.distance(ref, { lat: e.lat, lng: e.lon })
    })).sort((a, b) => a.distance - b.distance);
  },

  showPlaces(places, onClick) {
    if (!this.map) return;
    this.layer.clearLayers(); this.markers = {};
    places.forEach(p => {
      const m = L.marker([p.lat, p.lng]).addTo(this.layer)
        .bindPopup(`<b>${this.esc(p.name)}</b><br>${this.esc(p.type)} · ${p.distance.toFixed(1)} km away`);
      m.on("click", () => onClick && onClick(p.id));
      this.markers[p.id] = m;
    });
  },

  focus(id) {
    const m = this.markers[id];
    if (!m) return;
    this.map.setView(m.getLatLng(), 17);
    m.openPopup();
    document.getElementById("map").scrollIntoView({ block: "center", behavior: "smooth" });
  },

  // Small map inside the restaurant modal
  mini(containerId, pos, label) {
    if (typeof L === "undefined") { document.getElementById(containerId).textContent = "Map unavailable (Leaflet could not load)."; return; }
    if (this.miniMap) this.miniMap.remove();
    this.miniMap = L.map(containerId).setView([pos.lat, pos.lng], 15);
    this.tiles().addTo(this.miniMap);
    L.marker([pos.lat, pos.lng]).addTo(this.miniMap).bindPopup(this.esc(label)).openPopup();
    setTimeout(() => this.miniMap.invalidateSize(), 50);
  }
};
