# Phase 4 — Contact form emails (Resend)

## 1. Create Resend account
https://resend.com → Sign up → API Keys → Create

## 2. Env vars (local + Vercel)
```env
RESEND_API_KEY="re_xxxxx"
RESEND_FROM_EMAIL="nexus265 <onboarding@resend.dev>"
CONTACT_TO_EMAIL="officialnexus265@gmail.com"
```

For production, verify your own domain in Resend and change `RESEND_FROM_EMAIL` to something like `hello@yourdomain.com`.

## 3. Test
Fill the contact form on the site. You should receive the email.

Without `RESEND_API_KEY`, the form still returns success but no email is sent (check server logs).
