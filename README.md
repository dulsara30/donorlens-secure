# DonorLens

![DonorLens Logo](donorlens-frontend/src/assets/logo.png)

DonorLens is a donation transparency platform that helps donors track where money goes, helps NGOs publish and manage campaigns, and gives system administrators the tools to review users, NGO registrations, and campaign activity. The project is split into a React frontend and an Express/MongoDB backend, with JWT authentication, file uploads, payment integration, email notifications, and public campaign/execution tracking.

## Overview

DonorLens was built around one core idea: donation workflows should be visible, auditable, and easy to understand.

The application currently includes:

- A public homepage with live campaign previews.
- A public campaigns listing and single campaign detail pages.
- A dedicated transparency page for trust, accountability, and progress visibility.
- Donor registration and login.
- NGO registration and campaign management.
- Execution update tracking with evidence uploads and milestone history.
- System admin dashboards for users, NGO requests, and campaigns.
- Payment flows and payment history.

The most important technical direction in the current codebase is that the admin dashboards and public transparency views are now driven by live backend data instead of static mock state.

## Tech Stack

### Frontend

- React 19
- Vite 8
- React Router
- React Query
- Redux Toolkit
- Tailwind CSS
- Axios
- React Toastify
- Leaflet / React Leaflet

### Backend

- Node.js
- Express 5
- MongoDB with Mongoose
- JWT authentication
- HttpOnly refresh cookies
- Cloudinary for media uploads
- Nodemailer for emails
- Playwright for integration testing

### External Services

- Render for backend deployment
- Vercel for frontend deployment
- MongoDB Atlas or local MongoDB
- Cloudinary for campaign images and supporting documents
- SMTP provider for email delivery
- PayHere payment integration

## Project Structure

```text
donorlens-backend/
  src/
    app.js
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    usecases/
    utils/
  tests/
  scripts/
    cleanupTestData.js
  playwright.config.js
  render.yaml

donorlens-frontend/
  src/
    app/
    assets/
    components/
    features/
    hooks/
    pages/
    state/
    store/
    utils/
  src/__tests__/
  vercel.json
  vite.config.js
  vitest.config.js
```

## Setup Instructions

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB database
- Cloudinary account
- SMTP email account or app password
- PayHere credentials if payment testing is needed

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd DonorLens
```

### 2. Backend setup

Install backend dependencies:

```bash
cd donorlens-backend
npm install
```

Create a `.env` file in `donorlens-backend` with the following values:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string

JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRY=14d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_app_password
EMAIL_FROM="DonorLens" <your_email@example.com>
EMAIL_LOGO_URL=https://your-cdn-or-public-host/logo.png
SUPPORT_EMAIL=support@donorlens.org
```

Start the backend:

```bash
npm run dev
```

The backend runs on `http://localhost:5000` by default.

### 3. Frontend setup

Install frontend dependencies:

```bash
cd ../donorlens-frontend
npm install
```

Create a `.env` file in `donorlens-frontend` with the following values:

```env
VITE_API_URL=http://localhost:5000/api
VITE_PAYHERE_MERCHANT_ID=your_payhere_merchant_id
VITE_PAYHERE_MERCHANT_SECRET=your_payhere_merchant_secret

VITE_PAYHERE_CONNECTION_STRING=https://sandbox.payhere.lk/pay/checkout
PAYHERE_APP_ID=4OVyc91fF7Q4JH5EsQaRCV3D7
PAYHERE_APP_SECRET=49aLFWvBL9z4TwS9BKZq1Q4JBxOzvUT5u8RjZL7qOYQk
VITE_PAYHERE_MERCHANT_ID=1234205
VITE_PAYHERE_MERCHANT_SECRET=MzE5NjQwODUyNDI3MTI2NTE5MjIyMDkwMzQ2NTM5MzgwMTMwMDcwMA==
```

Start the frontend:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

### 4. Run both apps together

Use two terminals:

