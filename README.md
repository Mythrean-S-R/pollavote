# Pollavote

A real-time live polling application built with React, Go, Gin, MongoDB, Redis, and WebSockets.

Poll creators can create polls and share them with an audience. Participants can vote through a public poll link, while results update in real time across connected clients without requiring a page refresh.

## Live Application

- Frontend: https://pollavote.vercel.app/
- Backend Health Check: https://pollavote-backend.onrender.com/api/health

## Features

- Creator signup and login
- JWT-based authentication
- Secure password hashing with bcrypt
- Poll creation with multiple options
- Shareable public poll links
- Audience voting
- Duplicate-vote prevention
- Real-time result updates
- WebSocket-based live connections
- Redis Pub/Sub for real-time event distribution
- MongoDB persistence
- Protected creator dashboard
- Backend-side validation
- CORS protection
- WebSocket origin validation
- Responsive and polished React UI

## Technology Stack

### Frontend

- React
- React Router
- Vite
- JavaScript
- CSS

### Backend

- Go
- Gin
- JWT authentication
- bcrypt
- Gorilla WebSocket

### Data & Real-Time

- MongoDB
- Redis
- Redis Pub/Sub

### Deployment

- Vercel — frontend
- Render — backend
- MongoDB Atlas — database
- Redis Cloud — Redis

## Architecture

```text
                         ┌──────────────────────┐
                         │       React UI       │
                         │       Vercel         │
                         └──────────┬───────────┘
                                    │
                         HTTP / WebSocket
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Go + Gin        │
                         │      Render          │
                         └───────┬───────┬──────┘
                                 │       │
                    ┌────────────┘       └────────────┐
                    ▼                                 ▼
           ┌─────────────────┐              ┌─────────────────┐
           │    MongoDB      │              │      Redis      │
           │   Persistence   │              │    Pub/Sub      │
           └─────────────────┘              └────────┬────────┘
                                                     │
                                                     ▼
                                            ┌─────────────────┐
                                            │ WebSocket Hub   │
                                            │ Live Updates    │
                                            └─────────────────┘

```

