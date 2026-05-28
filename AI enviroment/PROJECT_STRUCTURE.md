# Web02_Messenger - Project Structure & Documentation

## 📋 Project Overview

**Web02_Messenger** là một ứng dụng **Real-time Chat/Messenger** được xây dựng với frontend React và backend Express.js, sử dụng WebSocket (Socket.io) để gửi/nhận tin nhắn real-time. Dữ liệu được lưu trữ trong PostgreSQL database.

**Mục đích**: Cho phép người dùng đăng ký, đăng nhập, tham gia hội thoại và trao đổi tin nhắn real-time với các người dùng khác.

---

## 🏗️ Technology Stack

### Backend

- **Framework**: Express.js v5.2.1 (Node.js)
- **Real-time Communication**: Socket.io v4.8.3
- **Database**: PostgreSQL (pg v8.21.0)
- **Authentication**:
  - JWT (jsonwebtoken v9.0.3) - cho token-based auth
  - bcrypt v6.0.0 - mã hóa password
- **Security**:
  - CORS v2.8.6 - cross-origin requests
  - express-rate-limit v8.5.2 - rate limiting (120 requests/minute)
- **Environment**: dotenv v17.4.2 - load .env variables
- **Development**: nodemon v3.1.14 - auto-reload

### Frontend

- **Framework**: React v19.2.6 (SPA - Single Page Application)
- **Build Tool**: Vite v8.0.12 (fast bundler)
- **HTTP Client**: axios v1.16.1
- **Real-time Client**: socket.io-client v4.8.3
- **Styling**: CSS (custom - App.css, index.css)
- **Linter**: ESLint v10.3.0

---

## 📁 Project Structure

```
Web02_Messenger/
├── AI enviroment/             # 🤖 AI-friendly entry point cho giao tiếp BE Ōåö EE
│   ├── PROJECT_STRUCTURE.md          # Tổng quan project (this file)
│   ├── UNIFIED_INTERFACE.md          # 🎯 Entry point chính cho AI
│   ├── API_ENDPOINTS.md              # 📡 REST API reference đầy đủ
│   ├── SOCKET_EVENTS.md              # 🔌 Socket.io events guide
│   ├── ai_client.js                  # 🤖 JavaScript client helper module
│   └── CURL_EXAMPLES.md              # 🐚 Curl examples để test nhanh
│
├── backend/                   # Node.js + Express server
│   ├── server.js              # Main server file - Express app, Socket.io setup, API endpoints
│   ├── db.js                  # PostgreSQL connection pool (pg module)
│   ├── db.init.sql            # Database schema & initialization (run once)
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment variables (DATABASE_URL, PORT, etc.)
│
├── frontend/                  # React + Vite application
│   ├── src/
│   │   ├── App.jsx            # Main component - chat interface, message display, handlers
│   │   ├── App.css            # Styling for chat UI
│   │   ├── socket.js          # Socket.io client connection config (connected to backend)
│   │   ├── main.jsx           # React entry point (renders App to #app)
│   │   ├── index.css          # Global styles
│   │   └── assets/            # Static assets (images, icons, etc.)
│   ├── index.html             # HTML template (entry point for Vite)
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite bundler configuration
│   ├── eslint.config.js       # ESLint configuration
│   ├── README.md              # Frontend-specific README
│   └── .env                   # Environment variables (VITE_API_URL for backend URL)
│
├── test/
│   └── test.rest              # REST API test file (for REST clients like Thunder Client)
│
└── (root PROJECT_STRUCTURE.md was moved to AI enviroment/)
```

---

## 🗄️ Database Schema

### Tables

#### `users`

```sql
- id (SERIAL PRIMARY KEY)
- username (VARCHAR 50, UNIQUE, NOT NULL)
- password_hash (TEXT)
- nickname (TEXT) - display name
- avatar_url (TEXT) - profile picture
- created_at (TIMESTAMP DEFAULT NOW())
```

