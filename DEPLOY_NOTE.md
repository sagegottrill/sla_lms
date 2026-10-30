# Production deployment note

The live web app at https://connecther.sheleadsafrica.org is NOT auto-deployed from GitHub.

- Every push to `She-Leads-Africa/sla_lms` or `sagegottrill/sla_lms` ships the mobile app code and source of truth, but the production domain must be deployed separately from the Vercel account that owns it.
- Stopgap preview with the latest build: https://sla-staging.vercel.app (project `sla-staging`, scope `daniels-projects-28b0dbd4`).
- To make the real domain auto-deploy: in the Vercel project that owns connecther.sheleadsafrica.org, connect the GitHub repo `She-Leads-Africa/sla_lms` (Settings → Git). After that, every push to `main` ships the web app automatically.
- How to verify a deploy took: fetch the site's `assets/index-*.js` and grep it for a marker of the newest change (e.g. `publicOnly` for the BoostHer features).
