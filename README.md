# NexusTRAFFIC — AI Traffic & Accident Management System

**NexusTRAFFIC** is a state-of-the-art, real-time tactical AI traffic and accident management platform designed for citizens, emergency relief command centers, and tactical field response units. Built with a modern **React 19 + Vite + Tailwind CSS v4** frontend and a production-grade **Node.js + Express.js + Mongoose (MongoDB)** backend, it provides real-time emergency dispatching, live geolocation tracking, sector-based zone classification, and multi-role tactical coordination.

---

## 🚀 Key Features

### 📡 Real-Time Incident Reporting & Tactical Mapping
- **Live Location Geocoding & Capture**: Automatically captures latitude and longitude with address resolution when reporting accidents, traffic hazards, or emergencies.
- **Proximity Relief Command Routing**: Automatically identifies and routes emergency reports to the nearest Relief Center based on Haversine distance math.
- **Sector Zone Classification**: Dynamically assigns incidents to tactical sectors (`A`–`F` and `SECTOR-N`/`SECTOR-S`/`SECTOR-E`/`SECTOR-W`) for rapid regional dispatch.

### 🛡️ Multi-Role Command Structure
- **Citizen / Reporter (`user`)**: Submit live incident reports, track dispatch status, receive real-time notifications, and communicate via emergency incident chat.
- **Relief Admin (`relief_admin`)**: Command center dashboard displaying real-time 15km operational statistics, active emergencies, zone breakdown, team dispatching, and direct broadcast notifications.
- **Tactical Field Unit (`field_unit`)**: Mobile patrol responders with live location sharing, automatic 5km proximity pool assignment, mission status tracking (`en_route`, `on_site`, `available`), and dispatch log messaging.

### ⚡ Live WebSocket Synchronization (Socket.io)
- **Role & Personal Rooms**: Authenticated WebSocket channels (`role:relief_admin`, `role:field_unit`, `user:<id>`, `incident:<id>`) for instant dispatch updates.
- **Real-Time Alerts & Chat**: Live broadcast alerts, personal command notifications, and dispatch communications without page reloading.

### 📊 Tactical Analytics & Reporting
- **Response Analytics**: Real-time stats on active count, critical severity incidents, and average response times.
- **Hourly Emergency Timeline**: Visual breakdown of incident frequency and severity across 24-hour cycles.
- **Data Export**: Instant export of incident data to structured **CSV** and **Text/PDF** reports.

---

## 🛠️ Technology Stack

### Frontend (`/client`)
- **Core**: React 19, Vite, JavaScript (ES6+), Functional Components & Custom Hooks
- **Routing & State**: React Router DOM v7, React Context API (`AuthContext`, `IncidentContext`, `AlertContext`)
- **Styling & UI**: Tailwind CSS v4, Glassmorphism aesthetics, dynamic micro-animations, Lucide React Icons
- **Real-Time**: Socket.io Client (`socket.io-client`)