```bash
# Terminal 1
cd donorlens-backend
npm run dev

# Terminal 2
cd donorlens-frontend
npm run dev
```

## API Endpoint Documentation

### Response Format

Most backend endpoints use the shared `ApiResponse` format:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "meta": {}
}
```

When pagination is returned, `meta.pagination` is included.

Error responses follow the same general shape:

```json
{
  "success": false,
  "message": "Error message"
}
```

### Authentication Rules

- Public routes do not require a token.
- Protected routes require `Authorization: Bearer <accessToken>`.
- Refresh/logout flows use the refresh token cookie set by login.
- Role-protected routes use `authenticateToken` plus `authorizeRoles(...)`.

### Authentication Endpoints

| Method | Endpoint                                | Auth                                    | Request                                 | Response                                                |
| ------ | --------------------------------------- | --------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| POST   | `/api/auth/register/user`               | Public                                  | JSON body with user registration fields | Creates a user account                                  |
| POST   | `/api/auth/login`                       | Public                                  | JSON body: `email`, `password`          | Returns access token and user data, sets refresh cookie |
| POST   | `/api/auth/refresh`                     | Refresh cookie                          | No body required                        | Returns a new access token                              |
| POST   | `/api/auth/logout`                      | Refresh cookie or authenticated session | No body required                        | Clears refresh cookie                                   |
| GET    | `/api/auth/me`                          | Bearer token                            | No body required                        | Returns current user profile                            |
| GET    | `/api/auth/verify-password-setup-token` | Public                                  | Query token                             | Verifies password setup token                           |
| GET    | `/api/auth/verify-resubmission-token`   | Public                                  | Query token                             | Verifies resubmission token                             |
| POST   | `/api/auth/verify-identity`             | Public                                  | JSON body with identity data            | Verifies identity before password setup                 |
| POST   | `/api/auth/set-password`                | Public                                  | JSON body with token and password       | Sets account password                                   |

#### Example: Login Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@donorlens.com",
  "password": "Password123!"
}
```

#### Example: Login Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "fullName": "Test User",
      "email": "test@donorlens.com",
      "role": "USER",
      "isActive": true
    }
  }
}
```

### NGO Registration Endpoints

| Method | Endpoint                     | Auth                                    | Request                                         | Response                 |
| ------ | ---------------------------- | --------------------------------------- | ----------------------------------------------- | ------------------------ |
| POST   | `/api/ngo/auth/register-ngo` | Public                                  | Multipart form-data with registration documents | Creates NGO request      |
| PUT    | `/api/ngo/auth/resubmit-ngo` | Public or token-based resubmission flow | Multipart form-data with updated documents      | Updates NGO resubmission |

#### Example: NGO Registration Request

```http
POST /api/ngo/auth/register-ngo
Content-Type: multipart/form-data

registrationCertificate=<file>
additionalDoc1=<file>
additionalDoc2=<file>
additionalDoc3=<file>
```

#### Example: NGO Registration Response

```json
{
  "success": true,
  "message": "NGO request submitted successfully",
  "data": {
    "requestId": "66f1...",
    "status": "PENDING"
  }
}
```

### Campaign Endpoints

The campaign routes are mounted under both `/api/campaigns` and `/api/ngo/campaigns`.

| Method | Endpoint                                       | Auth            | Request                                                  | Response                                 |
| ------ | ---------------------------------------------- | --------------- | -------------------------------------------------------- | ---------------------------------------- |
| POST   | `/api/campaigns/add-campaign`                  | NGO admin token | Multipart form-data with cover image and campaign fields | Creates a campaign                       |
| GET    | `/api/campaigns/get-my-campaigns`              | NGO admin token | No body required                                         | Returns the caller's campaigns           |
| GET    | `/api/campaigns/get-my-campaign/:campaignId`   | NGO admin token | Campaign ID in path                                      | Returns one campaign owned by the caller |
| PUT    | `/api/campaigns/update-campaign/:campaignId`   | NGO admin token | Multipart form-data or JSON update payload               | Updates the campaign                     |
| DELETE | `/api/campaigns/delete-campaign/:campaignId`   | NGO admin token | Campaign ID in path                                      | Deletes the campaign                     |
| GET    | `/api/campaigns/get-all-campaigns`             | Public          | Optional query params: `status`, `limit`                 | Returns public campaign list             |
| GET    | `/api/campaigns/get-all-campaigns/:campaignId` | Public          | Campaign ID in path                                      | Returns a public campaign detail         |

#### Example: Public Campaign List Request

```http
GET /api/campaigns/get-all-campaigns?status=ONGOING&limit=6
```

#### Example: Public Campaign List Response

```json
{
  "success": true,
  "message": "All campaigns retrieved successfully",
  "data": [
    {
      "_id": "66f2...",
      "title": "Clean Water Drive",
      "status": "ONGOING",
      "raisedAmount": 250000,
      "totalUsedAmount": 80000
    }
  ]
}
```

#### Example: Create Campaign Request

```http
POST /api/campaigns/add-campaign
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

