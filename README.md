# Social Chat Application

A full-stack real-time messaging platform built with React, Node.js, Express, Socket.io, and MongoDB Atlas. Users can register, log in, send private messages, create and manage group chats, update their profile, and reset their password via email.

---

## Features

- User registration and login with JWT-based authentication
- Real-time private messaging with typing indicators and unread message badges
- Real-time group messaging with typing indicators and unread message badges
- Conversation sidebar showing last message preview and unread counts per contact
- Group sidebar showing last message preview and unread counts per group
- Start new conversations by searching or browsing all registered users
- Idempotent message sending — retries never create duplicate messages in private or group chat
- Online/offline user status tracking
- User profile with profile picture upload (file or URL)
- Password reset via email link
- Dashboard with summary statistics (total users, messages, groups)
- Group settings: view members, remove members, delete group
- Group creator is automatically added as a member on group creation
- Responsive layout with hamburger navigation menu on mobile
- Protected routes — unauthenticated users are redirected to login
- Centralized error handling and security headers via helmet
- Rate limiting on authentication and message endpoints

---

## Tech Stack

**Frontend**
- React 18 (Vite + @vitejs/plugin-react)
- React Router DOM v5
- Axios (centralized API service with token interceptor)
- Socket.io Client
- Bootstrap 5 and react-bootstrap
- react-select (dropdowns)
- react-toastify (notifications)
- sweetalert2 (confirmation modals)
- emoji-picker-react (emoji picker in chat)

**Backend**
- Node.js with Express 4
- Socket.io 4
- Mongoose 8 (MongoDB Atlas)
- JSON Web Tokens (jsonwebtoken)
- bcrypt (password hashing)
- Joi 17 (input validation)
- Nodemailer (Gmail — password reset emails)
- multer (file uploads)
- helmet (security headers)
- express-rate-limit (rate limiting)

---

## Prerequisites

- Node.js 18 or later
- A MongoDB Atlas account with a cluster and database
- A Gmail account with an app password enabled (for password reset emails)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Martin888Maina/Social-Chat-Application.git
cd Social-Chat-Application
```

### 2. Set up the server

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory based on `.env.example`:

```env
PORT=4000
MONGODB_URI=your-mongodb-atlas-connection-string
DB_NAME=chatDB
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret
CLIENT_URL=http://localhost:3000
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
NODE_ENV=development
```

To generate JWT secrets, run:

```bash
node auth/generateKeys.js
```

Copy the output values into your `.env` file.

Start the server:

```bash
npm start
```

The server runs on `http://localhost:4000`.

### 3. Set up the client

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory based on `.env.example`:

```env
VITE_API_URL=http://localhost:4000
```

Start the frontend:

```bash
npm run dev
```

The app opens at `http://localhost:3000`.

