# DevHub – Personal Website Directory, Portfolio & Marketplace

A modern Next.js application that serves as:

- **Public landing page** – showcase of all your websites with thumbnails, descriptions & live links
- **Selling / Marketplace page** – projects marked for sale with strikethrough pricing + “Talk to Developer”
- **Contact / Hire Me page** – email, WhatsApp, call buttons + contact form
- **Protected Admin dashboard** – add / edit / delete websites, upload notes, private blueprints (never store real passwords)
- Fancy animations, glassmorphism, gradient accents, Framer Motion

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React icons
- LocalStorage for demo data persistence (easy to migrate to database later)
- Cloudinary-ready for image uploads (paste URLs for now)

## Quick Start

```bash
cd website-hub
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Admin Login

- Email: `admin@devhub.com`
- Password: `devhub2026`

(Change these later via environment variables or replace with NextAuth.)

## Important Environment Variables (create `.env.local`)

```env
# Optional – used by login page for demo
NEXT_PUBLIC_ADMIN_EMAIL=admin@devhub.com
NEXT_PUBLIC_ADMIN_PASSWORD=your-strong-password

# Later for Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Later for real email form (Resend, etc.)
RESEND_API_KEY=...
```

## Pages

| Route       | Description                                      |
|-------------|--------------------------------------------------|
| `/`         | Landing + all websites grid + Hire Me CTAs       |
| `/selling`  | Projects for sale with prices & demo buttons     |
| `/contact`  | Contact methods + form + Hire Me section         |
| `/login`    | Fancy owner-only login                           |
| `/admin`    | Protected dashboard (CRUD + private notes)       |

## Customization Checklist

1. **Replace contact details** in:
   - `src/components/Footer.tsx`
   - `src/app/contact/page.tsx`
2. **Replace logo** – currently a simple “D” letter. Drop your logo into `/public` and update Navbar + Footer.
3. **Fonts** – currently Geist + Space Grotesk (modern & professional). Easy to swap in `layout.tsx`.
4. **Admin auth** – currently localStorage + hard-coded credentials for demo. For production:
   - Add NextAuth with Credentials provider
   - Or use a simple JWT / cookie approach with hashed password from env
5. **Data persistence** – currently `localStorage`. For production:
   - Prisma + Vercel Postgres / Supabase / Neon
   - Or a simple JSON file + API routes (not ideal for multi-instance)
6. **Cloudinary uploads** – Admin currently accepts image URLs. Add the Cloudinary Upload Widget or a signed upload API route later.
7. **Paychangu** – “Talk to Developer” buttons open contact with project pre-filled. When ready, add a payment button that redirects to Paychangu checkout.
8. **Contact form** – currently simulated. Wire to Resend, Formspree, or an API route that sends email.

## Hire Me Buttons

Present on:
- Navbar
- Footer
- Every website card
- Landing page hero & bottom CTA band
- Selling page

They all link to `/contact#hire`.

## Suggested Next Steps After Deploy on Vercel

1. Connect a real database
2. Implement proper NextAuth
3. Add Cloudinary signed uploads
4. Wire contact form to email service
5. Optional: Paychangu integration for one-click purchases
6. Add your real logo and replace placeholder images via the Admin panel

## License

Private / personal use. Customize freely.