title=Clean Water Drive
description=Provide clean drinking water to rural schools
coverImage=<file>
sdgGoalNumber=6
raisedAmount=250000
```

### Campaign Comment Endpoints

| Method | Endpoint                             | Auth         | Request                        | Response                        |
| ------ | ------------------------------------ | ------------ | ------------------------------ | ------------------------------- |
| GET    | `/api/campaign/comments/:campaignId` | Bearer token | Campaign ID in path            | Returns comments for a campaign |
| POST   | `/api/campaign/comment/:campaignId`  | Bearer token | JSON body with comment content | Adds a comment                  |
| PUT    | `/api/campaign/comment/:commentId`   | Bearer token | JSON body with updated content | Updates a comment               |
| DELETE | `/api/campaign/comment/:commentId`   | Bearer token | Comment ID in path             | Deletes a comment               |

### Campaign Execution Endpoints

| Method | Endpoint                                                       | Auth            | Request                                                    | Response                                 |
| ------ | -------------------------------------------------------------- | --------------- | ---------------------------------------------------------- | ---------------------------------------- |
| POST   | `/api/campaign-executions/:campaignId/executions`              | NGO admin token | Multipart form-data with update details and evidence files | Creates an execution update              |
| GET    | `/api/campaign-executions/:campaignId/executions`              | Public          | Campaign ID in path                                        | Returns execution updates for a campaign |
| GET    | `/api/campaign-executions/:campaignId/executions/:executionId` | Public          | Campaign ID and execution ID in path                       | Returns one execution update             |
| PATCH  | `/api/campaign-executions/:campaignId/executions/:executionId` | NGO admin token | Multipart form-data or JSON update payload                 | Updates an execution update              |
| DELETE | `/api/campaign-executions/:campaignId/executions/:executionId` | NGO admin token | Campaign ID and execution ID in path                       | Deletes an execution update              |

#### Example: Execution Update Response

```json
{
  "success": true,
  "message": "Execution update created successfully",
  "data": {
    "executionUpdate": {
      "_id": "66f3...",
      "title": "Water Tank Installed",
      "date": "2026-04-11",
      "fundsUsed": 45000
    }
  }
}
```

### System Admin Endpoints

| Method | Endpoint                                              | Auth        | Request                           | Response                                   |
| ------ | ----------------------------------------------------- | ----------- | --------------------------------- | ------------------------------------------ |
| GET    | `/api/admin/fetch-all-register-requests`              | ADMIN token | No body required                  | Returns NGO registration requests          |
| PUT    | `/api/admin/ngo-request/:ngoId/approve`               | ADMIN token | Optional approval note            | Approves an NGO request                    |
| PUT    | `/api/admin/ngo-request/:ngoId/reject`                | ADMIN token | Rejection note                    | Rejects an NGO request                     |
| PUT    | `/api/admin/ngo-request/:ngoId/deactivate`            | ADMIN token | Deactivation note                 | Deactivates an NGO account                 |
| PUT    | `/api/admin/ngo-request/:ngoId/resubmission-required` | ADMIN token | Resubmission note                 | Marks request for resubmission             |
| PUT    | `/api/admin/pw-Request/:ngoId`                        | ADMIN token | No body required                  | Sends password setup email                 |
| DELETE | `/api/admin/ngo-request/:ngoId/delete`                | ADMIN token | NGO ID in path                    | Permanently deletes an NGO request/account |
| GET    | `/api/admin/users`                                    | ADMIN token | Optional filters via query string | Returns all users                          |
| GET    | `/api/admin/users/:userId`                            | ADMIN token | User ID in path                   | Returns one user by ID                     |

#### Example: System Admin Users Response

```json
{
  "success": true,
  "message": "All users retrieved successfully",
  "data": [
    {
      "_id": "66f4...",
      "fullName": "Campaign User",
      "email": "campaign.user@example.com",
      "role": "NGO_ADMIN",
      "isActive": true
    }
  ]
}
```

### Payment Endpoints

| Method | Endpoint              | Auth         | Request                        | Response                               |
| ------ | --------------------- | ------------ | ------------------------------ | -------------------------------------- |
| GET    | `/api/payment/health` | Public       | No body required               | Health status for payment module       |
| GET    | `/api/payment`        | ADMIN token  | No body required               | Returns all payment records            |
| GET    | `/api/payment/my`     | Bearer token | No body required               | Returns current user's payment history |
| POST   | `/api/payment`        | Bearer token | JSON body with payment payload | Creates a payment record               |
| GET    | `/api/payment/logs`   | Public       | No body required               | Returns payment logs                   |

### Test Data Cleanup

There is no HTTP route for this (removed under NF3 -- see `security-evidence/NF3/`: unauthenticated
delete-by-pattern routes are a real risk if `NODE_ENV` is ever misconfigured in production). To remove the
test users the Playwright suite creates, run `npm run cleanup` (`donorlens-backend/scripts/cleanupTestData.js`)
directly against the database. It connects to `MONGO_URI` itself and refuses to run unless that URI's database
name contains `test`. The Playwright suite also runs it automatically via `globalTeardown` after the whole
suite finishes.

## Deployment Documentation

### Backend Deployment

**Platform:** Render

The backend is configured in `donorlens-backend/render.yaml` with:

- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`
- Auto deploy: enabled
- Production port: `10000`

