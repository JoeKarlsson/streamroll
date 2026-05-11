<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deployment

This project is deployed on Vercel under the account `joekarlsson1@gmail.com` (scope: `joekarlsson1gmailcoms-projects`), project name `streamroll`.

- Live URL: https://streamroll.vercel.app
- No environment variables are required — the app is BYOK (users supply their own Runway API key in the browser via `/setup`)
- To deploy: `vercel` (preview) or `vercel --prod` (production)
- To link on a new machine: `vercel login` with `joekarlsson1@gmail.com`, then `vercel link --scope joekarlsson1gmailcoms-projects`
