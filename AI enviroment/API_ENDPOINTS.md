"# 📡 REST API Endpoints Reference

> Base URL: `http://localhost:5000` (hoặc biến môi trường VITE_API_URL)

---

## 1. User Management

### `GET /users`

Lấy danh sách tất cả users.

**Headers**: Không yêu cầu auth.

**Response** (200):

```json
[
  {
    "id": 1,
    "username": "hoang",
    "password_hash": "$2b$10$...",
    "nickname": "Hoàng",
    "avatar_url": "https://example.com/avatar1.png",
    "created_at": "2026-05-21T03:27:33.843Z"
  }
]
```

---

### `POST /register`

Đăng ký tài khoản mới.

**Request Body**:

```json
{
  "username": "newuser",
  "password": "password123"
}
```

**Response** (201):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 2,
    "username": "newuser",
    "created_at": "2026-05-27T10:00:00.000Z"
  }
}
```

**Error**:

- 400: Thiếu username hoặc password
- 409: Username đã tồn tại

---

### `POST /login`

Đăng nhập với username và password.

**Request Body**:

```json
{
  "username": "hoang",
  "password": "1"
}
```

**Response** (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "hoang"
  }
}
```

**Error**:

- 400: Thiếu username hoặc password
- 401: Sai username hoặc password

---

### `PUT /changePassword`

Đổi mật khẩu.

**Request Body**:

```json
{
  "username": "hoang",
  "oldPassword": "oldpass",
  "newPassword": "newpass"
}
```

**Response** (200):

```json
{
  "id": 1,
  "username": "hoang"
}
```

**Error**:

- 400: Thiếu thông tin
- 401: Sai username hoặc password

---

## 2. Conversation & Messages

### `GET /conversation/messages`

Lấy tin nhắn của một conversation.

**Headers**:

```
Authorization: Bearer <token>
```

**Query Parameters**:
| Param | Type | Mô tả |
|-------|------|-------|
| `conversation_id` | integer | ID của conversation |

**Example**:

```
GET /conversation/messages?conversation_id=1
```

**Response** (200):

```json
[
  {
    "id": 1,
    "content": "Chào bạn",
    "created_at": "2026-05-21T03:30:00.000Z",
    "username": "hoang",
    "avatar_url": null
  }
]
```

**Error**:

- 404: Không tìm thấy user
- 500: Lỗi lấy tin nhắn

---

### `POST /conversation/:id/postMessage`

Gửi tin nhắn mới vào conversation.

**Path Parameters**:
| Param | Type | Mô tả |
|-------|------|-------|
| `id` | integer | ID của conversation |

**Request Body**:

```json
{
  "content": "Hello world!"
}
```

**Response** (200):

```json
{
  "id": 10,
  "content": "Hello world!",
  "created_at": "2026-05-27T10:05:00.000Z",
  "username": "hoang",
  "avatar_url": null
}
```

**Ghi chú**: Backend cũng sẽ emit event Socket.io `receive_message` tới tất cả clients (kể cả sender) sau khi insert thành công.

**Error**:

- 401: Không tìm thấy user
- 500: Lỗi post tin nhắn

---

## 3. Profile (cần auth)

### `GET /profile`

Kiểm tra token và lấy thông tin user.

**Headers**:

```
Authorization: Bearer <token>
```

**Response** (200):

```json
{
  "message": "Đăng nhập thành công",
  "user": {
    "userId": 1,
    "username": "hoang",
    "iat": 1711111111,
    "exp": 1711715911
  }
}
```

**Error**:

- 401: Không có token hoặc Token không hợp lệ

---

## 4. Health Check

### `GET /`

Kiểm tra kết nối database.

**Response** (200):

```json
[
  {
    "now": "2026-05-27T10:00:00.000Z"
  }
]
```

**Error**: 500 nếu database lỗi

---

## ⚠️ Rate Limiting

- Giới hạn: **120 requests / 60 giây**
- Vượt quá sẽ nhận response: `429 Too Many Requests`"