### Backend (`/server`)
- **Runtime & Framework**: Node.js, Express.js (v4)
- **Database & ODM**: MongoDB, Mongoose ODM (v8) with declarative Schemas & automated indexing
- **Authentication & Security**: JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`), Role Authorization Guards
- **Real-Time WebSocket**: Socket.io Server (v4)
- **Geospatial Processing**: Custom Haversine distance and sector bearing algorithms

---

## 📂 Project Folder Structure

```
AI-Traffic-and-Accident-Management/
│
├── client/                               # React 19 + Vite Frontend Application
│   ├── public/                           # Static assets, favicon, and logos
│   └── src/                              # Frontend source code
│       ├── components/                   # Reusable UI components organized by feature area
│       │   ├── chat/                     # Real-time incident emergency chat & dispatch log
│       │   ├── common/                   # Shared UI elements (navbar, footer, modals, badges, alerts)
│       │   ├── dashboard/                # Command center widgets, tickers, and sector maps
│       │   ├── incidents/                # Emergency incident feed, reporting forms, and detail modals
│       │   ├── map/                      # Interactive live geocoded tactical map and overlays
│       │   └── notifications/            # Real-time alert feed and broadcast notification center
│       ├── context/                      # React Context providers for Auth, Incidents, and Alerts
│       ├── pages/                        # Main application views (Home, Login, Register, Dashboard, etc.)
│       ├── services/                     # Axios API client and Socket.io WebSocket connection handlers
│       └── utils/                        # Formatting utilities, constants, and client-side geocoding math
│
├── server/                               # Node.js + Express.js + Mongoose Backend Application
│   ├── config/                           # Database connection configuration and retry logic
│   ├── controllers/                      # Request handlers for auth, incidents, alerts, units, and teams
│   ├── middleware/                       # JWT authentication, role guards, and global error handling
│   ├── models/                           # Mongoose ODM schemas and models for MongoDB collections
│   ├── routes/                           # Dedicated Express API route definitions
│   ├── services/                         # Multi-collection user search and Socket.io server manager
│   ├── utils/                            # Standardized JSON response formatting and geospatial math
│   └── validators/                       # Reusable input validation helper functions
│
└── ai-service/                           # Dedicated AI Traffic & Incident Processing Service
```


---

## ⚙️ Getting Started & Running Locally

### 1. Prerequisites
- **Node.js**: v18.x or v20.x+ (`node -v`)
- **MongoDB**: MongoDB Server locally running on port `27017` or an active MongoDB Atlas cloud instance.

### 2. Start the Backend Server (`/server`)
Open a terminal inside the `server/` directory:
```bash
cd server
npm install
npm run dev
```
*The Express API and WebSocket server will start at `http://localhost:5000`.*

### 3. Start the Frontend Client (`/client`)
Open a second terminal inside the `client/` directory:
```bash
cd client
npm install
npm run dev
```
*The Vite development server will open the application at `http://localhost:5173`.*

---

## 📡 REST API Reference

| Endpoint | Method | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Register a new Citizen, Relief Admin, or Field Unit account. | Public |
| `/api/auth/login` | `POST` | Authenticate with email/password and receive a JWT token. | Public |
| `/api/auth/me` | `GET` | Retrieve the authenticated user's profile across collections. | Any Role |
| `/api/auth/update-location` | `PATCH` | Update the current user's live coordinates (`lat`, `lng`). | Any Role |
| `/api/incidents` | `POST` | Report a geocoded incident and auto-route to nearest Relief Center. | Any Role |
| `/api/incidents` | `GET` | List emergency incidents with filtering by severity, status, or reporter. | Any Role |
| `/api/incidents/nearby` | `GET` | Filter incidents within a specified radius (default 15km) of a coordinate. | Any Role |
| `/api/incidents/dashboard-stats`| `GET` | Get command center stats (active count, zone A-F breakdown, response time). | `relief_admin` / `user` |
| `/api/incidents/:id/status` | `PATCH` | Update incident status (`dispatched`, `en_route`, `on_site`, `resolved`). | `relief_admin` / `field_unit` |
| `/api/incidents/:id/accept` | `PATCH` | Assign an operational tactical unit to an active incident. | `relief_admin` / `field_unit` |
| `/api/incidents/:id/chat` | `POST` | Send a dispatch chat message linked to a specific emergency incident. | Any Role |
| `/api/alerts` | `POST` | Broadcast a real-time system alert to all users or specific sectors. | `relief_admin` |
| `/api/alerts/send-notification`| `POST` | Direct Relief Admin message notification sent to an incident reporter. | `relief_admin` |
| `/api/field-units` | `GET` | Retrieve list and status of all operational tactical field units. | Any Role |
| `/api/teams` | `POST` | Create a regional response team assigned to a tactical sector zone. | `relief_admin` |
| `/api/reports/export/csv` | `GET` | Export filtered emergency incident records as a downloadable CSV file. | Any Role |

---

## 📄 License & Ownership
Copyright © 2026 **NexusTRAFFIC AI Systems**. Built for Advanced Tactical Traffic & Accident Management.