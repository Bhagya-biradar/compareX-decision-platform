# CompareX

CompareX is a full-stack MERN decision support platform for comparing options with weighted scoring.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB, Mongoose
- Auth: JWT, bcryptjs

## Project Structure

- `backend/` - Express API, auth, comparison CRUD, MongoDB models
- `frontend/` - React UI, routing, auth state, dashboard, comparison forms

## Setup

1. Create environment files:
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`
2. Set `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` in the backend env file.
3. Install dependencies from the repo root:
   - `npm install`
4. Run both apps:
   - `npm run dev`

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Comparisons

- `POST /api/comparisons`
- `GET /api/comparisons`
- `GET /api/comparisons/:id`
- `PUT /api/comparisons/:id`
- `DELETE /api/comparisons/:id`

## Notes

- JWT is stored in `localStorage` on the client.
- Only the comparison owner can edit or delete their records.
- The weighted score result is computed on the backend before save.
