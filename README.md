# Karigar

Karigar is an educational handicraft discovery and visual-assessment application. It brings a curated sample of Indian craft traditions together with image-based category suggestions, saved scans, favorites, and account features.

> **Important:** An AI category suggestion is not proof of authenticity, geographical origin, material, or manufacturing method. GI information and craft descriptions are educational and should be checked against authoritative sources before being relied on.

## What the application does

- **Explore crafts:** Search the sample catalog and filter by state. Craft detail pages describe regions, materials, techniques, and GI status.
- **View GI information:** See place-based craft records and any available source links. The interface itself advises users to verify registration with official sources.
- **Analyze an image:** Signed-in users can upload a JPEG, PNG, or WebP image. The browser prepares a smaller WebP image; the server validates the upload, stores it in Cloudinary, and asks Gemini for a visible-category assessment and a likely craft name or closest visual style.
- **Review scan history:** See previous images and results, including failed analysis attempts, and submit helpful/not-helpful feedback.
- **Save favorites:** Keep a personal collection of catalog crafts.
- **Use the dashboard:** View scan and favorite counts and recent scans.
- **Ask the craft assistant:** Ask general craft questions and keep conversations. This assistant currently uses simple, built-in topic-based responses; it is **not** a generative AI chat integration.
- **Manage database records:** Accounts with the `ADMIN` role can search, page through, inspect, create, update, and delete records in all 14 Prisma models. Changes are validated, relation/unique-key conflicts are reported, deletes require confirmation, and data changes are written to `AdminActivity`.
- **Personalize the interface:** Switch dark mode and choose from seven color palettes. Analysis reports have a print-friendly layout that can be saved as PDF through the browser print dialog.

The starter catalog includes Kashmiri Pashmina, Banarasi Saree, Phulkari, Jaipur Blue Pottery, and Madhubani Painting.

## Technology

| Area | Technology |
| --- | --- |
| Web application and routes | Next.js 16 App Router, React 19, TypeScript |
| Styling and bundling | Tailwind CSS 4 with the Next.js Turbopack integration; application CSS |
| Authentication | Clerk |
| Database and ORM | PostgreSQL, Prisma 6 |
| Uploaded image storage | Cloudinary |
| Image category analysis | Google Gemini API, called server-side by the Next.js analyze route |
| Optional standalone service | FastAPI, Pillow, Python |
| Interactive craft artwork and icons | Three.js, Lucide |

## How image analysis works

1. The scanner accepts JPEG, PNG, and WebP images up to 10 MB. The browser resizes the image and converts it to WebP for upload.
2. `POST /api/analyze` checks the image type and file signature, requires a signed-in Clerk user, and ensures that user's database record exists.
3. The route uploads the image to the `karigar/scans` folder in Cloudinary and creates a scan record in PostgreSQL.
4. The route sends the image and a constrained classification prompt to Gemini. It retries transient provider failures and can try a fallback model.
5. On success, the broad category and result are saved and returned to the browser. Gemini also suggests a named craft when visual cues support it, or labels the closest plausible craft style as a visual resemblance. These suggestions are not verified identifications. If analysis fails after the scan is created, the scan is marked failed and the error is saved to scan history.

The response contains a broad category, optional craft-name suggestion and match type, classification confidence, visible indicators, an explanation, the scan ID, and the stored image URL. `visualSimilarity` is always `null`: no verified reference-image comparison database or embeddings are currently configured. Gemini is asked to assess visible characteristics only; it cannot establish authenticity or provenance.

## Routes

### Pages

| Path | Purpose |
| --- | --- |
| `/` | Landing page |
| `/explore` | Search and filter the craft catalog |
| `/explore/[slug]` | Craft details |
| `/gi` | GI information for catalog crafts |
| `/scan` | Upload and analyze a craft image |
| `/scan/history` | Signed-in user's scan history and feedback |
| `/dashboard` | Signed-in user's overview |
| `/favorites` | Signed-in user's saved crafts |
| `/assistant` | Craft Q&A and saved conversations |
| `/admin` | Admin-only CRUD console for all Prisma models |
| `/sign-in`, `/sign-up` | Clerk authentication pages |

