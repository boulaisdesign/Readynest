# Tenant Heat

A private phone page that lets tenants nudge the Nest Thermostat E up or down, only between
limits you set (19–23 °C by default). Any change resets on its own after `BOOST_HOURS`.
It runs as a Cloudflare Worker (free plan) and talks to the thermostat through Google Device Access ($5 once).
Tenants never get access to your Google Home.

The full setup walkthrough is in the "Tenant Heat Web Page" doc. Short version:

1. **Google setup (once):** enable the Smart Device Management API, publish the OAuth consent
   screen to *Production*, create a Web OAuth client (redirect `https://www.google.com`), create a
   Device Access project, link your Nest account, then exchange the code for a refresh token and
   look up the thermostat's device ID.
2. **Install:** `cd tenant-heat && npm install`
3. **Store:** `npx wrangler kv namespace create STATE`, then paste its id into `wrangler.toml`.
4. **Secrets:** `npx wrangler secret put` for each of `CLIENT_ID`, `CLIENT_SECRET`,
   `REFRESH_TOKEN`, `PROJECT_ID`, `DEVICE_ID`, `PIN`.
5. **Deploy:** `npm run deploy` → `https://tenant-heat.<you>.workers.dev`. Give tenants the link
   and PIN; they can "Add to Home Screen".

## Using it

- Drag the dial or tap **Cooler / Warmer**. Steps are 0.5 °C and stay inside the limits.
- The pill shows when the setting goes back to normal. A timer checks every 5 minutes.
- Changes are only accepted while the thermostat is in **Heat** (not Off, Cool or Eco).
- 10 wrong PINs locks the page for 15 minutes. Change the `PIN` secret to lock tenants out.
- Change `MIN_C`, `MAX_C` or `BOOST_HOURS` in `wrangler.toml` and redeploy.

## Develop

- `npm test` runs the Worker against a fake thermostat (no Google account needed).
- `npm run dev` runs locally with real credentials from `.dev.vars` (copy `.dev.vars.example`).
