# ScamShield AI

Complete project documentation for the React frontend, FastAPI backend, Supabase database, and Gemini integration. Consolidated on November 3, 2026.

## Contents

- [Overview and quick start](#overview-and-quick-start)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
- [Supabase setup](#supabase-setup)
- [Gemini setup](#gemini-setup)
- [API reference](#api-reference)
- [Vercel deployment](#vercel-deployment)
- [Integration details](#integration-details)
- [Implementation plan and decisions](#implementation-plan-and-decisions)
- [Verification and remaining work](#verification-and-remaining-work)

## Overview and quick start

Application files are organized into:

- `frontend/`: React UI, pages, components, frontend tests, Vite/Tailwind configuration, and static assets.
- `backend/`: FastAPI API, Gemini/Supabase integration, Python tests/dependencies, and server environment configuration.
- `supabase/`: database migrations, database verification tests, and database setup guide.

See [Project structure](#project-structure) for the full file tree and [Local setup](#local-setup) for installation and configuration.

### Run locally

From this repository root, install JavaScript dependencies once with `npm install`. The root package uses npm workspaces for the frontend and database tests; their dependencies share the root `node_modules/` folder.

Server settings and credentials belong in `backend/.env`. Browser-visible settings belong in `frontend/.env`. Both local files are ignored by Git; examples are provided in each folder for new installations.

Start the backend from the repository root:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn backend.api.index:app --reload --host 127.0.0.1 --port 8000 --no-access-log
```

Start the frontend in a second terminal at the repository root:

```powershell
npm run dev
```

Open `http://localhost:5173`. Alternatively, run `npm run dev` inside `frontend/`. If starting Python from inside `backend/`, use `.venv\Scripts\python.exe -m uvicorn api.index:app --reload --host 127.0.0.1 --port 8000 --no-access-log`.

### Verify from the repository root

```powershell
npm test
npm run test:db
npm run build
backend\.venv\Scripts\python.exe -m pytest -c backend/pytest.ini backend/tests
backend\.venv\Scripts\python.exe -m ruff check --config backend/pyproject.toml backend/api backend/tests api
```

The build output is `frontend/dist/`. Deployment configuration remains at the root. The root `api/index.py` file is only a Vercel entry adapter; backend application code is in `backend/`. Root `requirements.txt` mirrors the backend runtime requirements so Vercel can parse the deployment dependencies directly. See [Vercel deployment](#vercel-deployment) for deployment setup.

## Project structure

The application files are physically organized into `frontend/`, `backend/`, and `supabase/`. Paths below are relative to the repository root.

```text
ScamShield-AI-pranav/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── scripts/
│   │   └── capture-verification.mjs
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── FormError.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── LoadingState.tsx
│   │   │   │   ├── PasswordInput.tsx
│   │   │   │   ├── ProtectedRoute.tsx
│   │   │   │   └── RiskIndicator.tsx
│   │   │   ├── layout/
│   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── PageContainer.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── results/
│   │   │   │   └── ResultCard.tsx
│   │   │   └── scanner/
│   │   │       ├── FileUpload.tsx
│   │   │       └── ScannerTabs.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── AdminPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── HistoryPage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── HowItWorksPage.tsx
│   │   │   ├── NotFoundPage.tsx
│   │   │   ├── PasswordRecoveryPage.tsx
│   │   │   ├── ResultsPage.tsx
│   │   │   ├── ScannerPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── SignInPage.tsx
│   │   │   └── SignUpPage.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── http.ts
│   │   ├── test/
│   │   │   ├── auth-validation.test.tsx
│   │   │   ├── backend-integration.test.tsx
│   │   │   ├── dashboard-and-admin.test.tsx
│   │   │   ├── navigation.test.tsx
│   │   │   ├── scanner.test.tsx
│   │   │   └── setup.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── .env  # ignored local configuration
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── ScamShield-AI-Frontend.zip
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── backend/
│   ├── api/
│   │   ├── _app/
│   │   │   ├── core/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── config.py
│   │   │   │   ├── middleware.py
│   │   │   │   └── security.py
│   │   │   ├── routes/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── admin.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── history.py
│   │   │   │   ├── scan.py
│   │   │   │   └── settings.py
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── results.py
│   │   │   │   ├── scan.py
│   │   │   │   └── settings.py
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── gemini_service.py
│   │   │   │   ├── privacy.py
│   │   │   │   ├── rule_engine.py
│   │   │   │   ├── scanning.py
│   │   │   │   ├── supabase_service.py
│   │   │   │   └── url_analyzer.py
│   │   │   ├── __init__.py
│   │   │   └── main.py
│   │   ├── __init__.py
│   │   └── index.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_foundation.py
│   │   ├── test_history.py
│   │   ├── test_rules.py
│   │   ├── test_scan.py
│   │   └── test_security.py
│   ├── .env  # ignored local configuration
│   ├── .env.example
│   ├── __init__.py
│   ├── pyproject.toml
│   ├── pytest.ini
│   ├── requirements-dev.txt
│   └── requirements.txt
├── supabase/
│   ├── migrations/
│   │   └── 20261102063353_initial_scamshield_backend.sql
│   ├── tests/
│   │   └── test-database.mjs
│   └── package.json
├── api/
│   ├── __init__.py
│   └── index.py
├── package.json
├── package-lock.json
├── requirements.txt
├── vercel.json
├── .vercelignore
├── .gitignore
├── .python-version
└── README.md
```

`frontend/` contains the browser application and frontend configuration. Its `src/services/` files are HTTP clients, not backend logic. The original frontend archive is also retained there.

`backend/` contains all server application code, Python configuration/tests, the local `.venv/`, and backend credentials in its ignored `.env` file.

`supabase/` contains the unchanged migration, its local PostgreSQL authorization tests, and its setup guide. The actual database and Auth service remain hosted in Supabase.

Shared root files coordinate local commands and deployment. Root `api/` contains only the Vercel adapter (`__init__.py` and `index.py`), which imports `backend/api/index.py`. Root `requirements.txt` mirrors `backend/requirements.txt` for the Vercel build. Root `package.json` coordinates the frontend and database npm workspaces, with one shared lockfile and `node_modules/`.

Generated/local folders omitted from the tree: root `node_modules/`, `.cache/`, `.tools/`, `.git/`, `.vscode/`; frontend `dist/`, `screenshots/`, dependency caches; backend `.venv/`, `.pytest_cache/`, `.ruff_cache/`, and Python `__pycache__/` folders.

Run instructions: [Overview and quick start](#overview-and-quick-start). Setup: [Local setup](#local-setup). Verification: [Verification and remaining work](#verification-and-remaining-work).

## Local setup

The existing React interface is connected to a FastAPI backend. Supabase owns authentication and PostgreSQL storage. Gemini is optional for text/URL scans and required for screenshot analysis.

### 1. Prerequisites

- Node.js 24 and npm.
- Python 3.12+ (the deployment targets 3.12).
- A free Supabase project for accounts/history.
- A Google AI Studio free-tier API key for AI and screenshots.
- A Vercel account only when deploying.

No paid service or SMS provider is required. Do not enable billing to run the college demo. Free quotas and model availability depend on your account; see [Gemini setup](#gemini-setup).

### 2. Install

Run the following commands from the repository root, which contains `frontend/`, `backend/`, and `supabase/`:

```powershell
npm install
py -3.12 -m venv backend/.venv
backend\.venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (-not (Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
```

If Python 3.12 is already your default, use `python -m venv backend/.venv`. On macOS/Linux, use `python3.12 -m venv backend/.venv` and `backend/.venv/bin/python` instead.

This workspace also has an ignored, project-local Python installation used for verification. On this machine, `backend\.venv\Scripts\python.exe` is already available. It is not committed or required on another computer.

This existing workspace's environment was created with `uv` and does not include `pip`. To install or update dependencies here, use the installed `uv` instead:

```powershell
uv --cache-dir .cache/uv pip install --python backend\.venv\Scripts\python.exe -r backend/requirements-dev.txt
```

### 3. Configure services

Follow [Supabase setup](#supabase-setup) for the database and email authentication setup. The existing connected project is already migrated. Edit your ignored `backend/.env` for server settings:

```dotenv
APP_ENV=development
APP_ORIGIN=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_LEGACY_ANON_KEY
GEMINI_API_KEY=YOUR_AI_STUDIO_KEY
GEMINI_MODEL=gemini-3.5-flash-lite
```

The frontend has its own `frontend/.env`, containing only browser-visible configuration:

```dotenv
VITE_API_BASE_URL=/api/v1
```

Values above are placeholders. Never put Gemini or privileged database credentials in a variable starting with `VITE_`; those variables are compiled into public JavaScript. The application does not need a Supabase service-role key.

Put actual server credentials in `backend/.env`, not either example file or the frontend folder. FastAPI loads `backend/.env` using its absolute package location, so it works from either the root or backend directory. Development accepts `localhost` and `127.0.0.1` at the configured frontend port. Production still requires its exact configured origin.

### 4. Start both processes

Terminal 1:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn backend.api.index:app --reload --host 127.0.0.1 --port 8000 --no-access-log
```

Terminal 2:

```powershell
npm run dev
```

Open `http://localhost:5173`. Vite forwards `/api` to port 8000. This keeps the browser and session cookies on one origin. Restart FastAPI after changing `backend/.env`.

Open `http://localhost:8000/api/health` for API liveness and configuration presence. `supabaseConfigured: true` means keys are present; it does **not** prove the migration, keys, or upstream services work. Interactive API docs are at `http://localhost:8000/api/docs` in development.

### 5. Test the app

1. Register with your name, Indian mobile number, email, and a password of 12–128 characters.
2. Follow the Supabase confirmation email, then sign in with email/password.
3. Scan a text message and a URL. Try a screenshot after configuring Gemini.
4. Check Dashboard and Scan History, view a report, and delete a record.
5. Change profile/privacy settings and try scanning with history/AI disabled.
6. Promote a test account through the trusted SQL procedure in the Supabase guide to test Admin.

All text, URL, and screenshot scans require sign-in with a confirmed account and an active Supabase session. Opening `/scan` or `/results` while signed out redirects to the login page. After successful login, the user returns to the requested scanner. If Gemini is unavailable, text/URL scans use clearly marked rules. Scans are saved only when history is enabled; the Results page reports storage failures.

### Automated verification

```powershell
backend\.venv\Scripts\python.exe -m pytest -c backend/pytest.ini backend/tests
backend\.venv\Scripts\ruff.exe check --config backend/pyproject.toml backend/api backend/tests api
npm test
npm run test:db
npm run build
```

Pytest mocks Supabase and Gemini. Frontend tests mock HTTP. The database test runs the actual SQL migration in local PostgreSQL through PGlite with a minimal mock of Supabase's Auth schema. It checks real RLS/privileges; it does not test hosted email delivery or cloud configuration. No real keys are needed, and tests must never call real AI services.

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| API unreachable | Start FastAPI on port 8000 and Vite on port 5173. Use the same browser origin throughout. |
| Supabase not configured / 503 | Fill `backend/.env`, restart the server, and run the SQL migration. Check that the free project is active. |
| Signup email fails | Supabase's default email service is limited. See the Supabase guide; do not assume production email delivery. |
| Origin rejected / 403 | `APP_ORIGIN` must exactly match scheme, hostname, and frontend port. Do not use wildcard CORS. |
| Screenshot 413 | Use PNG/JPEG/WebP at most 3 MB and 16 megapixels. |
| Screenshot 503 | Gemini could not read/analyze it. Check key/model/quota or paste the text for rules. |
| Phone login rejected | Phone ownership verification is pending; use email/password. |
| Python async tests hang in a managed Windows sandbox | The sandbox may block Python's local event-loop socket pair. Run the mocked test command in a normal local terminal. |

For production setup, continue with [Vercel deployment](#vercel-deployment). The endpoint reference is [API reference](#api-reference).

## Supabase setup

The connected **ScamShield-AI** project was set up on November 2, 2026. Migration `20261102063353_initial_scamshield_backend` is already applied there; do not run it again on that project. The instructions below are for reviewing the setup or configuring a new project.

### Create the project and find its keys

1. Create a free project at [Supabase](https://supabase.com/dashboard).
2. Keep the database password in your password manager. The API never uses that password.
3. In project settings, find the project URL and a **publishable** key (`sb_publishable_...`) or the legacy **anon** key.
4. Put them in `backend/.env` as `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.

Do not use a `service_role`/secret key here. Every database request is made with the signed-in user's Supabase access token. Row Level Security remains active.

### Apply the SQL migration

Open the project's **SQL Editor**, start a new query, paste the entire file below, and run it once:

`supabase/migrations/20261102063353_initial_scamshield_backend.sql`

The migration runs in a transaction and creates:

- `profiles`: names, email, unverified phone contact, trusted role, timestamps.
- `scan_history`: redacted references, actual assessments, detection method, timestamps.
- `scam_reports`: voluntarily submitted descriptions and review status.
- `user_settings`: privacy and notification preferences.
- Auth-to-profile synchronization triggers, indexes, RLS policies, session revocation checks, and the admin metrics function.

Existing email accounts are backfilled with profiles/settings. The migration is intended to run once; it is not a destructive reset script. If these table names already exist in your Supabase project, inspect them before applying it. Do not drop an existing database to resolve a name conflict.

Receiving a confirmation email proves that Supabase Auth is configured; it does not create these application tables. If sign-in reports incomplete database setup, apply this migration in the same project named by `SUPABASE_URL`. Existing confirmed accounts are backfilled, so you do not need to register again. After the query succeeds, allow a few seconds for the API schema cache to refresh, then retry sign-in.

For a CLI-managed project, link the intended project and run `supabase db push`; the SQL files are standard Supabase migrations. The SQL Editor is sufficient for a beginner.

### Configure email authentication

1. Enable email/password sign-in in **Authentication → Providers**.
2. Keep email confirmation enabled. Set the minimum password length to **12** in Auth security settings so direct Supabase signups obey the same policy.
3. Under **Authentication → URL Configuration**, set the development Site URL to `http://localhost:5173/login`.
4. Add these exact allowed redirect URLs:

```text
http://localhost:5173/login
http://localhost:5173/reset-password
```

For production, set Site URL to `https://YOUR_DOMAIN/login` and add `https://YOUR_DOMAIN/login` and `https://YOUR_DOMAIN/reset-password`. Also set backend `APP_ORIGIN=https://YOUR_DOMAIN` without `/login`.

Keep the default confirmation/recovery email templates using `{{ .ConfirmationURL }}`. Supabase verifies the email or recovery token and redirects with a session fragment. The login page discards confirmation-session tokens and requires password sign-in; the reset page uses its link token in memory to set a new password. Do not replace the templates with custom PKCE/token-hash URLs unless you also implement that callback flow.

Email changes go through Supabase Auth and remain pending until its confirmation requirements are satisfied. The profile's confirmed email updates through the Auth synchronization trigger.

#### Free email limitations

Supabase's built-in email service is for testing, has restrictive delivery/rate limits, and can restrict recipients to authorized team addresses. Check the [official email documentation](https://supabase.com/docs/guides/auth/auth-smtp) for your project. For a free college demo, use an authorized test recipient or local Supabase/Mailpit. Wider production delivery needs an SMTP provider you choose; none is installed or purchased by this project. Do not turn off ownership checks just to demonstrate successful signup.

### Phone policy

The API accepts Indian mobile numbers starting with 6–9, normalizes them to `+91`, and stores them as **unverified contact data**. It does not send SMS or enable phone/password login. Every phone login gets the same generic rejection; there is no phone-to-email lookup.

Unverified numbers are not globally unique because a user can type someone else's number. A partial unique index protects verified numbers, and a trigger prevents another account from newly claiming a number that has already been verified. Changing a phone clears its verification status.

No approved phone verification mechanism is implemented. Do not mark numbers verified based only on a signup form or email confirmation. Phone-based sign-in/recovery remains pending until an ownership-verification process is approved and implemented.

### Create an administrator

First register and confirm a real test account. Run this as a trusted project owner in the SQL Editor, replacing the placeholder with its exact email:

```sql
update public.profiles
set role = 'admin'
where lower(email) = lower('YOUR_ADMIN_EMAIL');
```

Check the affected row before continuing. To remove the role, set it back to `'user'`. Sign in again or reload the app afterward.

The application has no self-promotion API. Client-provided roles and `user_metadata.role` are ignored. Authenticated database users have no profile update grant; metadata synchronization can only set permitted name/contact fields. Administrator endpoints read the role from the database and their RLS/functions verify it again.

### Data and privacy

- Every scan requires an active authenticated session. Signed-out, invalid, and revoked sessions receive HTTP 401 before analysis or persistence.
- History starts enabled; storing a message excerpt starts disabled. Default `content_reference` is a short hash reference, not the submitted text.
- If enabled, stored text/URL excerpts are best-effort redacted and limited to 2,000 characters. Assessment explanations may contain contextual content; remove personal data before scanning.
- Screenshots and their extracted text are never stored as files or raw transcripts by this app.
- `confidence` is NULL: scores are heuristic, not calibrated probabilities.
- Users can read/delete their own history. Admins can inspect assessment records and reports, but cannot use the history deletion endpoint to delete another user's scans.
- Deleting history also removes its retained excerpt/assessment. A voluntarily submitted report remains for review with a null scan reference. Deleting a Supabase Auth user cascades through that user's profile, settings, scans, and reports.

### Check the setup

Start the application, create/confirm an account, and scan while signed in. Confirm one profile/settings row exists for the new account and the new scan appears in history. Create a second account and verify it cannot see the first account's records.

For local migration/RLS verification, run `npm run test:db`. This is separate from testing the hosted Supabase project.

Common failures: wrong project URL/key, a paused project, unapplied migration, Auth email restrictions, or redirect URLs that differ from the actual browser origin. A profile synchronization error rolls back signup; fix the migration/configuration before retrying.

## Gemini setup

### Get a free-tier API key

1. Open [Google AI Studio](https://aistudio.google.com/apikey) with your Google account.
2. Create/select a project and generate an API key.
3. Use an account/project with free API quota. Do not enable Cloud Billing or add a card for this demo.
4. Add the key to your ignored `backend/.env` as `GEMINI_API_KEY`. Restart FastAPI.

```dotenv
GEMINI_API_KEY=YOUR_KEY
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_TIMEOUT_SECONDS=18
```

The model is configurable because availability changes. Check your project's available models and the [official model list](https://ai.google.dev/gemini-api/docs/models). The configured default is listed with free input/output quota in [Google's pricing documentation](https://ai.google.dev/gemini-api/docs/pricing). Account/region limits still apply; a key does not guarantee available quota. No paid fallback model, search tool, or background job is invoked automatically.

### How the integration works

The backend uses Google's official `google-genai` Python SDK. Its key is never sent to the frontend. See `backend/api/_app/services/gemini_service.py`.

For text and URLs:

1. The rule engine checks contextual scam indicators.
2. Best-effort redaction removes common credential/number/email patterns and URL query strings before AI submission.
3. Gemini receives a JSON Schema through `response_json_schema` and returns a structured assessment, validated again against the Pydantic model. The JSON Schema path preserves strict properties without serializing unsupported legacy `Schema` fields.
4. The backend recomputes the final category. Gemini cannot lower the rule score. The final score is the larger of the rule score and a 60% rules / 40% AI blend. AI scores without indicators do not influence it.
5. If AI is unavailable, a valid rules assessment is returned with `aiUsed: false`, a fallback reason, and the appropriate detection method.

For screenshots, the backend validates and decodes PNG/JPEG/WebP data before sending it through Gemini's multimodal API. A readable extracted message and successful structured response are required. It does not create a fake OCR/rule result when Gemini fails. Images are not saved or made public by the app.

Submitted text, visible URLs, and instructions inside screenshots are treated as evidence. No tools are given to the model, and submitted URLs are never fetched.

### Privacy

Google's [unpaid-service terms](https://ai.google.dev/gemini-api/terms) describe how free-tier inputs/outputs may be used to improve its services and reviewed by people. Do not submit sensitive or personal information. Redaction cannot recognize every possible secret; crop or redact screenshots yourself and use synthetic/redacted examples for demonstrations.

Signed-in users can disable AI in Account Settings and use rules for text/URLs. Screenshot analysis then returns a clear error asking for AI to be enabled or text to be pasted. The scanner displays the content-sharing notice before authenticated submissions. The application does not control Google's retention policies.

### Failure behavior

| Failure | Text/URL response | Screenshot response |
| --- | --- | --- |
| Missing API key | Rules, `ai_not_configured` | 503; no assessment |
| Timeout | Rules, `ai_timeout` | 503; no assessment |
| Rate limit/quota | Rules, `ai_rate_limited` | 503; no assessment |
| Unavailable model | Rules, `ai_model_unavailable` | 503; no assessment |
| Invalid structured output | Rules, `invalid_ai_response` | 503; no assessment |
| Rejected request/schema (HTTP 400) | Rules, `ai_request_rejected` | 503; no assessment |
| Key/project access denied (HTTP 401/403) | Rules, `ai_access_denied` | 503; no assessment |
| Unreadable screenshot | Not applicable | 422; ask for a clearer image |
| User disabled AI | Rules, `ai_disabled_by_user` | 400; ask to enable AI/paste text |

Other provider/network errors return a labeled rules fallback or an honest screenshot error. Requests have a bounded timeout and one attempt; there is no unbounded retry loop consuming quota.

### Verify

First scan text with the key unset: expect `RULE_BASED_FALLBACK` and `aiUsed: false`. With a working key/model, a successful scan reports `HYBRID_GEMINI_RULES` and `aiUsed: true`. If it falls back, inspect the returned reason and AI Studio quota dashboard; do not infer AI success merely from the presence of a key.

Run `backend\.venv\Scripts\python.exe -m pytest -c backend/pytest.ini backend/tests/test_scan.py` for mocked success/failure and image-validation tests. The tests also exercise the real SDK's HTTP serialization for text and image requests, so unsupported schema fields cannot silently reintroduce rules-only fallback.

In this workspace, a live synthetic-text request was verified on November 2, 2026: `aiUsed: true`, `HYBRID_GEMINI_RULES`, and no fallback reason. A rejected legacy schema field had previously caused HTTP 400; switching to the JSON Schema request format fixed it without changing the key or weakening validation. Restart FastAPI after pulling this change and submit a new scan. Previously saved reports retain the method used when they were created.

## API reference

Base path: `/api/v1`. JSON uses camelCase to match the existing React types. Development OpenAPI UI: `/api/docs`. All timestamps are ISO 8601 UTC and record IDs are UUIDs.

### Authentication and errors

Browser login sets HTTP-only access/refresh cookies. Use same-origin `fetch` with `credentials: 'include'`; JavaScript does not receive or store access tokens. Cookie-authenticated writes require an `Origin` exactly matching the configured frontend origin. API clients may alternatively send a valid Supabase `Authorization: Bearer <access-token>`; passwords and roles are never trusted from client state.

After a 401, the frontend calls `/auth/refresh` once and retries. The refresh cookie is scoped to `/api/v1/auth`; the access cookie to `/api`. Both are Secure in production. Logout clears cookies and revokes the current Supabase session. RLS also checks the session's existence so signed-out tokens cannot keep accessing records.

Errors have the form `{"detail":"Readable error message"}`. Validation responses omit submitted input to avoid echoing passwords. Status codes: 400 rejected operation, 401 authentication required/expired, 403 denied role/origin, 404 missing/not-owned record, 409 duplicate registration, 413 oversized upload, 415 unsupported/corrupt image, 422 invalid input/unreadable screenshot, 429 rate limit, 503 external service/database unavailable.

### Authentication endpoints

| Method and path | Request / response |
| --- | --- |
| `POST /auth/signup` | `{fullName, email, phoneNumber, password, rePassword}` → 201 `{success, requiresConfirmation, message}`. No automatic login. |
| `POST /auth/login` | `{identifier, password}` → `{success:true, user}` and session cookies. `identifier` must be email; phone login is pending verification. |
| `GET /auth/me` | Authenticated → `{user}`. |
| `POST /auth/refresh` | Refresh cookie → rotated session cookies and `{success:true}`. |
| `POST /auth/logout` | 204. On an upstream failure: 503 with local cookies cleared and a truthful remote-signout warning. |
| `POST /auth/password` | Authenticated → `{currentPassword, newPassword, confirmPassword}`. Reauthenticates before update. |
| `POST /auth/forgot-password` | `{email}` → generic `{success,message}` without revealing account existence. |
| `POST /auth/reset-password` | `{accessToken,newPassword,confirmPassword}` from the Supabase recovery link → `{success,message}`. Never persist the link token. |

Full names are 2–100 characters, email is validated, passwords are 12–128 characters with matching confirmation. Indian mobile numbers normalize to `+91[6–9]` plus nine digits. Duplicate confirmed emails are rejected, including Supabase's obfuscated duplicate response. Supabase stores password hashes; this app has no password database.

`User`: `{id,fullName,email,phoneNumber,role,createdAt}`. Role comes from `profiles`, not user-editable metadata.

### Scanning

| Method and path | Input |
| --- | --- |
| `POST /scan/text` | JSON `{text}`; 10–8,000 nonblank characters. |
| `POST /scan/url` | JSON `{url}`; up to 2,048 characters. Missing scheme defaults to HTTPS. HTTP(S) only. |
| `POST /scan/file` | `multipart/form-data`, field `file`: PNG/JPEG/WebP, at most 3 MB, 16 megapixels, one frame. Actual image bytes are validated. |

All three scan endpoints require authentication using the existing verified Supabase session. They load the signed-in user's privacy preferences and optionally persist the result. Missing, invalid, expired, and revoked sessions receive HTTP 401 before rules, AI calls, or screenshot decoding. Disabling history does not remove the sign-in requirement.

Every successful scan returns:

```typescript
interface ScanResult {
  id: string;
  scanType: 'text' | 'url' | 'screenshot';
  target: string; // best-effort redacted target; history uses its retained reference
  riskScore: number; // heuristic 0–100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: null; // no calibrated probability is estimated
  summary: string;
  warningSigns: string[];
  suspiciousPhrases: string[];
  explanation: string;
  recommendations: string[];
  detectionMethod: 'RULE_BASED' | 'RULE_BASED_FALLBACK' | 'HYBRID_GEMINI_RULES';
  limitations: string;
  aiUsed: boolean;
  fallbackReason: string | null;
  saved: boolean;
  persistenceError: string | null;
  createdAt: string;
}
```

Thresholds are identical across every scan: LOW 0–29, MEDIUM 30–59, HIGH 60–84, CRITICAL 85–100. They are not probabilities. A zero score or LOW category does not establish safety. URL scanning performs no network requests, DNS queries, redirects, or live reputation checks.

If text/URL AI fails, `aiUsed` is false and the fallback reason/method is explicit. If screenshot analysis fails, return an error without an assessment. If history persistence fails after analysis, return the real assessment with `saved:false` and `persistenceError`; do not show a fake saved record.

### History and reports (authenticated)

| Method and path | Behavior |
| --- | --- |
| `GET /scans/history?limit=50&offset=0` | Array of full `ScanResult` records, newest first; `limit` 1–100. This extends the old minimal history contract with all fields needed by the existing results view. |
| `GET /scans/{id}` | One owned record or 404. |
| `DELETE /scans/{id}` | Delete one owned record; 204 or 404. |
| `DELETE /scans` | Delete all caller-owned scan history; 204. |
| `POST /scans/{id}/report` | `{description}` (10–2,000 characters), owned saved scan required → 201 `{success,message}`. |

Enable history **before** scanning to retain an authenticated result. Results generated with history disabled are not saved after the fact. Screenshots are never retained. Default saved targets are hash references; users can opt into redacted excerpts.

### Settings (authenticated)

`GET /settings` returns `{user,notificationPreferences,privacyPreferences,message}`.

`PATCH /settings` accepts any of:

```json
{
  "profile": { "fullName": "Example User", "email": "user@example.com", "phoneNumber": "+919876543210" },
  "notificationPreferences": { "securityNotices": true },
  "privacyPreferences": { "saveHistory": true, "storeContent": false, "useAi": true }
}
```

Omitted preference keys retain existing values. Profile/email updates are handled through Supabase Auth, with email confirmation when needed. The frontend sends profile and preference changes separately; a combined request is not a transaction across Auth and PostgreSQL. Notification preferences are stored, but no optional notification delivery service is configured.

### Administration

All `/admin` endpoints require a current database-backed admin role:

| Method and path | Response |
| --- | --- |
| `GET /admin/metrics` | `{totalScans,flaggedThreats,activeUsers,reportedScamsCount}` from database counts. `totalScans` counts retained scans; `activeUsers` means registered profiles, not online users; reports count pending review. |
| `GET /admin/users?limit=100&offset=0` | Array of `User`, bounded pagination. |
| `GET /admin/reports?limit=100&offset=0` | Array `{id,content,type,submittedAt,status,notes}`. |
| `PATCH /admin/reports/{id}` | `{status,notes?}`. Status: `PENDING_REVIEW`, `CONFIRMED_SCAM`, or `BENIGN`. |

### Health

`GET /api/health` (outside `/api/v1`) → `{status,service,supabaseConfigured,geminiConfigured,phoneLoginEnabled}`. Flags indicate configuration presence; no external probe is performed. `phoneLoginEnabled` is false.

Request bodies and rate windows are bounded. Default scan rate is 10 requests/minute per client/process; auth POST rate is 15/minute. These are per-process guards, not a distributed serverless rate limiter. Errors never include service credentials or provider debug bodies.

## Vercel deployment

### Prepare

Complete [Supabase setup](#supabase-setup) and [Gemini setup](#gemini-setup). Check locally:

```powershell
npm install
npm test
npm run test:db
npm run build
backend\.venv\Scripts\python.exe -m pytest -c backend/pytest.ini backend/tests
```

Use Vercel's free Hobby plan for a permitted personal/college demo. This project does not enable paid services, billing, object storage, background workers, or an SMS provider. Check your account's quotas before public use.

### Project settings

1. Import the existing repository into [Vercel](https://vercel.com/new).
2. Use this repository's root as the Root Directory.
3. Select the **Vite** framework preset. Do not select FastAPI as the whole-project framework; the existing frontend still builds through Vite.
4. Use Node.js 24. Install command is `npm ci`, build command is `npm run build`, and output is `frontend/dist`.
5. Keep the checked-in `vercel.json` and `.python-version` (Python 3.12).

Application code lives in the three folders: `frontend/`, `backend/`, and `supabase/`. The root npm manifest coordinates the frontend and database-test workspaces. The small root `api/index.py` adapter imports `backend/api/index.py` to follow Vercel's [root API directory convention](https://vercel.com/docs/project-configuration/vercel-json). All backend logic remains under `backend/api/_app/`. Root `requirements.txt` mirrors the pins in `backend/requirements.txt` for the Python function build.

Routing in `vercel.json` sends `/api/*` to that function and lets React Router serve other application paths. API 404s stay API responses. Security headers restrict browser scripts/connections to the same origin. Keep frontend and API on the same Vercel domain; no separate backend hostname is needed.

### Environment variables

Add these under Project Settings → Environment Variables for the intended deployment environment:

| Name | Production value |
| --- | --- |
| `VITE_API_BASE_URL` | `/api/v1` |
| `APP_ENV` | `production` |
| `APP_ORIGIN` | `https://YOUR_DOMAIN` (no path/trailing slash) |
| `CORS_ORIGINS` | `https://YOUR_DOMAIN` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Your publishable or legacy anon key |
| `GEMINI_API_KEY` | Your server-side AI Studio key |
| `GEMINI_MODEL` | A supported model with free quota; default `gemini-3.5-flash-lite` |
| `GEMINI_TIMEOUT_SECONDS` | `18` |
| `MAX_UPLOAD_BYTES` | `3145728` |
| `SCAN_RATE_LIMIT` | `10` |
| `AUTH_RATE_LIMIT` | `15` |

Only the API base variable needs the `VITE_` prefix. Do not add a service-role key or place secrets in `vercel.json`. Redeploy after changing environment variables.

Set `APP_ORIGIN` to the exact domain you actually open, and configure Supabase's Site URL/allowed redirects for that domain's `/login` and `/reset-password`. Production cookies are HTTP-only, Secure, and SameSite=Lax.

For preview deployments, use a stable preview domain and matching environment/redirect settings. Do not blindly trust arbitrary `Origin`, `Host`, or forwarded headers to allow every preview domain.

### Serverless limits

The function has a 60-second maximum; Gemini's timeout is shorter. Uploads are capped at 3 MB to leave room for multipart overhead under Vercel's [4.5 MB function payload limit](https://vercel.com/docs/functions/limitations). Screenshots above 16 megapixels are rejected. Runtime dependencies are pinned in `backend/requirements.txt` and mirrored in the root `requirements.txt`; keep both lists synchronized. Frontend source, dev tools, node_modules, local Python environments, tests, credentials, and ZIPs are excluded from the function bundle.

Rate limiting in this app is bounded and per warm process. It is a practical demo guard, not a shared quota across a serverless deployment. Supabase/Gemini enforce their own limits. Review Vercel's available firewall controls before opening the demo to a wide audience; no paid protection has been configured.

### Verify after deployment

Replace the example domain and run:

```powershell
Invoke-RestMethod https://YOUR_DOMAIN/api/health
```

Expect JSON with `status: "ok"`. The configuration flags indicate presence only. Then:

1. Open `/dashboard` while signed out: it should send you to login.
2. Register, confirm email, log in, scan, reload history, and delete one record.
3. Confirm that missing/failed Gemini produces a labeled text fallback and an honest screenshot error.
4. Check `/api/does-not-exist`: it should return JSON 404 rather than the frontend HTML.
5. Refresh `/history` directly: React Router should still load.
6. Sign out and confirm private history is unavailable.

**Production is deployed and verified:** [ScamShield AI](https://scamshield-ai-murex.vercel.app). The connected GitHub repository is `13yash11/ScamShield-AI`, with `master` as the production branch. Pushes to that branch trigger Vercel builds. Supabase remains the existing hosted database/Auth service.

### Common deployment problems

| Symptom | Check |
| --- | --- |
| `/api/health` returns HTML | Confirm the API rewrite precedes the SPA rewrite and that Vite, not a static-only upload, deployed the Python function. |
| Function import failure | Deploy from repository root; keep the root `api/index.py` adapter, `backend/api/`, root `requirements.txt`, and `backend/requirements.txt`. Check build logs for dependency installation. |
| Auth origin rejected | Exact `APP_ORIGIN`, `CORS_ORIGINS`, Supabase redirects, and browser domain must agree. |
| Sign-in works then expires | Check refresh cookies, HTTPS, and the `session_is_active` migration function. Use the same origin. |
| Function timeout | Inspect provider availability/quota; reduce input size. Do not add unbounded retries. |
| Screenshot upload fails before API JSON | Check file size; Vercel can reject oversized bodies before the function runs. |

## Integration details

The FastAPI backend is now implemented. Related sections in this document:

- [Local setup](#local-setup): install and run locally.
- [Supabase setup](#supabase-setup): database migration, email Auth, RLS, and administrator setup.
- [Gemini setup](#gemini-setup): official SDK, free-tier configuration, privacy, and fallback behavior.
- [Vercel deployment](#vercel-deployment): one Vercel project for Vite and Python.
- [API reference](#api-reference): complete request/response contracts.

The React application and its configuration now live in `frontend/`. Python source, tests, dependencies, and server credentials live in `backend/`. Database migrations, local database tests, and the database guide live in `supabase/`. See [Project structure](#project-structure) for the complete file map.

Services use same-origin `/api/v1` requests; Vite proxies `/api` to FastAPI locally. Production routes go through a small root `api/index.py` deployment adapter that imports the backend. Root npm commands delegate to the frontend or database-test workspace. Browser settings are in `frontend/.env`; server credentials are in `backend/.env`.

Authentication uses Supabase Auth and server-issued HTTP-only cookies. The old localStorage bearer-token flow is removed. Signup includes `rePassword` and reports email-confirmation requirements. Email/password works after service setup; phone/password login remains pending approved ownership verification.

Text/URL/file scan endpoint names and camelCase result fields are preserved. Risk levels include `CRITICAL`. Results also identify whether AI ran, whether fallback was used, and whether history was actually saved.

Dashboard, history, settings, administrator users/metrics/reports, password recovery, and report submission call the real APIs. No fake records or statistics are supplied when services are unavailable. All scanning requires sign-in and follows the user's privacy preferences.

The connected ScamShield-AI Supabase project now has migration `20261102063353_initial_scamshield_backend` applied. Its existing confirmed account was backfilled with profile/settings records, and live database session/access checks passed. Do not apply the initial migration again to that project. Live Gemini structured text analysis is also verified after correcting its JSON Schema request format. A Vercel deployment still needs verification; see the setup guides.

## Implementation plan and decisions

The existing React/Vite components, styling, navigation, and request/response names remain the foundation. The untracked frontend ZIP is left untouched.

1. Add FastAPI configuration, health, validation, request limits, and serverless entrypoint.
2. Add Supabase SQL migrations, RLS, protected roles, real Auth sessions, profile/settings APIs.
3. Add explainable rules, passive URL inspection, Gemini structured analysis, validated image uploads, and honest fallbacks.
4. Connect existing dashboard, history, settings, and admin components. Require authentication before every scan. Remove browser-only history and token storage.
5. Add mocked backend/integration tests and Vercel routing. Check authorization, database failures, and image/AI failures.
6. Run Python tests, frontend tests/build, local health checks, and document account/database/deployment setup.

### Integration decisions

- Keep camelCase JSON contracts. Add CRITICAL as the fourth risk level.
- Supabase Auth owns passwords; no custom password table or service-role key is needed by the application. All database calls use the caller's JWT and RLS.
- HTTP-only, SameSite cookies hold access/refresh tokens. Require trusted origins for cookie-authenticated writes. The React client refreshes once after a 401. Support modules live in `backend/api/_app/` so Vercel discovers only one function.
- Email confirmation is supported. Phone numbers are unverified contact data; phone login is pending an approved ownership-verification mechanism.
- All scans require an active authenticated session. Privacy settings control whether redacted references/assessment fields are saved; screenshots are never retained.
- URLs are parsed, never fetched. No live reputation, redirect, or statistical-probability claims.
- The user connected Supabase after initial implementation. The application migration is now applied to the existing ScamShield-AI project, with profile/settings backfill and live session/access checks verified. A live Gemini structured text response has also been verified after correcting its request schema. Vercel deployment remains unverified; automated tests mock external APIs.

The implemented phases and actual checks are recorded in [Verification and remaining work](#verification-and-remaining-work). Start with [Local setup](#local-setup) for the remaining account configuration.

## Verification and remaining work

The initial application checks below were recorded on November 2, 2026. The live deployment checks are recorded separately under November 3, 2026.

Verified in this workspace with Python 3.12.14 and Node.js 24.15.0.

| Check | Result |
| --- | --- |
| `npm install` | Completed; package lock updated |
| `python -m pytest -c backend/pytest.ini backend/tests -q` in `backend/.venv` | 69 tests passed |
| `ruff check --config backend/pyproject.toml backend/api backend/tests api` | Passed |
| `npm test -- --reporter=dot` | 18 tests passed across 5 files |
| `npm run test:db` | Actual migration executed; 26 PostgreSQL authorization checks passed |
| `npm run build` | TypeScript and production Vite build passed |
| `npm audit` after dependency updates | Zero vulnerabilities reported |
| Installed Python dependency compatibility | All 45 installed packages compatible (`uv pip check`) |
| OSV audit of installed Python package versions | 45 packages checked; no known advisories after the Pillow update |
| Local HTTP through Vite → FastAPI | Health 200, actual text/URL rule assessments, private history 401, SPA history route 200 |
| Connected Supabase migration | `20261102063353_initial_scamshield_backend` applied successfully |
| Live database session/access checks | Session RPC, existing account profile/settings, normal-user role, RLS, and grants verified |
| Live Gemini structured text analysis | Actual configured key/model returned `aiUsed:true`, `HYBRID_GEMINI_RULES`, and no fallback reason |

The Python test run reports one upstream Starlette warning about future TestClient transport changes. It does not indicate a failing test or disabled security check.

### What was exercised

- Valid/invalid signup, obfuscated duplicate-email responses, login rejection, secure session cookies, refresh, logout/revocation, recovery, and password checks.
- Server-derived roles, protected APIs, record ownership, scan deletion, reports, real count contracts, and database failure handling.
- OTP/credential, fee/job/lottery and URL rules; safety-advice false-positive checks; consistent risk thresholds.
- Image decoding, format/size validation, actual multimodal-success handling, no fabricated screenshot fallback, Gemini quota/timeout/model/invalid-response failures.
- Stored-content minimization, privacy preferences, no fake saved-success on database failures, and partial preference update preservation.
- Origin restrictions, production cookie flags, rate limits, and no DNS/network calls from passive URL analysis.
- Frontend sign-in failure, route protection, API-loaded dashboard/history, deletion failure preservation, settings contracts, admin access/data, fallback display, and one refresh for concurrent expired requests.
- SQL trigger synchronization, metadata-role rejection, profile update privilege denial, per-user RLS, administrator access, verified-phone collision handling, and logged-out-session denial.

### Phase completion record

1. Foundation: API entrypoint/configuration, health and origin checks added; initial smoke tests passed.
2. Database/Auth: executable migration, protected sessions, profile/settings APIs added; authentication tests passed and the migration subsequently executed in PostgreSQL tests.
3. Detection: rules, passive URL analyzer, official Gemini SDK, image validation, honest fallbacks added; scanning/rule tests passed.
4. Frontend: existing components connected to real services; protected routes and account recovery added; frontend tests/build passed.
5. Security/deployment: authorization, request limits, RLS tests, serverless package layout, Vercel configuration, and patched dependencies added; local security checks passed.
6. Verification/docs: local API/proxy checks and setup guides completed. Cloud deployment verification remains dependent on the external setup below.

### Live Supabase follow-up — November 2, 2026

After the user connected Supabase, the existing ScamShield-AI project was confirmed active with no application tables/migration history. The initial migration was applied through the connected Supabase integration. Its local filename now matches the migration version recorded by Supabase.

Verified against that live project:

- All four application tables exist with RLS enabled and explicit role grants.
- The existing confirmed Auth account has its profile and settings; its registration name/contact metadata was preserved.
- Session validation plus profile/settings reads passed under the authenticated database role using an existing session context. Verification used a transaction that rolled back and did not read passwords or expose access/refresh tokens.
- The account remains a normal user. Authenticated clients cannot update profile roles, and anonymous clients cannot read the application tables or execute the session RPC.
- The REST API now recognizes all required tables and the session function. Anonymous checks return permission denial instead of missing-object errors.
- Privileged session lookup stays in the private schema behind a public invoker wrapper. Existing public execution grants on Supabase's internal RLS event-trigger helper were removed without disabling automatic RLS.

The security advisor's remaining notice is [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), which is available on Pro and above. It was left unchanged to respect the free-tier requirement. The initial performance check also reported informational unused-index notices for newly created indexes.

Hosted password sign-in was not replayed using the user's password. A full user-driven scan/history round trip and deployed Vercel API health still need verification. Automated tests continue to mock external HTTP/AI services and PGlite uses a local stand-in for the Auth schema.

### Gemini structured-output fix — November 2, 2026

The configured Gemini key/model were accessible, but the original `response_schema` conversion sent an unsupported `additional_properties` field. Google rejected that generation request with HTTP 400, resulting in a rules fallback. The service now sends the Pydantic model's JSON Schema through `response_json_schema`, retains all server-side validation, and identifies rejected requests/access failures separately from outages.

Regression tests reproduce the rejected legacy payload and verify the corrected real SDK serialization for both text and image inputs over mocked HTTP. A separate live request with synthetic scam text succeeded, and the application's result builder produced `HYBRID_GEMINI_RULES` with `aiUsed: true` and a null fallback reason. No user content or credentials were printed, and no saved scan records were rewritten. Restart the backend and create a fresh scan to see the corrected method.

Phone ownership verification/login and optional notification delivery are explicitly pending. Notification preferences are stored without pretending to send notices. Per-process rate limiting is a demo guard rather than a distributed deployment-wide quota.

### Whole-project review — November 2, 2026

Reviewed application source, frontend/API contracts, configuration, migration SQL, setup guides, helper scripts, and the original frontend archive. Generated dependencies, build output, and caches were checked through the build/dependency tools rather than manually reviewing their third-party source. The ZIP's 67 entries passed its checksum check; the archive was not modified.

The Python dependency audit found published advisories affecting the pinned Pillow 12.3.0. Updated the dependency to Pillow 13.0.0, whose [official release notes](https://pillow.readthedocs.io/en/stable/releasenotes/13.0.0.html) list the security fixes. Screenshot decoding now selects only PNG, JPEG, and WebP decoders before parsing an upload. Regression checks cover all three supported formats and prove that a disguised unsupported image cannot invoke its decoder.

After that change, all 69 backend tests and Python lint checks passed. All 45 installed Python packages passed compatibility checking and an OSV version audit. The frontend's 18 tests, TypeScript/production build, npm audit, and 26 PostgreSQL migration/authorization checks also passed during this review. JavaScript helper scripts passed syntax checks and local documentation links resolve.

A live request through the FastAPI application with synthetic guest text returned HTTP 200, `HYBRID_GEMINI_RULES`, `aiUsed:true`, and `saved:false`. Health returned 200, unauthenticated history returned 401, and an unknown API route returned JSON 404. This used the actual Gemini service without writing a scan record. This in-process API check does not verify a Vercel deployment or replay the user's password sign-in.

Remaining findings:

- The existing Privacy Policy, Terms of Service, and Responsible Disclosure links point to `#privacy`, `#terms`, and `#disclosure`, but those sections/pages do not exist. They appear in `frontend/src/components/layout/Footer.tsx` and the signup page. Policy content/routes have not been invented as part of this review.
- Supabase still reports the leaked-password-protection configuration warning described above. All four application tables have RLS enabled and the remote migration version matches the checked-in migration.
- The upstream Starlette TestClient deprecation warning remains; it does not prevent tests or application requests from succeeding.
- Hosted Vercel behavior and a complete user-driven authentication/history flow still require deployment/browser verification. Automated tests use mocked Auth services.

The current frontend/backend/database file map is in [Project structure](#project-structure).

### Physical folder organization — November 2, 2026

Moved the React application, frontend configuration/assets/tests, screenshot helper, and original frontend ZIP into `frontend/`. Moved FastAPI source, Python tests/configuration/dependencies, the local virtual environment, server credentials, and backend guides into `backend/`. The database migration remains in `supabase/migrations/`; its test runner and setup guide now also live under `supabase/`.

Updated Python imports, environment-file resolution, database-test paths, frontend helper paths, npm commands, deployment paths, and guide links. The backend resolves its own `.env` independently of the current working directory. The frontend has a separate `.env` containing only `VITE_API_BASE_URL`. Credentials were preserved without printing their values.

The root npm manifest now coordinates the frontend and database-test workspaces with a shared lockfile and `node_modules/`. The root `api/index.py` is a small Vercel adapter; application logic is in `backend/`. Root `requirements.txt` forwards to backend runtime dependencies. Vercel's build output path is now `frontend/dist`.

Verified after moving the files:

- All 18 frontend tests and the TypeScript/Vite production build passed through the root npm commands.
- All 69 backend tests passed from the backend folder. Repository-root test discovery also collected all 69 tests with the documented configuration.
- Python lint passed for backend code, tests, and the root deployment adapter. All 45 installed Python packages remain compatible.
- All 26 local PostgreSQL migration/authorization checks passed through `npm run test:db`.
- No JavaScript or Python dependency versions changed during the reorganization. The moved Python environment's launchers/activation were regenerated using the existing package versions.
- A temporary real Vite/FastAPI startup verified proxied health (200), private history (401), unknown API JSON (404), direct SPA history routing (200), trusted-origin validation (422), and untrusted-origin rejection (403). The deployment adapter imports the same backend application. Only the temporary verification processes were stopped afterward.
- Both local `.env` files and the Python environment remain ignored. No server credentials were present in frontend configuration, examples, or the compiled frontend. Local documentation links and Git whitespace checks passed.

The existing UI components, detection behavior, and hosted database schema were preserved. Live Vercel deployment remains unverified. Current start commands are in [Overview and quick start](#overview-and-quick-start).

### Live Vercel deployment — November 3, 2026

The frontend and Python API are live together at [ScamShield AI](https://scamshield-ai-murex.vercel.app). Vercel project `scamshield-ai` is connected to `https://github.com/13yash11/ScamShield-AI`, production branch `master`, under the existing Hobby account. No paid services or new database projects were enabled.

The first cloud build exposed a nested requirements include that Vercel could not parse. Root `requirements.txt` now lists the same runtime pins as `backend/requirements.txt`; keep these two manifests synchronized. Node is pinned to `24.x` in the project and workspace manifests to match the tested runtime. Package versions, UI components, and detection algorithms were preserved. The corrected application deployment was built from commit `fc04f1e`.

Production variables are configured in Vercel. Supabase and Gemini key values are stored as Secrets and remain outside Git and browser bundles. The production `APP_ORIGIN` and `CORS_ORIGINS` are both `https://scamshield-ai-murex.vercel.app`. Preview credentials were not provisioned. The upload check included the required frontend/backend sources and excluded local credentials, caches, virtual environments, and tooling.

Live checks completed:

| Check | Result |
| --- | --- |
| Homepage and scanner page | HTTP 200 application HTML |
| `/api/health` | HTTP 200; Supabase and Gemini configured |
| Unknown API route | JSON HTTP 404 |
| Unauthenticated scan history | JSON HTTP 401 |
| Synthetic text scan through the deployed API | HTTP 200; Critical, score 100; `HYBRID_GEMINI_RULES`; `aiUsed:true`; no fallback |
| Guest persistence | `saved:false`; no scan history written |
| Untrusted Origin | HTTP 403 before analysis |
| Existing Supabase Auth public settings | HTTP 200; email sign-in/signup enabled; email confirmation required |

The user confirmed saving the production Supabase URL Configuration:

- Site URL: `https://scamshield-ai-murex.vercel.app/login`
- Allowed redirects: `https://scamshield-ai-murex.vercel.app/login` and `https://scamshield-ai-murex.vercel.app/reset-password`, keeping the existing localhost entries.

The connected Supabase tools do not expose Auth URL configuration, so that dashboard change was confirmed by the user rather than read back through the tools. A real-user password sign-in, saved-history round trip, and email confirmation/reset delivery were not replayed by the deployment checks. The earlier pending phone verification, optional notification delivery, and placeholder policy links remain as recorded above.

### Sign-in required for every scan — November 3, 2026

All text, URL, and screenshot analysis now requires a confirmed account and an active Supabase session. The scanner and results routes redirect signed-out visitors to sign-in. A successful sign-in returns the user to the requested scanner. The three scan APIs return HTTP 401 for missing, invalid, expired, or revoked sessions before analysis, image decoding, or persistence. This replaces the guest-scan behavior recorded in the earlier deployment checks above.

The existing session validation, privacy preferences, Gemini/rules behavior, risk scoring, and database schema remain in use. Saving history can still be disabled for an authenticated scan. No database migration is required.

Verification for this change: 79 backend tests passed, including nine rejection cases across all three scan types and a login-cookie-to-saved-scan test; 21 frontend tests passed, including scanner/results protection and return-to-scanner navigation after login. Python lint and the TypeScript/Vite production build passed. External Auth and AI services are mocked in the automated suite.
