# Phase 3 Setup — Database + Secure Auth

## 1. Create a free Postgres database (Neon)

1. Go to https://neon.tech and sign up
2. Create a project
3. Copy the **connection string** (looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)

## 2. Environment variables

### Local (`.env.local`)
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="paste-a-long-random-string"
ADMIN_EMAIL="officialnexus265@gmail.com"
ADMIN_PASSWORD="your-strong-password"
```

Generate secret:
```bash
openssl rand -base64 32
```

### Vercel
Project → Settings → Environment Variables → add the same keys  
(set `NEXTAUTH_URL` to your real domain, e.g. `https://nexus265.vercel.app`)

## 3. Install & push schema

```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
```

## 4. Run

```bash
npm run dev
```

Login with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set.

## 5. Deploy

```bash
git add .
git commit -m "Phase 3: Prisma + NextAuth"
git push
```

On Vercel, after first deploy, you may need to run migrate via:
- Vercel CLI: `vercel env pull` then `npx prisma db push`
- Or add a build command: `prisma generate && prisma db push && next build`

---

### What this gives you
- Passwords hashed with bcrypt (never stored plain)
- Secure JWT sessions via NextAuth
- Websites + settings stored in Postgres (persist across devices)
- API routes protected for create/update/delete

### Fallback
If `DATABASE_URL` is missing, the public site still works with demo data / localStorage.
Admin login requires the database.
