# Authentication API

This document describes the authentication endpoints for the backend.

Base path: `/api/auth`

---

## POST /api/auth/register ✅
Create a new user and return a JWT.

Request body (application/json):
- email (string, required)
- password (string, required, min 8 chars)
- name (string, optional)

Responses:
- 201 Created
  - Body: { token: string, user: { id, email, name } }
- 400 Bad Request
  - Body: { error: string } (missing fields or invalid password length)
- 409 Conflict
  - Body: { error: 'Email already in use' }
- 500 Internal Server Error

Example:

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"s3cretPass","name":"User"}'

---

## POST /api/auth/signin ✅
Validate credentials and return a JWT.

Request body (application/json):
- email (string, required)
- password (string, required)

Responses:
- 200 OK
  - Body: { token: string, user: { id, email, name } }
- 400 Bad Request
  - Body: { error: string }
- 401 Unauthorized
  - Body: { error: 'Invalid credentials' }
- 500 Internal Server Error

Example:

curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"s3cretPass"}'

---

## POST /api/auth/signout ✅
Sign out endpoint. For stateless JWTs this is a convenience endpoint to indicate the client should remove its token.

Request body: none

Responses:
- 200 OK
  - Body: { message: 'Signed out' }

Example:

curl -X POST http://localhost:3000/api/auth/signout

---

# Notes & Security Considerations 🔒
- JWT secret: set `JWT_SECRET` in your environment; default is a placeholder `change_me_in_production` (not secure).
- Passwords are hashed using Node's `crypto.scryptSync` with a per-user salt and stored as `salt:hash` in the `password` column.
- For production consider:
  - Running over HTTPS
  - Using HTTP-only secure cookies to store tokens if you prefer cookie-based auth
  - Implementing token revocation (blacklist) for signout or rotating refresh tokens
  - Adding rate limiting and email validation

# Manual test steps
1. Ensure dependencies are installed: `npm install`
2. Set env vars (optional): `JWT_SECRET` and `PORT`.
3. Start server: `npm run dev`
4. Use the example curl commands above to test register/signin/signout.

---
