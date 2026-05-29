# 🔌 Socket.io Events Reference

> Server: `http://localhost:5000` (hoặc biến PORT)
> Client kết nối từ file `frontend/src/socket.js`

---

## 📥 Server → Client Events

### `connect`
Khi client kết nối thành công tới server.

**Payload**: Không có (tự động bởi Socket.io)

**Frontend handler**:
```javascript
socket.on("connect", () => {
  console.log("Connected to server");
});
```

---

### `receive_message`
Khi có tin nhắn mới được gửi vào conversation. Hỗ trợ cả text và ảnh.

**Payload (text message)**:
```json
{
  "id": 10,
  "content": "Hello world!",
  "message_type": "text",
  "image_url": null,
  "created_at": "2026-05-27T10:05:00.000Z",
  "username": "hoang",
  "avatar_url": null
}
```

**Payload (image message)**:
```json
{
  "id": 11,
  "content": null,
  "message_type": "image",
  "image_url": "/uploads/1717000000000-123456789.png",
  "created_at": "2026-05-28T10:05:00.000Z",
  "username": "hoang",
  "avatar_url": null
}
```

**Frontend handler** (từ App.jsx):
```javascript
useEffect(() => {
  const handler = (message) => {
    if (message.username !== username)
      setMessages((prev) => [...prev, message]);
  };
  socket.on("receive_message", handler);
  return () => socket.off("receive_message", handler);
}, [username]);
```

**Lưu ý**: Frontend hiện tại filter tin nhắn từ chính mình (tránh duplicate).

---

### `disconnect`
Khi client bị ngắt kết nối.

**Payload**: Không có (tự động bởi Socket.io)

---

## 📤 Client → Server Events

### (Chưa implement) `send_message`
Dự kiến client sẽ gửi event này để server xử lý và broadcast.

**Dự kiến payload**:
```json
{
  "conversation_id": 1,
  "username": "hoang",
  "content": "Hello!"
}
```

**Ghi chú**: Hiện tại frontend dùng REST API `POST /conversation/:id/postMessage` để gửi tin nhắn. Event này chưa được implement ở server.

---

## 🧪 Ví dụ Test với Node.js

```javascript
const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("receive_message", (message) => {
  console.log("New message:", message);
});

// Giữ kết nối mở
setTimeout(() => socket.close(), 30000);
```

---

## 🔄 Luồng dữ liệu hiện tại

```
[User A] → POST /conversation/1/postMessage
    ↓
[Backend] insert vào database → emit `receive_message` (io.emit → gửi cho tất cả)
    ↓
[User A] nhận event → bị filter bởi `message.username !== username` (tránh duplicate)
[User B] nhận event → thêm vào messages state
```

---

## 🚀 Event mở rộng (chưa implement)

Các event có thể thêm trong tương lai:

| Event | Direction | Mô tả |
|-------|-----------|-------|
| `typing` | Client→Server | User đang gõ |
| `stop_typing` | Client→Server | User dừng gõ |
| `user_online` | Server→Client | User online |
| `user_offline` | Server→Client | User offline |
| `message_read` | Client→Server | Đã đọc tin nhắn |