**Backend deployment steps**

1. Create a new Render Web Service from the `donorlens-backend` folder.
2. Set the build command to `npm install`.
3. Set the start command to `npm start`.
4. Configure all backend environment variables listed below.
5. Point the health check to `/health`.
6. Deploy and verify the service returns a 200 response on `/health`.

### Frontend Deployment

**Platform:** Vercel

The frontend is configured as a single-page React app with SPA rewrites in `donorlens-frontend/vercel.json`.

**Frontend deployment steps**

1. Import the `donorlens-frontend` folder into Vercel.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Configure frontend environment variables.
5. Ensure the rewrite rule sends all routes to `index.html`.
6. Deploy and verify public pages and protected routes open correctly.

### Environment Variables

#### Backend

| Variable                | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `NODE_ENV`              | Controls development/production behavior |
| `PORT`                  | Backend listening port                   |
| `CLIENT_URL`            | Frontend origin allowed by CORS          |
| `MONGO_URI`             | MongoDB connection string                |
| `JWT_ACCESS_SECRET`     | Access token signing secret              |
| `JWT_ACCESS_EXPIRY`     | Access token lifetime                    |
| `JWT_REFRESH_SECRET`    | Refresh token signing secret             |
| `JWT_REFRESH_EXPIRY`    | Refresh token lifetime                   |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name                  |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                       |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                    |
| `SMTP_HOST`             | SMTP server host                         |
| `SMTP_PORT`             | SMTP server port                         |
| `SMTP_SECURE`           | SMTP TLS flag                            |
| `SMTP_USER`             | SMTP username / sender email             |
| `SMTP_PASS`             | SMTP app password                        |
| `EMAIL_FROM`            | Friendly sender name/address             |
| `EMAIL_LOGO_URL`        | Public logo URL for email templates      |
| `SUPPORT_EMAIL`         | Support contact address                  |