#### `conversations`

```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR 100) - group name or null for 1-on-1
- is_group (BOOLEAN DEFAULT FALSE)
- created_at (TIMESTAMP DEFAULT NOW())
```

#### `conversation_members`

```sql
- user_id (INT, FK → users.id)
- conversation_id (INT, FK → conversations.id)
- joined_at (TIMESTAMP DEFAULT NOW())
- PRIMARY KEY (user_id, conversation_id)
```

#### `messages`

```sql
- id (SERIAL PRIMARY KEY)
- conversation_id (INT, FK → conversations.id)
- sender_id (INT, FK → users.id)
- content (TEXT)
- created_at (TIMESTAMP DEFAULT NOW())
```

#### `message_reads`

```sql
- message_id (INT, FK → messages.id)
- user_id (INT, FK → users.id)
- read_at (TIMESTAMP DEFAULT NOW())
- PRIMARY KEY (message_id, user_id)
```

---

## 🔌 Backend API & Real-time Events

### REST API Endpoints (Backend)

| Method | Endpoint                        | Description                            | Status                            |
| ------ | ------------------------------- | -------------------------------------- | --------------------------------- |
| GET    | `/users`                        | Get all users                          | ✅ Implemented                    |
| POST   | `/register`                     | Register new user (username, password) | ✅ Implemented                    |
| POST   | `/login`                        | Login user (username, password)        | ✅ Implemented                    |
| PUT    | `/changePassword`               | Change user password                   | ✅ Implemented (fixed SQL syntax) |
| GET    | `/conversation/messages`        | Get messages for conversation          | ✅ Implemented                    |
| POST   | `/conversation/:id/postMessage` | Send a new message                     | ✅ Implemented                    |
| GET    | `/profile`                      | Get user profile (requires JWT token)  | ✅ Implemented                    |
| GET    | `/`                             | Health check (DB connection)           | ✅ Implemented                    |

**Rate Limiting**: 120 requests per 60 seconds (global limiter)

### Socket.io Events (Real-time)

**Server emits**:

- `receive_message` - khi có tin nhắn mới (gửi tới tất cả clients)

**Server listens for**:

- `connection` - when client connects
- `disconnect` - when client disconnects

**Current Implementation**:

- Backend uses `io.emit("receive_message", message)` after inserting into DB
- Frontend filters out own messages (by username) to avoid duplicates

---

## 🎨 Frontend Components & Logic

### App.jsx (Main Component)

**Key State Variables**:

- `messages` - array of messages in conversation
- `username` - current logged-in user (from sessionStorage)
- `conversationName` - display name of current chat
- `inputMessage` - current message being typed
- `showScrollButton` - show/hide scroll-to-bottom button
- `modalOpen` - login modal state
- `modalUsername` / `modalPassword` - login form fields

**Key Features**:

- **Auto-scrolling**: Scrolls to latest message when new message arrives
- **Scroll Position Detection**: Shows "scroll down" button when user scrolls up
- **Session Management**: Retrieves username from sessionStorage
- **Real-time Updates**: Listens to Socket.io `receive_message` event
- **Message Fetching**: Calls `/conversation/messages` endpoint on component mount or username change with `Authorization` header instead of username query
- **Optimistic UI**: Immediately adds message to UI before POST returns
- **Login Modal**: Popup để nhập username/password

**Socket Connection**:

- Frontend connects to `http://localhost:5000` (dev) or `https://chat-app-7vt9.onrender.com` (production)
- Config trong `frontend/src/socket.js`

---

## 🚀 How to Run Project

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL database
- .env files configured

### Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Create .env file with:
DATABASE_URL=postgresql://user:password@localhost:5432/chat_app
PORT=5000
JWT_SECRET=your_secret_key

# 3. Initialize database (run once):
psql -U postgres -d chat_app -f db.init.sql

# 4. Start server (development with nodemon):
npm run dev