Both the server and client must be running at the same time.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (default: 4000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `DB_NAME` | Database name (e.g. chatDB) |
| `ACCESS_TOKEN_SECRET` | Secret key for signing JWT access tokens |
| `REFRESH_TOKEN_SECRET` | Secret key for signing JWT refresh tokens |
| `CLIENT_URL` | Frontend origin for CORS (e.g. http://localhost:3000) |
| `EMAIL_USER` | Gmail address used to send password reset emails |
| `EMAIL_PASSWORD` | Gmail app password |
| `NODE_ENV` | Environment (development or production) |

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (e.g. http://localhost:4000) |

---

## Project Structure

```
Social-Chat-Application/
├── client/                        # React frontend (Vite)
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                # Route definitions
│       ├── context/
│       │   └── AuthContext.js     # Authentication state management
│       ├── services/
│       │   └── api.js             # Centralized Axios instance
│       ├── utils/
│       │   ├── socketManager.js   # Singleton Socket.io connection
│       │   └── formatDate.js      # Date formatting helper
│       └── components/
│           ├── auth/              # Login, Register, ForgotPassword, PasswordReset, ProtectedRoute
│           ├── user/              # UserChat, UserProfile
│           ├── group/             # GroupChat, CreateGroup, GroupSettings
│           ├── dashboard/         # Dashboard
│           ├── layout/            # Navbar, Footer
│           ├── common/            # LoadingSpinner, ErrorAlert, SuccessAlert
│           └── styling/           # Per-component CSS files
│
├── server/                        # Express backend
│   ├── index.js                   # Entry point, Socket.io setup
│   ├── auth/                      # Joi validation schemas
│   ├── config/                    # MongoDB, email, utilities
│   ├── controller/                # Route handler logic
│   ├── helpers/                   # JWT sign and verify
│   ├── middleware/                 # Error handler, multer upload
│   ├── models/                    # Mongoose schemas
│   ├── routes/                    # Express route definitions
│   └── uploads/                   # Uploaded profile pictures (gitignored)
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## API Overview

All routes are prefixed and mounted in `server/index.js`.

**Authentication** (`/Register`)
- `POST /Register/register` — create a new account
- `POST /Register/login` — login and receive tokens
- `POST /Register/refresh-token` — exchange refresh token for new access token
- `GET /Register/user` — get current user profile (auth required)
- `GET /Register/users` — list all users (auth required)
- `PATCH /Register/updateProfile` — update name, email, telephone (auth required)
- `POST /Register/updateProfilePictureUrl` — update profile picture (auth required)
- `GET /Register/stats` — summary statistics (auth required)

**Private Messaging** (`/Message`)
- `POST /Message/saveMessage` — save a message (idempotent via clientId)
- `GET /Message/messages/:senderId/:receiverId` — fetch message history
- `GET /Message/conversations` — fetch conversation list with unread counts (auth required)
- `GET /Message/unread-counts` — get unread message counts per sender (auth required)
- `PATCH /Message/mark-read/:senderId` — mark all messages from a sender as read (auth required)
- `GET /Message/search/:userId/:receiverId` — search messages by query
- `PATCH /Message/updateMessage/:_id` — update a message
- `DELETE /Message/deleteMessage/:_id` — delete a message

**Group Chat** (`/Group`)
- `POST /Group/groups` — create a group (creator auto-added as member)
- `POST /Group/groups/:groupId/members` — add a member
- `GET /Group/users/:userId/groups` — get groups for a user
- `POST /Group/groups/:groupId/messages` — send a message to a group (idempotent via clientId)
- `GET /Group/groups/:groupId/messages` — fetch group messages
- `GET /Group/groups/:groupId/members` — list group members
- `DELETE /Group/groups/:groupId/members/:userId` — remove a member (creator only)
- `DELETE /Group/groups/:groupId` — delete a group (creator only)

**Password Reset** (`/Password`)
- `POST /Password/forgot` — send reset link to email
- `POST /Password/reset` — reset password using token

---

## Authentication

- Tokens are stored in `sessionStorage` and cleared when the browser tab is closed.
- Access tokens expire after 1 hour. Refresh tokens expire after 1 year.
- The Axios instance automatically attaches the bearer token to every request.
- A 401 response triggers an automatic logout and redirect to the login page.
- Protected routes check for a valid token and redirect unauthenticated users to `/LoginForm`.

---

## Real-time Messaging

Socket.io is used for all real-time communication. The connection is managed by a singleton in `client/src/utils/socketManager.js` to prevent duplicate connections.

Key socket events:
- `new user` — register presence when a user connects
- `chat message` — private message routing between two users
- `group message` — broadcast to all members in a group room
- `typing` — private chat typing indicator sent to the recipient
- `group typing` — group chat typing indicator broadcast to the group room
- `logout` — remove user from the online list
- `update users` — broadcast the updated online user list to all clients
- `notification` — push notification for incoming private or group messages

---

## Idempotency and Deduplication

Both private and group message sending use a client-generated `clientId` (UUID) attached to each send request.

- The backend uses `findOneAndUpdate` with `$setOnInsert` and `upsert: true` on the `clientId` field, so a retry with the same key returns the original saved record without inserting a duplicate.
- The `clientId` field on both the `Message` and `Conversation` models has a sparse unique index, providing a database-level safety net.
- On the frontend, incoming socket messages are deduplicated by both `_id` and `clientId` before being appended to the message list.
- The send button is disabled while a request is in-flight to prevent double-submission from rapid clicks.

---

## Known Limitations

- Online user tracking is in-memory only and resets if the server restarts.
- Password reset links point to `http://localhost:3000` and must be updated for production deployment.
- No message pagination — all messages in a conversation are loaded at once.
- No end-to-end encryption for messages.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
