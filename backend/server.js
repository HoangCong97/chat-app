require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const pool = require("./db");
const rateLimit = require("express-rate-limit");

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
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `
            INSERT INTO users (username, password_hash)
            VALUES ($1, $2)
            RETURNING id, username
            `,
      [username, hash],
    );
    res.json(result.rows[0]);
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

    user = checkValidUser(username, oldPassword);
    if (user === null) {
      return res.status(401).json({
        error: "Sai username hoặc password",
      });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      `
            UPDATE INTO users (password_hash)
            VALUES ($1)
            WHERE id = $2
            RETURNING id, username
            `,
      [password_hash, user.id],
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

    if (checkValidUser(username, password) === false) {
      return res.status(401).json({
        error: "Sai username hoặc password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
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
  const bcrypt = require("bcrypt");
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

const jwt = require("jsonwebtoken");

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

app.get("/conversation/messages", async (req, res) => {
  try {
    const conversationId = req.query.conversation_id;
    const username = req.query.username;

    const user = await pool.query(
      `SELECT * from users
      WHERE username = $1`,
      [username],
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        error: "Không tìm thấy user",
      });
    }

    const result = await pool.query(
      `
      SELECT
        messages.id,
        messages.content,
        messages.created_at,
        users.username,
        users.avatar_url
      FROM messages
      JOIN users
      ON messages.sender_id = users.id
      WHERE messages.conversation_id = $1
      ORDER BY messages.created_at ASC
      LIMIT 100
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

app.post("/conversation/:id/postMessage", async (req, res) => {
  try {
    const conversationId = req.params.id;

    const { username, content } = req.body;

    const user = await pool.query(
      `
      SELECT *
      FROM users
      WHERE username = $1
      `,
      [username],
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        error: "Không tìm thấy user",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO messages (
        conversation_id,
        sender_id,
        content
      )
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [conversationId, user.rows[0].id, content],
    );

    const message = await pool.query(
      `
      SELECT
        messages.id,
        messages.content,
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

    io.broadcast.emit("receive_message", message.rows[0]);

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