```text

How Real-Time Updates Work

Pollavote uses WebSockets together with Redis Pub/Sub.

When a participant votes:

The React client sends the vote to the Go backend.
The backend validates the request and checks whether the voter has already voted.
MongoDB updates the selected option's vote count.
The backend publishes the updated poll state to a Redis channel for that poll.
The Redis subscriber receives the update.
The backend broadcasts the update to all WebSocket clients connected to that poll.
Connected React clients update their results immediately without refreshing the page.

This architecture allows multiple backend processes to share real-time poll updates through Redis.

Authentication

Creator authentication uses JWT.

The authentication flow is:

A creator signs up with a name, email, and password.
The backend validates the input.
The password is hashed using bcrypt before storage.
Login verifies the supplied password against the stored hash.
A signed JWT is returned after successful authentication.
Protected endpoints require the JWT in the Authorization header.
The backend validates the token signature and expiration before allowing access.

The JWT signing secret is stored in an environment variable and is never committed to the repository.

Vote Protection

The application prevents a voter from voting multiple times in the same poll.

A vote is associated with:

Poll ID
Voter ID
Selected option ID

The backend checks for an existing vote before processing a new vote.

MongoDB also uses a unique compound index on:

pollId + voterId

This provides an additional database-level protection against duplicate votes.

API Overview
Public Endpoints
GET  /api/health
POST /api/signup
POST /api/login
GET  /api/polls/:id
POST /api/polls/:id/vote
GET  /api/polls/:id/ws
Protected Endpoints
POST /api/polls
GET  /api/my-polls

Protected endpoints require:

Authorization: Bearer <JWT>
Project Structure
pollavote/
│
├── backend/
│   ├── config/
│   │   ├── database.go
│   │   └── redis.go
│   │
│   ├── handlers/
│   │   ├── auth.go
│   │   ├── poll.go
│   │   └── websocket.go
│   │
│   ├── middleware/
│   │   └── auth.go
│   │
│   ├── models/
│   │   ├── user.go
│   │   ├── poll.go
│   │   └── vote.go
│   │
│   ├── services/
│   │   ├── auth.go
│   │   ├── poll.go
│   │   └── realtime.go
│   │
│   ├── websocket/
│   │   └── hub.go
│   │
│   ├── main.go
│   ├── go.mod
│   └── go.sum
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   │
│   ├── vercel.json
│   ├── package.json
│   └── vite.config.js
│
├── README.md
└── .gitignore
Running Locally
Prerequisites

Install:

Go
Node.js
MongoDB or a MongoDB Atlas database
Redis or a Redis Cloud instance
1. Clone the repository
git clone https://github.com/Mythrean-S-R/pollavote.git
cd pollavote
2. Configure the backend

Create a .env file inside backend/:

MONGODB_URI=your_mongodb_connection_string
REDIS_ADDR=your_redis_address
REDIS_USERNAME=your_redis_username
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
PORT=8080

Do not commit this file.

3. Start the backend
cd backend
go run .

The API will run on:

http://localhost:8080

Health check:

http://localhost:8080/api/health
4. Configure the frontend

Create frontend/.env:

VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_BASE_URL=ws://localhost:8080
5. Start the frontend

Open another terminal:

cd frontend
npm install
npm run dev

The frontend will normally be available at:

http://localhost:5173
Production Environment Variables
Frontend
VITE_API_BASE_URL=https://pollavote-backend.onrender.com/api
VITE_WS_BASE_URL=wss://pollavote-backend.onrender.com
Backend
MONGODB_URI=...
REDIS_ADDR=...
REDIS_USERNAME=...
REDIS_PASSWORD=...
JWT_SECRET=...
FRONTEND_URL=https://pollavote.vercel.app
PORT=...

Secrets should be configured through the deployment platform's environment-variable settings rather than committed to Git.

Security Considerations

The project includes several basic security measures:

Passwords are stored using bcrypt hashes.
JWT signatures use a server-side secret.
JWT signing method is explicitly checked.
Protected API routes require authentication.
Authentication failures return appropriate HTTP errors.
CORS is restricted to the configured frontend origin.
WebSocket connections validate the request origin.
Duplicate votes are prevented at both application and database levels.
Environment secrets are excluded from Git.
Backend validation is performed independently of frontend validation.
Testing

The application was tested through the complete production flow, including:

Creator signup/login
Poll creation
Public poll access
Audience voting
Duplicate-vote prevention
Real-time updates across multiple browser tabs
WebSocket connection
Protected API access
Logout and authentication rejection
Re-authentication
Direct poll URL navigation
Production frontend/backend communication
Frontend production build
Key Design Decisions
Why Go + Gin?

Go provides a lightweight backend suitable for handling HTTP APIs and concurrent WebSocket connections. Gin provides a simple routing and middleware layer.

Why MongoDB?

Polls, users, and votes are persistent application data. MongoDB's document model works naturally with polls containing multiple options.

Why Redis?

Redis Pub/Sub provides a simple way to distribute real-time poll updates between backend components and supports scaling the WebSocket layer beyond a single process.

Why WebSockets?

Polling the server repeatedly would introduce unnecessary requests and delay. WebSockets maintain a persistent connection so the server can push updated results immediately.

Why JWT?

JWT provides a straightforward stateless authentication mechanism for the creator-facing API.

Real-Time Data Flow
User A votes
     │
     ▼
React
     │
     ▼
POST /api/polls/:id/vote
     │
     ▼
Go + Gin
     │
     ├──────────────► MongoDB
     │                  │
     │                  └── Update vote count
     │
     └──────────────► Redis Pub/Sub
                           │
                           ▼
                    Redis Subscriber
                           │
                           ▼
                    WebSocket Hub
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
          User B                    User C
       Results update            Results update
       without refresh           without refresh
Deployment

The application is deployed as separate frontend and backend services.

React frontend
      │
      ▼
   Vercel
      │
      │ HTTPS / WSS
      ▼
Go backend
      │
      ├── MongoDB Atlas
      │
      └── Redis Cloud

Frontend:

https://pollavote.vercel.app/

Backend:

https://pollavote-backend.onrender.com/
Author

Mythrean S R

GitHub:

https://github.com/Mythrean-S-R/pollavote
