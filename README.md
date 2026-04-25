# ASAP

ASAP is an AI-assisted hotel emergency response platform. It connects guests, response staff, and managers through QR-based incident reporting, Firebase Realtime Database updates, Gemini-powered analysis, emergency chat, manager command tools, and live safety broadcasts.

The project is split into:

- `frontend/` - React + Vite app for guests, staff, and managers
- `backend/` - Express API for Gemini analysis, crisis chat, and reports

## Features

### Guest

- Hotel landing page with an automatic hotel-wide safety banner when any active incident exists.
- QR landing page for room/common-area reporting.
- Automatic floor-aware warning banner when an incident is active on the guest's floor.
- Photo, voice, and non-emergency reporting flows.
- AI-filled incident form using backend Gemini analysis.
- Alert confirmation screen with live status and responding staff.
- "Show My Incident QR" for a deep link to the exact incident chat.
- Guest emergency chat with:
  - staff/team messages
  - `@AI` CrisisBot support
  - voice input
  - "I am safe now" confirmation
  - "My Status" timeline tab

### Staff

- Staff login and dashboard.
- Active incident cards with accept/respond actions.
- Hotel map view.
- Team chat with `@AI` crisis support.
- Voice input support in chat.

### Manager

- Manager login and command dashboard.
- Live metrics:
  - active incidents
  - pending response
  - resolved today
  - average response time
- All incidents log with detail panel.
- Emergency escalation modal with nearby fire brigade and hospital details.
- Manual floor broadcast alert flow.
- Automatic guest-facing safety banner based on active incidents.
- Analytics page with charts and AI report generation.
- QR code generator for rooms and common areas.
- Firebase demo data seeding from the dashboard.

### Backend

- Gemini image/voice incident analysis.
- Gemini crisis chat replies.
- Gemini incident report generation.
- Configurable CORS for local and deployed frontends.

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Tailwind CSS
- Firebase Auth and Realtime Database
- Recharts
- `qrcode.react`
- React Hot Toast
- Web Speech API
- Cloudinary unsigned uploads

### Backend

- Node.js
- Express
- Google Gemini API
- Axios
- CORS
- Dotenv

## Project Structure

```text
.
├── backend/
│   ├── controllers/
│   │   ├── geminiController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── geminiRoutes.js
│   ├── services/
│   │   └── geminiService.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── guest/
│   │   │   ├── manager/
│   │   │   └── staff/
│   │   └── services/
│   └── package.json
├── package.json
└── README.md
```

## Routes

### Public / Guest

| Route | Purpose |
|---|---|
| `/` | Main landing page with hotel-wide auto safety banner |
| `/guest/:roomId` | Guest QR landing page |
| `/guest/:roomId/sos` | Report by photo, voice, or non-emergency |
| `/guest/:roomId/analyzing` | AI analysis loading state |
| `/guest/:roomId/form` | AI-filled incident form |
| `/guest/:roomId/confirm` | Alert confirmation and incident QR |
| `/guest/:roomId/chat/:incidentId` | Guest incident chat and status timeline |

### Staff

| Route | Purpose |
|---|---|
| `/staff/login` | Staff login |
| `/staff/dashboard` | Staff response dashboard |

### Manager

| Route | Purpose |
|---|---|
| `/manager/login` | Manager login |
| `/manager/dashboard` | Manager command center |
| `/manager/analytics` | Analytics and AI report generation |
| `/manager/qr-codes` | Room and common-area QR generator |

## Room ID Format

Guest QR URLs use:

```text
/guest/:roomId
```

Examples:

```text
/guest/301-3
/guest/301-floor3
/guest/lobby-ground
/guest/parking-basement
```

The app normalizes numeric floors such as `3` into `floor3` for broadcast matching.

## Quick Start

### 1. Install Dependencies

From the repository root:

```bash
npm run install:all
```

Or install separately:

```bash
cd frontend
npm install

cd ../backend
npm install
```

### 2. Configure Environment Variables

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

Create `backend/.env`:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key

