# Cloud Storage Backend

![Node.js](https://img.shields.io/badge/Node.js-22+-3C873A?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-111111?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-13AA52?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Rate%20Limit-D82C20?style=for-the-badge&logo=redis&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-File%20Storage-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Auth](https://img.shields.io/badge/Auth-JWT-F59E0B?style=for-the-badge)

Complete Express + MongoDB backend for cloud storage with user authentication flows (register, login, logout, token refresh), profile management, secure file upload, and fully documented route-based APIs for users, folders, and files.

> Note: This cloud storage project is ongoing and features/routes may continue to evolve.

## Tech Stack

- Node.js (ESM)
- Express 5
- MongoDB + Mongoose
- JWT (access + refresh)
- Redis (login attempt throttling)
- Multer (multipart handling)
- Cloudinary (file storage)
- Cookie Parser + CORS

## Current Features

- User registration with avatar upload
- Login with access/refresh token issuance
- Logout with cookie clear and refresh token unset
- Refresh access token endpoint
- Get authenticated user profile
- Update avatar
- Update password
- Update email
- Create folder
- List all folders for logged-in user
- Delete folder
- List all files in a folder
- Upload file to a folder

## API Base

- Base URL: http://localhost:3000
- Global prefix: /api/v1

Mounted route groups:

- /api/v1/users
- /api/v1/folders
- /api/v1/files

## Authentication

Protected endpoints require either:

- accessToken cookie, or
- Authorization header with Bearer token

Token details:

- Access token signed with JWT_SECRET
- Refresh token signed with JWT_REFRESH_SECRET
- Refresh token is also checked against stored value in DB before issuing new access token

## Standard Response and Error Shape

Success responses use a common wrapper from responseHandler:

- statusCode
- message
- data

Error middleware returns:

- statusCode
- message
- errors (array)

## API Endpoints

### Users

| Method | Route                             | Secured | Body/Params                                                  | Notes                         |
| ------ | --------------------------------- | ------- | ------------------------------------------------------------ | ----------------------------- |
| POST   | /api/v1/users/register            | No      | multipart: fullname, username, email, password, avatar(file) | Create new user               |
| POST   | /api/v1/users/login               | No      | email, password                                              | Redis rate-limit by email+ip  |
| POST   | /api/v1/users/logout              | Yes     | none                                                         | Clears auth cookies           |
| POST   | /api/v1/users/refreshAccessToken  | No\*    | refreshToken cookie                                          | Requires valid refresh cookie |
| GET    | /api/v1/users/profile             | Yes     | none                                                         | Returns current user          |
| PATCH  | /api/v1/users/updateprofileavatar | Yes     | multipart: avatar(file)                                      | Updates avatar via Cloudinary |
| POST   | /api/v1/users/updatepassword      | Yes     | oldpassword, newpassword                                     | Changes password              |
| PATCH  | /api/v1/users/updateemail         | Yes     | newemail                                                     | Updates email if unique       |

### Folders

| Method | Route                                         | Secured | Body/Params    | Notes                               |
| ------ | --------------------------------------------- | ------- | -------------- | ----------------------------------- |
| POST   | /api/v1/folders/createfolder                  | Yes     | foldername     | Create folder for logged-in user    |
| GET    | /api/v1/folders/getalluserfolders             | Yes     | none           | List folders of current user        |
| DELETE | /api/v1/folders/deletefolder/:folderid        | Yes     | folderid param | Deletes folder and associated files |
| GET    | /api/v1/folders/getallfilesinfolder/:folderid | Yes     | folderid param | List files in folder                |

### Files

| Method | Route                               | Secured | Body/Params                          | Notes                                          |
| ------ | ----------------------------------- | ------- | ------------------------------------ | ---------------------------------------------- |
| GET    | /api/v1/files/getalluserfiles       | Yes     | query: page, limit, sortby, sorttype | List all files for logged-in user              |
| POST   | /api/v1/files/uploadfile/:folderid? | Yes     | multipart file; folderid optional    | Uploads file with or without folder assignment |

Secured = requires valid access token (cookie or Bearer token).
No\* = endpoint itself is public but needs a valid refresh token cookie.

## Environment Variables

Use backend/.env.example as template.

Required keys in backend/.env:

- PORT
- CORS_ORIGIN
- MONGODB_URI
- JWT_SECRET
- JWT_EXPIRES_IN
- JWT_REFRESH_SECRET
- JWT_REFRESH_EXPIRES_IN
- REDIS_HOST
- REDIS_PORT
- REDIS_PASSWORD
- cloudinary_name
- cloudinary_api_key
- cloudinary_api_secret
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET

## Run Locally

1. Install dependencies

- From backend folder: npm install

2. Start Redis

- Option A: local Redis instance
- Option B: docker compose in backend folder:
  - docker compose up -d

3. Start API

- From backend folder: npm start

Server runs on configured PORT (current code defaults effectively to 3000 in index startup line).

## Security Implemented

- Password hashing with bcrypt in model pre-save hook
- JWT-based auth for protected routes
- HttpOnly secure cookies for tokens
- Token verification middleware for protected routes
- Refresh token re-validation against stored DB token
- Login brute-force mitigation via Redis attempt counter
- Centralized error middleware
- CORS origin configuration via environment variable
- Sensitive config in environment variables

## Login Rate Limit

Rate limiting is applied to the login endpoint to reduce brute-force attempts.

- Endpoint: `POST /api/v1/users/login`
- Strategy: Redis key by `email + ip`
- Limit: 5 failed attempts
- Window: 60 seconds
- Behavior: after limit is reached, API returns `429 Too many login attempts`

Middleware path:

- `backend/src/middlewares/ratelim.middleware.js`

## Important Notes and Current Gaps

These are useful to know while integrating frontend or deploying:

- CORS is configured with origin only; credentials setting is not explicitly enabled.
- Cookie secure flag is always true, so local HTTP testing may need HTTPS/proxy adjustments.
- Multer currently has no file size/type validation configured.
- Some controller logic and naming are inconsistent (for example refresh token storage and generation flow), so additional hardening/refactor is recommended before production use.
- No automated tests are included yet.

## Folder Structure

- backend/src/app.js: app setup, middleware, route mounting
- backend/src/index.js: entry point and DB connect
- backend/src/routes: route definitions
- backend/src/controllers: request handlers
- backend/src/models: mongoose schemas
- backend/src/middlewares: auth, multer, login rate-limit
- backend/src/db: Mongo and Redis config
- backend/src/utils: async wrapper, upload helper, response/error helpers
