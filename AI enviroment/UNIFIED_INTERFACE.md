"# 🎯 AI Unified Interface - Web02_Messenger

> Entry point dành cho AI để tương tác với toàn bộ hệ thống (Backend ↔ Frontend)

## Cấu trúc thư mục AI enviroment

```
AI enviroment/
├── PROJECT_STRUCTURE.md          # Tổng quan project (đã có)
├── UNIFIED_INTERFACE.md          # THIS FILE - Entry point chính
├── API_ENDPOINTS.md              # Chi tiết tất cả REST API endpoints
├── SOCKET_EVENTS.md              # Chi tiết tất cả Socket.io events
├── ai_client.js                  # JavaScript client helper (có thể import)
└── CURL_EXAMPLES.md             # Ví dụ curl để test nhanh
```

## 🧭 Cách sử dụng cho AI

### 1. Gọi REST API
- Đọc file `API_ENDPOINTS.md` để biết danh sách đầy đủ endpoints
- Sử dụng `ai_client.js` để gọi API nhanh (nếu dùng Node.js environment)
- Hoặc dùng curl commands từ `CURL_EXAMPLES.md`

### 2. Giao tiếp real-time (Socket.io)
- Đọc file `SOCKET_EVENTS.md` để biết events và payload
- Backend lắng nghe ở `http://localhost:5000` (hoặc biến PORT từ .env)
- Frontend kết nối qua `socket.io-client`

### 3. Luồng cơ bản (AI cần biết)
```
[AI] → POST /register (tạo user + JWT token)
    ↓
[AI] → POST /login   (đăng nhập lấy token mới)
    ↓
[AI] → Lưu token vào Authorization header cho các request sau
    ↓
[AI] → GET /conversation/messages?conversation_id=1&username=...
    ↓
[AI] → POST /conversation/1/postMessage (gửi tin nhắn mới)
    ↓
[AI] → Socket.io nhận `receive_message` event real-time
```

### 4. Authentication
- Backend hỗ trợ JWT bearer token
- Gửi header: `Authorization: Bearer <token>`
- Token có hạn 7 ngày
- Một số endpoints public (register, login) không cần token

### 5. Kết nối nhanh
```javascript
// Nếu có quyền chạy Node.js
const aiClient = require('./AI enviroment/ai_client');
// Hoặc ES module:
// import aiClient from './AI enviroment/ai_client.js';

// Gọi API
const users = await aiClient.getUsers();
console.log(users);

// Gửi tin nhắn
const result = await aiClient.postMessage(1, 'myUser', 'Hello AI!');
```

---

## 🔗 Liên kết nhanh

| File | Mô tả |
|------|-------|
| [API_ENDPOINTS.md](./API_ENDPOINTS.md) | 📡 Tất cả REST endpoints |
| [SOCKET_EVENTS.md](./SOCKET_EVENTS.md) | 🔌 Socket.io events chi tiết |
| [ai_client.js](./ai_client.js) | 🤖 JavaScript helper module |
| [CURL_EXAMPLES.md](./CURL_EXAMPLES.md) | 🐚 Curl commands mẫu |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | 📁 Cấu trúc project tổng quan |

---

## 📌 QUY TẮC BẮT BUỘC DÀNH CHO AI

Khi thực hiện bất kì thay đổi nào ở **backend**, **frontend** hoặc **database**, AI phải CẬP NHẬT các file trong thư mục `AI enviroment/` để phản ánh trạng thái mới.

### 🔄 Cập nhật file nào?

| Hành động thay đổi | File cần cập nhật |
|-----------------------|------------------------|
| Thêm / sửa / xóa REST API endpoint | `API_ENDPOINTS.md` |
| Thêm / sửa / xóa Socket.io event | `SOCKET_EVENTS.md` |
| Thêm / sửa / xóa file trong project | `PROJECT_STRUCTURE.md` (mục Structure) |
| Thay đổi công nghệ / dependencies | `PROJECT_STRUCTURE.md` (mục Technology Stack) |
| Thay đổi database schema | `PROJECT_STRUCTURE.md` (mục Database Schema) |
| Thay đổi cách chạy project | `PROJECT_STRUCTURE.md` (mục How to Run) |
| Thay đổi imports / exports trong `ai_client.js` | `ai_client.js` + `API_ENDPOINTS.md` |
| Thêm / sửa / xóa curl examples | `CURL_EXAMPLES.md` |
| Bất kì thay đổi lớn nào | Cập nhật `PROJECT_STRUCTURE.md` phần "Known Issues" / "Implementation Status" |

### ✅ Kiểm tra sau mỗi lần sửa

Sau khi thay đổi code, AI phải tự động:
1. Rà soát lại tất cả các file trong `AI enviroment/`
2. Cập nhật những file bị ảnh hưởng bởi thay đổi
3. Nếu có file mới tạo (vd thư mục, module mới), thêm vào `PROJECT_STRUCTURE.md`

> **Ví dụ**: Nếu AI thêm endpoint mới `DELETE /message/:id` vào `server.js`, thì phải thêm dòng tương ứng vào bảng trong `API_ENDPOINTS.md`; nếu có event socket mới, thêm vào `SOCKET_EVENTS.md`.

### 🚨 Lưu ý
- Không bao giờ chỉ sửa code mà quên cập nhật file mô tả.
- Nếu file mô tả không được cập nhật, lần AI sau sẽ dùng thông tin sai dẫn đến lỗi.
- Cập nhật cả `PROJECT_STRUCTURE.md` cho phần "Current Implementation Status" (Completed / In Progress / Not Implemented) để phản ánh trạng thái mới.

---

## 📌 Trạng thái hiện tại của project (tự động cập nhật bởi AI)

### Các thay đổi gần đây

- **Backend**: Đã thêm `bcrypt`, `jsonwebtoken`; thêm endpoints `/login`, `/profile`; sửa lỗi SQL tại `/changePassword`; sửa `io.emit` thành `io.broadcast.emit` khi nhận tin nhắn mới.
- **Frontend**: Thay input username trực tiếp bằng Login Modal (text + password); đổi class `conversation-header-username` thành `conversation-header-login`; chuyển socket URL về localhost.
- **Project Structure**: File `PROJECT_STRUCTURE.md` ở root đã được xóa; tất cả tài liệu tập trung vào thư mục `AI enviroment/`.
- **Known Issues đã fix**: SQL error `/changePassword`, thiếu `/login` endpoint.
- **Known Issues chưa fix**: Frontend không xử lý response sau `postMessage`, chưa có JWT token management trên frontend.

_(Phần này sẽ được AI cập nhật sau mỗi lần sửa code)_"