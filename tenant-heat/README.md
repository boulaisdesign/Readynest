# Tenant Heat

A private phone page that lets tenants nudge the Nest Thermostat E up or down, only between
limits you set (19–23 °C by default). Any change resets on its own after `BOOST_HOURS`.
Tenants sign in with their Google account (only emails you list get in) and see the
live outdoor weather. It runs as a Cloudflare Worker (free plan) and talks to the thermostat through Google Device Access ($5 once).
Tenants never get acce1. **Google setup (once):** enable the Smart Device Management API, publish the OAuth consent
   screen to *Production*, create a Web OAuth client (redirect `https://www.google.com`), create a
   Device Access project, link your Nest account, then exchange the code for a refresh token and
   look up the thermostat's device ID.
2. **Install:** `cd tenant-heat && npm install`
3. **Store:** `npx wrangler kv namespace create STATE`, then paste its id into `wrangler.toml`.
4. **Weather:** put your `LAT` / `LON` (and a `PLACE` name for the header) in `wrangler.toml`.
5. **Secrets:** `npx wrangler secret put` for each of `CLIENT_ID`, `CLIENT_SECRET`,
   `REFRESH_TOKEN`, `PROJECT_ID`, `DEVICE_ID`, plus:
   - `ALLOWED_EMAILS`: the tenants' Google emails, comma separated
   - `SESSION_SECRET`: long random text, e.g. from `openssl rand -base64 48`
6. **Deploy:** `npm run deploy` → `https://tenant-heat.<you>.workers.dev`.
7. **Allow sign-in from that address:** in Google Cloud Console → APIs & Services → Credentials,
   open your OAuth client and add `https://tenant-heat.<you>.workers.dev` under
   **Authorized JavaScript origins**. (To use a separate client just for sign-in, set its ID as
   the `SIGNIN_CLIENT_ID` secret.)
8. Send tenants the link; they can "Add to Home Screen".

## Using it

- Tenants tap **Sign in with Google**. They stay signed in for 30 days; the ☰ button signs out.
- To remove someone, take their email out of `ALLOWED_EMAILS` (`npx wrangler secret put ALLOWED_EMAILS`).
  It takes effect on their next request, even if they're signed in.
- Tap a setting in the strip at the bottom (or use arrow keys). Steps are 0.5 °C and stay inside the limits.
- The line under the status shows when the setting goes back to normal. A timer checks every 5 minutes.
- Changes are only accepted while the thermostat is in **Heat** (not Off, Cool or Eco).
- Header shows the current outdoor temperature and conditions; ↑/↓ are today's outdoor high and low.
- Change `MIN_C`, `MAX_C` or `BOOST_HOURS` in `wrangler.toml` and redeploy.

## Security

- Sign-in tokens are checked against Google's public keys (signature, app ID, expiry, verified email).
- The session is an HttpOnly, Secure, SameSite cookie signed with `SESSION_SECRET`.
- Requests from other websites are refused, and the page can't be framed.
- Google and Nest credentials stay on the server and never reach the phone.

 secret to lock tenants out.
- Change `MIN_C`, `MAX_C` or `BOOST_HOURS` in `wrangler.toml` and redeploy.

## Develop

- `npm test` runs the Worker against a fake thermostat (no Google account needed).
- `npm run dev` runs locally with real credentials from `.dev.vars` (copy `.dev.vars.example`).
