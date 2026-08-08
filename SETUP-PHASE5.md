# Phase 5 — Live chat + PWA alerts

## Features
- Visitor chat widget with bot menu + human handoff
- Admin inbox, FAQ answers, unknown questions
- **Ringtone-style alert** loops until you open the conversation
- Browser notifications
- **Installable PWA** (Add to Home Screen) for stronger background alerts
- Presence: visitors see “agent is assisting other customers” when you’re in a chat

## Admin setup
1. Open `/admin/chat` while logged in
2. Click **“Allow notifications & unlock alert sound”** (required once — browsers block sound until a click)
3. Leave **Alerts on**
4. Click **Install app** (or browser menu → Add to Home Screen)
5. Keep the admin chat tab or installed app open on your phone

## Database
```bash
npx prisma db push
```

## Limits (honest)
- Ringtone works best while the admin page/PWA is open or in background with notification permission
- Fully killing the browser may stop the loop; notification + vibrate still fire when possible
- Presence is in-memory (fine on one Vercel region); for multi-instance use Redis later

## Talk to Developer
Card buttons open the site chat widget directly.