# Comma-separated deployed/local frontend origins.
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Optional single deployed frontend URL.
FRONTEND_URL=https://your-frontend-domain.com
```

### 3. Run the App

From the root:

```bash
npm run dev
```

This runs frontend and backend together.

Or run them separately:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

Default local URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

## Firebase Setup

Enable these Firebase products:

- Authentication
- Realtime Database

The app stores data under:

```text
asap/
├── broadcasts/
├── incidents/
├── managers/
└── staff/
```

### Demo Seed Data

The manager dashboard includes a `Seed Demo Data` button.

It creates:

- sample staff users
- sample manager profile
- active fire incident
- in-progress medical incident
- resolved security incident

Use it to quickly test:

- manager dashboard logs
- automatic safety banners
- escalation modal
- staff dashboard
- analytics

## Automatic Safety Banners

ASAP has two automatic guest-facing warning paths:

### Hotel-Wide Banner

Shown on:

```text
/
```

It appears when any Firebase incident has:

```text
status: active
```

or

```text
status: inprogress
```

### Floor-Aware Banner

Shown on:

```text
/guest/:roomId
```

The QR landing page prioritizes incidents on the guest's floor. If no same-floor incident exists but another active hotel incident exists, it shows a general hotel safety alert.

Manual manager broadcasts still work and take priority over automatic incident banners.

## Emergency Escalation

Managers can open the escalation modal from:

- `Escalation Alerts` cards when an incident is overdue
- `Emergency` action in the `All Incidents Log` table for active/in-progress incidents

The modal includes:

- incident summary
- nearby fire brigade
- nearby hospital
- phone numbers
- distance
- ETA
- editable emergency message

## QR Code Generator

Open:

```text
/manager/qr-codes
```

Managers can generate and print QR codes for:

- rooms
- lobby
- restaurant
- reception
- parking
- gym
- conference room
- terrace areas

Each QR points guests to:

```text
/guest/:roomId
```

## Backend API

Base path:

```text
/api/gemini
```

Endpoints:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/gemini/analyze` | Analyze image and/or transcript for incident fields |
| `POST` | `/api/gemini/chat` | CrisisBot chat response |
| `POST` | `/api/gemini/report` | Generate manager incident report |

## CORS

Backend CORS allows local Vite origins by default:

```text
http://localhost:5173
http://127.0.0.1:5173
```

For deployment, set either:

```env
CORS_ORIGINS=https://your-frontend.web.app,https://your-custom-domain.com
```

or:

```env
FRONTEND_URL=https://your-frontend.web.app
```

## Scripts

### Root

```bash
npm run install:all
npm run dev
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### Backend

```bash
npm run dev
npm start
```

## Demo Flow

1. Start frontend and backend.
2. Open `http://localhost:5173/manager/dashboard`.
3. Click `Seed Demo Data`.
4. Open `http://localhost:5173/`.
5. Confirm the hotel-wide safety banner appears.
6. Open `http://localhost:5173/guest/301-3`.
7. Confirm the floor-aware safety banner appears.
8. From manager dashboard, click `Emergency` for an active incident.
9. Confirm nearby fire brigade and hospital details appear.
10. Open `/manager/qr-codes` and generate room QR codes.
11. Submit a guest incident and open the guest chat/status timeline.

## Deployment Notes

### Frontend - Firebase Hosting

```bash
cd frontend
npm run build
firebase login
firebase init hosting
firebase deploy
```

Set `VITE_API_BASE_URL` to your deployed backend URL before building.

### Backend - Railway / Render

Deploy the `backend/` folder and set:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGINS=https://your-frontend-domain.com
```

On most platforms, `PORT` is provided automatically.

## Known Notes

- Web Speech API works best in Chrome or Edge.
- Camera/microphone features require HTTPS in production.
- Firebase rules must allow the required authenticated or demo reads/writes.
- Cloudinary upload requires an unsigned upload preset.
- The backend currently uses `gemini-2.5-flash` in `backend/services/geminiService.js`. If a submission brief requires Gemini 1.5 Flash, update that model name before final submission.

## Current Verification

The frontend lint check passes:

```bash
cd frontend
npm run lint
```

Backend syntax check:

```bash
node --check backend/server.js
```
