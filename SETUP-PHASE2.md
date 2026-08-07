# Phase 2 — Cloudinary Uploads

## 1. Create a free Cloudinary account

1. Go to https://cloudinary.com → Sign up
2. Open **Dashboard**
3. Copy:
   - Cloud name
   - API Key
   - API Secret

## 2. Add environment variables

### `.env.local` (and Vercel → Environment Variables)

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

Optional unsigned preset (not required for our signed API route):
```env
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=""
```

## 3. Restart

```bash
npm run dev
```

## 4. Use it

- **Settings** → Upload logo / hero image
- **Admin → Add/Edit website** → Upload thumbnail button

Images go to folder `nexus265/` on Cloudinary.

If Cloudinary env vars are missing, uploads automatically fall back to a local data-URL (still works offline).

## Vercel

Add the three Cloudinary variables in Project → Settings → Environment Variables, then redeploy.