### API

| Method and path | Purpose |
| --- | --- |
| `POST /api/analyze` | Authenticated image upload, Gemini category assessment, and scan persistence |
| `GET /api/favorites` | List the signed-in user's favorite craft slugs |
| `POST /api/favorites` | Save a catalog craft |
| `DELETE /api/favorites` | Remove a saved craft |
| `POST /api/auth/sync` | Ensure the signed-in Clerk user and profile are present in PostgreSQL |
| `GET /api/chat` | Load saved conversations |
| `POST /api/chat` | Add a user message and the built-in assistant response |
| `POST /api/scans/{scanId}/feedback` | Save feedback for a scan belonging to the signed-in user |
| `GET /api/admin/models` | Admin-only model registry and record counts |
| `GET /api/admin/models/{model}` | Admin-only paginated and searchable record listing |
| `POST /api/admin/models/{model}` | Admin-only record creation |
| `PATCH /api/admin/models/{model}` | Admin-only record update |
| `DELETE /api/admin/models/{model}` | Admin-only record deletion |

### Admin data management

The admin console covers `AdminActivity`, `ChatConversation`, `ChatMessage`, `Favorite`, `GIInformation`, `Handicraft`, `HandicraftCategory`, `ImageEmbedding`, `ReferenceImage`, `Scan`, `ScanFeedback`, `ScanResult`, `User`, and `UserProfile`. Each model has typed fields, JSON editors where needed, searchable/paginated lists, full record details, and create/edit/delete actions.

All admin APIs check the signed-in user's database role. Foreign-key and unique-key errors are returned to the console rather than silently ignored. Deleting a record follows the relations configured in Prisma; the UI asks for confirmation first. Data changes are logged in `AdminActivity`. Admins cannot remove their own administrator role/account or remove the last administrator.

`User` rows represent the application's database records, not Clerk identities. Creating or deleting a row in this console does not create or delete a Clerk account. A deleted Clerk user's database row may be recreated on their next authenticated request. To bootstrap the first administrator, sign in once, then use a trusted database client to set that account's `User.role` to `ADMIN`; do not expose this privilege through public signup.

## Database

The Prisma schema is in [`prisma/schema.prisma`](./prisma/schema.prisma). It defines users and profiles, craft categories and catalog records, GI information, optional reference images and embeddings, scans and results, scan feedback, favorites, assistant conversations/messages, and admin activity.

The seed script (`prisma/seed.ts`) upserts three categories and five starter crafts. Run it after applying migrations. The favorites API can also create a database catalog entry for a craft found in the local catalog when it is first saved.

## Requirements

- Node.js 20 or newer and npm
- PostgreSQL
- A Clerk application for authentication
- Cloudinary credentials for persistent scan images
- A Gemini API key for image category analysis
- Python 3.11 or newer only if running the optional FastAPI service

## Local setup

1. Install the JavaScript dependencies:

   ```powershell
   npm install
   ```

2. Create `.env` from `.env.example` if you do not already have a local `.env`, then fill in the values below. Do not overwrite an existing `.env` containing credentials.

3. Start PostgreSQL and set `DATABASE_URL` to the connection string for your database.

4. Generate the Prisma client, create/apply the development migration, and seed the catalog:

   ```powershell
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. Start the web application:

   ```powershell
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000). Sign in before testing authenticated features such as image analysis, favorites, or scan history.

### Environment variables

