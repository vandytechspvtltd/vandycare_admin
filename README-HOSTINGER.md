# VandyCare Admin Panel - Hostinger

## 1. Configure API
Copy `.env.example` to `.env` and set:
`VITE_API_BASE_URL=https://vandycareapis.vandytrust.com/v1`

## 2. Build
Run:
`npm install`
`npm run build`

The production files are generated in `dist/`.

## 3. Hostinger
Upload the **contents of `dist/`** into the domain/subdomain document root.
Keep `.htaccess` in the document root so React routes work after refresh.

## 4. Backend requirement
The backend must expose the Admin routes used by this frontend. In particular:
`POST /v1/admin/login`

If that endpoint currently returns `Cannot POST /v1/admin/login`, fix/register the backend route before testing the dashboard.

## 5. Current API calls
The frontend calls:
- POST `/admin/login`
- GET `/admin/doctors/pending`
- GET `/admin/doctors`
- GET `/admin/doctors/:id`
- POST `/admin/doctors/:id/approve`
- POST `/admin/doctors/:id/reject`
- POST `/admin/doctors/:id/activate`
- POST `/admin/doctors/:id/deactivate`
- GET `/admin/patients`
- GET `/admin/patients/:id`

If the deployed backend uses different paths, update `src/api.ts` to match the actual routes.
