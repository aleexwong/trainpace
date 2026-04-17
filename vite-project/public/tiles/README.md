# PMTiles archives

Drop your `.pmtiles` file here and it will be served from
`https://www.trainpace.com/tiles/<name>.pmtiles`.

## Recommended files

- `world.pmtiles` — Protomaps daily build (~100 MB, global basemap).
  Download: https://maps.protomaps.com/builds/
  Or build a smaller subset with `pmtiles extract` for just the cities
  you care about (Boston, NYC, Chicago, Berlin, London, Tokyo, Sydney, Oslo)
  to get the file under ~20 MB.

- `terrarium.pmtiles` — optional raster-DEM tiles for 3D terrain.
  Skip unless you flip `terrain3D` on.

## Vercel notes

- Vercel serves static files with HTTP Range support, which PMTiles requires.
- `vercel.json` adds `Cache-Control: public, max-age=31536000, immutable`
  for `/tiles/*.pmtiles` so repeat visitors hit the CDN, not your bandwidth.
- Vercel Hobby plan includes 100 GB bandwidth/mo. A typical map session
  fetches 50–200 KB of tile ranges, so ~500k–2M sessions before you hit
  the cap. Pro plan is 1 TB.

## Local dev

If the file is too large to commit, gitignore it and use the
`VITE_PMTILES_URL` env var to point at a CDN URL during dev.
