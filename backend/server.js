require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const pool = require("./db");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running... at port: " + PORT);
});

app.use(cors());
app.use(express.json());

// ========== Multer Config for Image Upload ==========
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (image/*)"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Serve uploaded images statically
app.use("/uploads", express.static(uploadsDir));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: "Too many requests",
});

app.use(limiter);

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server error",
    });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Thiếu username hoặc password" });
    }
    // Check if username already exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Username đã tồn tại" });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `
      INSERT INTO users (username, password_hash)
      VALUES ($1, $2)
      RETURNING id, username, created_at
      `,
      [username, hash],
    );
    const token = jwt.sign(
      { userId: result.rows[0].id, username: result.rows[0].username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.status(201).json({
      token,
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server error",
    });
  }
});

app.put("/changePassword", async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ error: "Thiếu thông tin" });
    }
    const user = await checkValidUser(username, oldPassword);
    if (!user) {
      return res.status(401).json({
        error: "Sai username hoặc password",
      });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
      RETURNING id, username
      `,
      [hash, user.id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server error",
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Thiếu username hoặc password" });
    }
    const user = await checkValidUser(username, password);
    if (!user) {
      return res.status(401).json({
        error: "Sai username hoặc password",
      });
    }
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server error",
    });
  }
});

async function checkValidUser(username, password) {
  const result = await pool.query(`SELECT * FROM users where username = $1`, [
    username,
  ]);

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    return null;
  }
  return user;
}

function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Không có token",
      });
    }

    const token = authHeader.split(" ")[1];

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = payload;

    next();
  } catch (err) {
    res.status(401).json({
      error: "Token không hợp lệ",
    });
  }
}

app.get("/profile", auth, async (req, res) => {
  res.json({
    message: "Đăng nhập thành công",
    user: req.user,
  });
});

app.get("/conversation/messages", auth, async (req, res) => {
  try {
    const conversationId = req.query.conversation_id;

    if (!conversationId) {
      return res.status(400).json({
        error: "Thiếu conversation_id",
      });
    }

    const result = await pool.query(
      `
      SELECT * FROM (
        SELECT
          messages.id,
          messages.content,
          messages.message_type,
          messages.image_url,
          messages.created_at,
          users.username,
          users.avatar_url
        FROM messages
        JOIN users
        ON messages.sender_id = users.id
        WHERE messages.conversation_id = $1
        ORDER BY messages.created_at DESC
        LIMIT 100)
      AS latest_messages
      ORDER BY created_at ASC
      `,
      [conversationId],
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Lỗi lấy tin nhắn",
    });
  }
});

// ========== Image Upload ==========
app.post("/upload", auth, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File quá lớn, tối đa 5MB" });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Thiếu file ảnh" });
    }

    const imageUrl = "/uploads/" + req.file.filename;
    res.json({ image_url: imageUrl });
  });
});

app.post("/conversation/:id/postMessage", auth, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { content, type, image_url } = req.body;
    const messageType = type || "text";

    // Validate: text messages need content, image messages need image_url
    if (messageType === "text" && (!content || content.trim() === "")) {
      return res.status(400).json({
        error: "Thiếu nội dung tin nhắn",
      });
    }
    if (messageType === "image" && !image_url) {
      return res.status(400).json({
        error: "Thiếu image_url cho tin nhắn ảnh",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO messages (
        conversation_id,
        sender_id,
        content,
        message_type,
        image_url
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [conversationId, req.user.userId, content || null, messageType, image_url || null],
    );

    const message = await pool.query(
      `
      SELECT
        messages.id,
        messages.content,
        messages.message_type,
        messages.image_url,
        messages.created_at,
        users.username,
        users.avatar_url
      FROM messages
      JOIN users
      ON messages.sender_id = users.id
      WHERE messages.id = $1
      `,
      [result.rows[0].id],
    );

    io.emit("receive_message", message.rows[0]);

    res.json(message.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Lỗi post tin nhắn",
    });
  }
});

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});