`.env.example` lists the variables used by the project. Set the following values as appropriate:

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk authentication | Public Clerk publishable key |
| `CLERK_SECRET_KEY` | Server-side Clerk authentication | Keep secret; never use a `NEXT_PUBLIC_` prefix |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Clerk navigation | Defaults to `/sign-in` in the example |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk navigation | Defaults to `/sign-up` in the example |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Post-login navigation | Defaults to `/dashboard` in the example |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Post-registration navigation | Defaults to `/dashboard` in the example |
| `DATABASE_URL` | PostgreSQL persistence | PostgreSQL connection string used by Prisma |
| `CLOUDINARY_CLOUD_NAME` | Persistent scan image storage | Server-side Cloudinary setting |
| `CLOUDINARY_API_KEY` | Persistent scan image storage | Server-side Cloudinary credential |
| `CLOUDINARY_API_SECRET` | Persistent scan image storage | Secret; do not expose to the browser |
| `AI_PROVIDER` | Gemini analysis | Set to `gemini` |
| `AI_PROVIDER_API_KEY` | Gemini analysis | Server-side Google AI API key; never prefix with `NEXT_PUBLIC_` |
| `GEMINI_MODEL` | Gemini analysis | Optional; defaults to `gemini-3.5-flash-lite` in the route |
| `GEMINI_FALLBACK_MODEL` | Gemini analysis | Optional; defaults to `gemini-3.8-flash` in the route |
| `NEXT_PUBLIC_APP_URL` | Public app URL | Optional; the example uses `http://localhost:3000` |
| `AI_SERVICE_URL` | Optional standalone-service configuration | Present in the example, but the current Next.js analyze route does not call this service |

For Clerk, configure the application to use the `/sign-in` and `/sign-up` routes and enable the sign-in methods you intend to support. Keep all secret keys in server-only environment variables. In deployment environments, add the same settings through the platform's environment-variable manager and redeploy after changing them.

## Optional FastAPI service

The separate service is in [`ai-service/`](./ai-service/). It currently validates image uploads but has **no classification or embedding model configured**. The production-style scan flow described above calls Gemini directly from the Next.js route; it does not call this FastAPI service.

To run the optional service locally in PowerShell:

```powershell
cd ai-service
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Available endpoints:

- `GET /health` reports that no model or reference comparison is configured.
- `POST /analyze-image` validates image type, size, and resolution, then returns `501` because no analysis model is installed.
- `POST /generate-embedding` returns `501` because no embedding model is installed.

Implement and configure a suitable model and populate trusted reference data before using this service for real analysis or similarity comparisons.

## Development commands

| Command | Description |
| --- | --- |
| `npm run dev` | Run the Next.js development server |
| `npm run build` | Generate the Prisma client and build Next.js |
| `npm start` | Run the production Next.js server after building |
| `npm run lint` | Run ESLint |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Run `prisma migrate dev` |
| `npm run prisma:seed` | Seed the starter craft catalog |
| `npx prisma validate` | Validate the Prisma schema |

There is currently no automated test script in `package.json`.

## Deployment notes

- Deploy the Next.js app to a Node-compatible host and configure all Clerk, PostgreSQL, Cloudinary, and Gemini variables in that environment.
- Apply committed migrations with `npx prisma migrate deploy` as part of the production database release process. Run the seed command only when you want to populate/update the starter catalog.
- For serverless deployments, use the PostgreSQL provider's recommended pooled runtime connection and observe its connection limits. Use the provider's recommended migration connection when required.
- Ensure the host's request-size and execution-time limits accommodate image upload, Cloudinary storage, and the Gemini request. The scanner reduces image dimensions and upload size in the browser, but the route still enforces a 10 MB limit.
- The standalone FastAPI service is not required by the current Next.js Gemini flow. If you deploy it separately, deploy and configure it independently.

## Limitations

- A signed-in account is required to save scans and favorites. Authentication uses Clerk; user/profile and application data are persisted in PostgreSQL.
- Cloudinary is required for durable scan image storage. Gemini configuration is required for AI category analysis.
- Gemini can be unavailable or rate-limited; a fallback model is attempted, but successful analysis is not guaranteed.
- Visual similarity remains unavailable until a trusted reference-image collection and compatible embeddings are configured.
- A photograph cannot prove authenticity, GI status, material composition, manufacturing technique, or provenance. Treat AI output and catalog descriptions as informational.