# Or start for production:
npm start
```

**Server runs at**: http://localhost:5000 (or PORT from .env)

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Create .env file with:
VITE_API_URL=http://localhost:5000
# or for production:
VITE_API_URL=https://chat-app-7vt9.onrender.com

# 3. Start dev server (Vite):
npm run dev

# 4. Or build for production:
npm run build

# 5. Preview built app:
npm run preview
```

**Frontend runs at**: http://localhost:5173 (default Vite port)

---

## 📝 Current Implementation Status

### ✅ Completed

- Database schema and initialization
- User registration with bcrypt hashing
- User login with JWT token generation
- Password change with validation
- Basic user retrieval
- Profile endpoint (JWT protected)
- Frontend message display with Socket.io integration
- Session-based authentication (username stored in sessionStorage)
- Real-time message broadcasting (io.emit with frontend filtering)
- Optimistic UI for sent messages
- Rate limiting on API
- CORS configuration

### ⚠️ In Progress / Incomplete

- Socket.io message dedicated event (`send_message`) on server side
- JWT auth middleware integration on all protected routes
- Conversation creation/management
- Group chat functionality

### ❌ Not Implemented Yet

- Message deletion/editing
- Typing indicators
- User presence/online status
- Message read receipts
- File/media sharing

---

## 🔑 Key Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/chat_app
PORT=5000
JWT_SECRET=your_secret_key_here (REQUIRED for JWT auth)
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000 (dev)
# or VITE_API_URL=https://your-production-backend.com
```

---

## 🐛 Known Issues

### ✅ FIXED Issues

1. **Duplicate Messages on First Send** (FIXED 2026-05-27):
   - **Root Cause**:
     - Frontend: `useEffect` for `receive_message` listener had empty dependency array `[]`
     - Backend: Used `io.emit()` sends to ALL clients including the sender
   - **Solution**:
     - Frontend: Added `username` to dependency array `[username]`
     - Backend: Changed to `io.broadcast.emit()` to send only to OTHER clients

2. **SQL Error in /changePassword** (FIXED):
   - `UPDATE INTO` → `UPDATE`
   - Missing `await` for function call
   - Both fixed in current code

### ⚠️ Outstanding Issues

1. **Frontend Not Handling Response**:
   - After `postMessage`, frontend doesn't process the axios response
   - Currently uses optimistic UI (adds message immediately) and ignores response
   - Can be enhanced: user's own message can come from response, others from socket

2. **No proper login UI**:
   - Login modal only stores username, no JWT token management yet
   - Frontend doesn't use tokens; still relies on sessionStorage username

---

## 📚 References

- **Socket.io Docs**: https://socket.io/docs/
- **Express Docs**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Vite Docs**: https://vitejs.dev/

---

## 👤 Session & Auth Flow (Current)

1. User registers via `/register` endpoint (receives JWT token)
2. Or logs in via `/login` endpoint (receives JWT token)
3. Frontend stores `username` in sessionStorage (NOT token)
4. Frontend fetches messages using username as identifier (no auth header)
5. Socket.io connects to server
6. User sends message via REST API, backend broadcasts via Socket.io
7. Frontend receives real-time updates and auto-scrolls

**Note**: This is session-based, not fully token-based. For production, implement JWT token management on frontend.

---

## 🤖 AI Environment Entry Points

| File                   | Mô tả                                               |
| ---------------------- | --------------------------------------------------- |
| `UNIFIED_INTERFACE.md` | 🎯 Entry point chính, hướng dẫn nhanh cho AI        |
| `API_ENDPOINTS.md`     | 📡 REST API reference với request/response mẫu      |
| `SOCKET_EVENTS.md`     | 🔌 Socket.io events guide                           |
| `ai_client.js`         | 🤖 JavaScript helper module (có thể require/import) |
| `CURL_EXAMPLES.md`     | 🐚 Curl commands mẫu để test nhanh                  |

---

_Document created to provide AI with comprehensive project context. Last updated: 2026-05-27_
