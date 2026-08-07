# Phase 4 — Contact form via SMTP

No Resend needed. Uses **nodemailer** + your SMTP server.

## Gmail example

1. Enable 2-Step Verification on the Google account  
2. Create an **App Password**: Google Account → Security → App passwords  
3. Use that 16-character password (not your normal Gmail password)

## Environment variables

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="officialnexus265@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
SMTP_FROM="nexus265 <officialnexus265@gmail.com>"
CONTACT_TO_EMAIL="officialnexus265@gmail.com"
```

- `SMTP_PORT=465` → SSL (`secure: true`)  
- `SMTP_PORT=587` → STARTTLS (default)

## Other providers

| Provider   | Host                     | Port |
|------------|--------------------------|------|
| Gmail      | smtp.gmail.com           | 587  |
| Outlook    | smtp.office365.com       | 587  |
| Zoho       | smtp.zoho.com            | 587  |
| Mailtrap   | sandbox / live host      | 587  |
| cPanel     | mail.yourdomain.com      | 465  |

Add the same vars on **Vercel → Project → Environment Variables**, then redeploy.

## Test

Submit the contact form. You should receive the email at `CONTACT_TO_EMAIL` (or the email saved in Admin Settings).
