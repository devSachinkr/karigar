# Karigar

Karigar is a Next.js and FastAPI application for exploring Indian handicrafts and assessing visible similarities in uploaded images. It is educational and does not establish authenticity, provenance or physical material composition.

## Prerequisites
- Node.js 20+
- npm
- PostgreSQL
- Python 3.11+

## Installation
```powershell
npm install
npx prisma generate
```

## Environment
Copy `.env.example` to `.env` and fill credentials. Public variables begin with `NEXT_PUBLIC_`; all API keys and database URLs are server-only.

Integrations:
- Clerk publishable and secret keys
- PostgreSQL `DATABASE_URL`
- Cloudinary credentials
- Gemini API key
- Optional local `AI_SERVICE_URL`

## Gemini setup
Create a free API key in Google AI Studio. Add these server-side values:

```env
AI_PROVIDER=gemini
AI_PROVIDER_API_KEY=your_server_side_key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_FALLBACK_MODEL=gemini-3.8-flash
```

Do not prefix the key with `NEXT_PUBLIC_`. The Next.js API route sends uploads directly to Gemini from the server and never exposes the key to the browser.

For Vercel, add `AI_PROVIDER`, `AI_PROVIDER_API_KEY`, `GEMINI_MODEL`, and `GEMINI_FALLBACK_MODEL` under Project Settings → Environment Variables. Redeploy after changing them. Gemini free-tier limits and availability may change; Flash-Lite is a cost-efficient model, but free hosted capacity is not guaranteed to be free of rate limits or busy periods.

## Database
```powershell
npx prisma migrate dev --name init
npx prisma db seed
```

On login, Karigar upserts the Clerk user and profile into PostgreSQL. Every authenticated scan uploads its image to Cloudinary and stores a `Scan` plus `ScanResult` record. Failed AI attempts are also saved as failed scans so the uploaded image and failure stay in history. Existing database tables were checked against the Prisma models; the app schema is not changed by this feature.

Favorites, assistant conversations/messages, scan feedback, and administrator overview/audit activity are persisted as well. The seed includes the curated craft/category/GI catalog, and the favorites API can create a missing catalog record when a user saves one. No Prisma schema change is required. Verified reference images and real embeddings are intentionally not fabricated; visual similarity remains unavailable until those are supplied by a trusted source and a compatible embedding model is configured.

The appearance controls include dark mode and seven persistent palettes. Analysis reports open a print-only layout without scanner controls, so choose “Save as PDF” in the browser print dialog to download a PDF.

## Clerk
Create a Clerk application, enable email/password and Google OAuth, copy keys to `.env`, and configure `/sign-in` and `/sign-up` routes.

## AI service
```powershell
cd ai-service
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

The included service validates images but deliberately does not fabricate classifications or similarity scores. Add CLIP or another Hugging Face model in `main.py`, and populate verified reference embeddings before enabling real comparison.

The scanner compresses supported images in the browser to stay within Vercel function request limits before uploading them to Cloudinary and the analysis route.

## Run
```powershell
npm run dev
```
Open `http://localhost:3000`.

For separate services:
- Web app: `npm run dev`
- AI service: `cd ai-service && uvicorn main:app --reload --port 8001`
- Database: start PostgreSQL and configure `DATABASE_URL`

## Deployment
Deploy Next.js to a Node-compatible platform and FastAPI as a separate service. Set environment variables independently. PostgreSQL and Cloudinary are external services.

## Limitations
- Clerk credentials are required for authentication and protected dashboard routes.
- PostgreSQL is required for persisted history, favorites and admin operations.
- Cloudinary credentials are required for durable image storage.
- A photo alone cannot verify material, manufacturing method or provenance.
