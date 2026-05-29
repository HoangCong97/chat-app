# 🐚 Curl Examples for API Testing

> Các câu lệnh curl để test nhanh tất cả API endpoints.
> Base URL mặc định: `http://localhost:5000`

---

## 1. Health Check

```bash
curl -X GET http://localhost:5000/
```

---

## 2. Lấy danh sách users

```bash
curl -X GET http://localhost:5000/users
```

---

## 3. Đăng ký user mới

```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "test123"}'
```

---

## 4. Đăng nhập

```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "hoang", "password": "1"}'
```

---

## 5. Đổi mật khẩu

```bash
curl -X PUT http://localhost:5000/changePassword \
  -H "Content-Type: application/json" \
  -d '{"username": "hoang", "oldPassword": "1", "newPassword": "2"}'
```

---

## 6. Lấy profile (cần token)

```bash
curl -X GET http://localhost:5000/profile \
  -H "Authorization: Bearer <TOKEN_HERE>"
```

_Thay `<TOKEN_HERE>` bằng token nhận được từ login/register._

---

## 7. Lấy tin nhắn của conversation

```bash
curl -X GET "http://localhost:5000/conversation/messages?conversation_id=1" \
  -H "Authorization: Bearer <TOKEN_HERE>"
```

---

## 8. Gửi tin nhắn mới (text)

```bash
curl -X POST http://localhost:5000/conversation/1/postMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_HERE>" \
  -d '{"type": "text", "content": "Hello từ curl!"}'
```

---

## 9. Upload ảnh

```bash
curl -X POST http://localhost:5000/upload \
  -H "Authorization: Bearer <TOKEN_HERE>" \
  -F "image=@/path/to/your/image.png"
```

_Thay `/path/to/your/image.png` bằng đường dẫn tới file ảnh thật._

Response:
```json
{"image_url": "/uploads/1717000000000-123456789.png"}
```

---

## 10. Gửi tin nhắn ảnh

```bash
curl -X POST http://localhost:5000/conversation/1/postMessage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_HERE>" \
  -d '{"type": "image", "image_url": "/uploads/1717000000000-123456789.png", "content": "Ảnh nè!"}'
```

> `content` là optional, có thể để `null` nếu không cần caption.

---

## 🔄 Tiện ích: Tự động lấy token và dùng trong script

```bash
#!/bin/bash
# Lưu token từ login
TOKEN=$(curl -s -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "hoang", "password": "1"}' | jq -r '.token')

echo "Token: $TOKEN"

# Gọi profile với token
curl -s -X GET http://localhost:5000/profile \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 🧪 Test bằng file .rest (VS Code REST Client)

Nếu dùng VS Code với extension "REST Client", có thể dùng file `test/test.rest` có sẵn.

Mở file đó và nhấn "Send Request" cho từng endpoint.

---

## 📝 Ghi chú

- Thay đổi `localhost:5000` thành URL thật nếu cần (ví dụ: `https://chat-app-7vt9.onrender.com`)
- Dùng `jq` để format JSON output: `curl ... | jq .`
- Nếu không có jq, có thể dùng `python -m json.tool`: `curl ... | python -m json.tool`
