# WebMap 🗺️

Pantauan dunia **ringan** yang menampilkan kabar mentah (kapal, jaringan, cuaca, harga) di satu peta yang selalu diperbarui — dibangun dengan **vanilla HTML/CSS/JS + Three.js + Leaflet**, didukung **micro-server Node.js tanpa dependency**. Tampilan meniru pola World Monitor: gelap, padat data, bersumber, dan live.

## Fitur

- **Tampilan monitor dark-mode** — hero headline + strip statistik, ticker sinyal berjalan, dan empat panel live (Sinyal Teratas / Indeks Ketidakstabilan / Chokepoint Maritim / Pasar).
- **Micro-server Node.js** (`server.js`, zero-dependency) — serve statis + gzip + ETag/cache header, endpoint `/api/health`, `/api/locations`, `/api/kpi`, `/api/monitor`, dan `/api/stream` (SSE).
- **Peta Lokasi live (Leaflet)** — titik aktivitas dari `/api/locations` dengan penanda berdenyut, peta ikut ganti tema; fallback ke data statis jika server Node tidak aktif.
- **Grafik 2D ringan** — line, bar, dan donut dari canvas murni; grafik garis **live real-time** via SSE (`/api/stream`), dengan simulasi lokal sebagai cadangan.
- **Visualisasi 3D (Three.js)** — lahan data interaktif (orbit + zoom), partikel latar hero; rendering dijeda otomatis saat tab tersembunyi / keluar layar.
- **KPI dari API** — angka Ringkasan diperbarui dari `/api/kpi` bila tersedia.
- **Dark / light mode** — toggle tersimpan di `localStorage`; hormati `prefers-reduced-motion`.
- **Korelasi** — kartu Tekanan → Transmisi → Konsekuensi ala permukaan korelasi.
- **Form kontak** — validasi client-side + feedback.
- **SEO & PWA dasar** — meta/Open Graph, `manifest.json`, service worker cache ringan (termasuk precache Leaflet). Nol API key.

## Struktur

```
webmap/
├── index.html        # semantik, SEO, importmap, panel live + peta
├── server.js         # micro-server Node (statis+gzip, API, SSE)
├── package.json      # scripts: start & check
├── css/style.css     # tema monitor, ticker, panel, tabel, responsive
├── js/
│   ├── theme.js      # dark/light mode
│   ├── main.js       # nav, reveal, form, refresh KPI
│   ├── monitor.js    # render panel live + ticker + stat (+ fallback)
│   ├── charts.js     # kanvas 2D: line/bar/donut + live buffer
│   ├── map.js        # Leaflet: peta + penanda berdenyut
│   ├── live.js       # SSE consumer + fallback simulasi
│   └── scene.js      # Three.js: hero + lahan data 3D
├── sw.js             # cache shell ringan (+ precache Leaflet)
└── manifest.json     # PWA basic
```

## Menjalankan

**Dengan micro-server Node (disarankan):**

```bash
npm start          # atau: PORT=8080 node server.js
npm run dev        # auto-restart saat file berubah (Node >= 18.11)
# buka http://localhost:8000
```

Env opsional: `PORT` (default 8000), `HOST` (default semua interface), `CORS_ORIGIN` (default `*`).
Data API dibaca dari `data/locations.json`, `data/kpi.json`, `data/monitor.json` (bisa diedit tanpa restart).

Server menyediakan juga:
- `GET /api/health` — status, uptime, jumlah klien SSE
- `GET /api/locations` — data titik untuk peta
- `GET /api/kpi` — angka KPI
- `GET /api/monitor` — agregat panel live (stats, signals, sectors, chokepoints, markets)
- `GET /api/stream` — Server-Sent Events, satu nilai setiap 2 detik (maks 200 klien)

**Tanpa Node (halaman tetap jalan):**

```bash
python3 -m http.server 8000
```

Halaman otomatis fallback ke data statis; badge grafik berubah ke "simulasi", peta memakai sumber "data statis".

## Performa

- Total aset lokal < 25 KB.
- Three.js & Leaflet dari CDN unpkg (strong HTTP cache; Leaflet diprecache oleh SW).
- Draw calls minimal, `devicePixelRatio` dibatasi ≤ 2.
- `IntersectionObserver` + `visibilitychange` menangguhkan rendering & animasi peta.
- Server: gzip, ETag, `no-store` untuk API, cache ringan.

## Lisensi

MIT