#### Frontend

| Variable                       | Purpose                                                 |
| ------------------------------ | ------------------------------------------------------- |
| `VITE_API_URL`                 | Backend API base URL used by Axios                      |
| `VITE_PAYHERE_MERCHANT_ID`     | PayHere merchant ID                                     |
| `VITE_PAYHERE_MERCHANT_SECRET` | PayHere merchant secret used by the current integration |

### Live URLs

These URLs were not stored in the repository, so fill them in after deployment.

| Service                       | URL |
| ----------------------------- | --- |
| Deployed backend API          | [Backend URL](https://donorlens-production.up.railway.app/health) |
| Deployed frontend application | [Frontend URL](https://donor-lens.vercel.app/) |

### Deployment Evidence

Add the following to your submission after deployment:

1. Screenshot of the Railway service showing the backend is live.
    ![BackendDeploymentEvidence](donorlens-frontend/src/assets/BackendDeploymentEvidence.png)

4. Screenshot of the Vercel deployment dashboard showing the frontend deployment succeeded.
    ![FrontendDeploymentEvidence](donorlens-frontend/src/assets/FrontendDeploymentEvidence.png)

6. Screenshot of the live frontend opening in a browser.
    ![BrowserDeploymentEvidence](donorlens-frontend/src/assets/BrowserDeploymentEvidence.png)

For this repository state, the frontend build has been verified locally with `npm run build`.

## Testing Instructions

### 1. Unit Testing

**Frontend unit tests** live in `donorlens-frontend/src/__tests__/` and run with Vitest.

Commands:

```bash
cd donorlens-frontend
npm run test
npm run test:ui
npm run test:coverage
```

**Frontend test environment details**

- Test runner: Vitest
- Environment: `happy-dom`
- Included files: `src/**/*.test.js`, `src/**/*.test.jsx`

### 2. Integration Testing

**Backend integration tests** live in `donorlens-backend/tests/` and run with Playwright.

Commands:

```bash
cd donorlens-backend
npm run test
npm run test:report
```

**Backend test environment details**

- Test runner: Playwright
- Base URL: `http://localhost:5000`
- Test directory: `tests/`
- Timeout: `30000` ms
- Default browser project: Chromium

### 3. Performance Testing

Performance scenarios are stored in `donorlens-backend/tests/performance/` as Artillery YAML files.

Files currently included:

- `campaign-api-load-test.yml`
- `execution-api-load-test.yml`
- `TEMPLATE.yml`

Example commands:

```bash
cd donorlens-backend
npx artillery run tests/performance/campaign-api-load-test.yml
npx artillery run tests/performance/execution-api-load-test.yml
```

**Performance test environment details**

- Target host: `http://localhost:5000`
- Some scenarios require a valid bearer token
- The YAML files use warm-up, sustained load, peak load, and cool-down phases

### 4. Testing Notes

- Test-user cleanup is a script (`npm run cleanup`), not an HTTP route -- see "Test Data Cleanup" above.
- The frontend React Query cache is configured with a 5 minute stale time and no refetch on window focus.
- Playwright runs against the local backend server.
- Before running integration or performance tests, ensure MongoDB and the backend are running.

## Key Application Notes

- DonorLens public pages are designed for donors and visitors.
- NGO users manage campaigns, progress updates, and evidence uploads.
- System admins review users, NGO requests, and campaigns.
- The transparency page is public and pulls live campaign data.
- The app uses JWT access tokens plus refresh token cookies for auth.
- Media uploads go through Cloudinary.
- Payment and notification features rely on external services and environment variables.
