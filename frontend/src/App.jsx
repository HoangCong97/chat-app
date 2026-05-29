import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./App.css";
import { io } from "socket.io-client";
import { socket } from "./socket";

function App() {
  const firstLoadRef = useRef(true);
  const messageEndRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messageContainerRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const fileInputRef = useRef(null);

  const API = import.meta.env.VITE_API_URL;

  const [messages, setMessages] = useState([]);
  const [conversationName, setConversationName] = useState("Công Message");
  const [username, setUsername] = useState(sessionStorage.getItem("username"));
  const [inputMessage, setInputMessage] = useState("");
  const textareaRef = useRef(null);

  // Image upload state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUsername, setModalUsername] = useState("");
  const [modalPassword, setModalPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // socket
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected");
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  useEffect(() => {
    const handler = (message) => {
      if (message.username !== username)
        setMessages((prev) => [...prev, message]);
    };

    socket.on("receive_message", handler);

    return () => {
      socket.off("receive_message", handler);
    };
  }, [username]);

  // first time
  useEffect(() => {
    if (firstLoadRef.current === true && messages.length > 0) {
      firstLoadRef.current = false;
      messageEndRef.current?.scrollIntoView();
    }
  }, [messages]);

  // Change account
  useEffect(() => {
    if (username) {
      getConversation();
    }
  }, [username]);

  // Auto scroll
  useEffect(() => {
    if (messages.length === 0) return;

    if (isAtBottom() !== true) return;

    const lastMessage = messages[messages.length - 1];

    if (lastMessage.id !== lastMessageIdRef.current) {
      messageEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
      lastMessageIdRef.current = lastMessage.id;
    }
  }, [messages]);

  // Reset textarea height when inputMessage is cleared
  useEffect(() => {
    if (inputMessage === "" && textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
  }, [inputMessage]);

  const updateUsername = (username) => {
    setUsername(username);
    sessionStorage.setItem("username", username);
  };

  const getConversation = async () => {
    try {
      var api = API + "/conversation/messages";
      const token = sessionStorage.getItem("token");
      const res = await axios.get(api, {
        params: {
          conversation_id: 1,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const scrollDown = async () => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const isAtBottom = () => {
    const container = messageContainerRef.current;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < 200) {
      return true;
    } else {
      return false;
    }
  };

  const handleScroll = () => {
    if (isAtBottom() === true) {
      setShowScrollButton(false);
    } else {
      setShowScrollButton(true);
    }
  };

  const handleTextareaChange = () => {
    const textarea = textareaRef.current;
    textarea.style.height = "40px";
    const height = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = height + 2 + "px";
  };

  // ========== Image Upload Handlers ==========

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Chỉ chấp nhận file ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File quá lớn, tối đa 5MB");
      return;
    }

    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ========== Message Helpers ==========

  const createMessageCache = (content, messageType = "text", imageUrl = null) => {
    const created_at = new Date().toISOString();
    const msg = {
      id: Date.now(), // temporary client-side id
      content: content || null,
      created_at: created_at,
      username: username,
      avatar_url: null,
      message_type: messageType,
      image_url: imageUrl,
      _optimistic: true,
    };
    return msg;
  };

  const handleLogin = async () => {
    if (modalUsername.trim() === "") return;
    setLoginError("");
    try {
      const api = API + "/login";
      const res = await axios.post(api, {
        username: modalUsername.trim(),
        password: modalPassword,
      });
      // Success
      const token = res.data.token;
      sessionStorage.setItem("token", token);
      updateUsername(modalUsername.trim());
      setModalOpen(false);
      setModalPassword("");
      setLoginError("");
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          setLoginError("Đăng nhập thất bại, vui lòng thử lại");
        }
      } else {
        setLoginError("Không thể kết nối đến máy chủ");
      }
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalUsername("");
    setModalPassword("");
  };

  const postMessage = async () => {
    try {
      const hasText = inputMessage.trim() !== "";
      const hasImage = selectedImage !== null;

      if (!hasText && !hasImage) return;

      const token = sessionStorage.getItem("token");
      if (!token) {
        setModalOpen(true);
        return;
      }

      let messageType = "text";
      let imageUrl = null;

      // Step 1: Upload image first if selected
      if (hasImage) {
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append("image", selectedImage);
          const uploadRes = await axios.post(API + "/upload", formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
          imageUrl = uploadRes.data.image_url;
          messageType = "image";
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr);
          alert("Upload ảnh thất bại, vui lòng thử lại");
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      const content = inputMessage.trim() || null;

      // Step 2: Add optimistic message to UI immediately
      const optimisticMsg = createMessageCache(content, messageType, imageUrl);
      setMessages((prev) => [...prev, optimisticMsg]);

      // Clear inputs
      setInputMessage("");
      clearImage();
      textareaRef.current?.focus();

      // Step 3: Send message to server
      const api = API + "/conversation/1/postMessage";
      const res = await axios.post(
        api,
        {
          content: content,
          type: messageType,
          image_url: imageUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Step 4: Replace optimistic message with real server response
      const realMsg = res.data;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMsg.id ? { ...realMsg, _optimistic: false } : m,
        ),
      );
    } catch (error) {
      console.error("postMessage failed:", error);
      setIsUploading(false);
    }
  };

  return (
    <div className="conversation-container">
      <div className="conversation-header">
        <div className="conversation-header-name">{conversationName}</div>
        <button
          className="conversation-header-login"
          onClick={() => {
            setModalOpen(true);
            setLoginError("");
          }}
        >
          {username ? username : "Đăng nhập"}
        </button>

        {modalOpen && (
          <div className="login-container">
            <div className="login-form">
              <h3>Đăng nhập</h3>
              <input
                type="text"
                placeholder="Single id"
                value={modalUsername}
                onChange={(e) => setModalUsername(e.target.value)}
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={modalPassword}
                onChange={(e) => setModalPassword(e.target.value)}
              />
              {loginError && <span className="login-error">{loginError}</span>}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "flex-end",
                }}
              >
                <button onClick={handleLogin}>Đăng nhập</button>
                <button onClick={handleCloseModal}>Đóng</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        className="conversation-body"
        ref={messageContainerRef}
        onScroll={handleScroll}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.username === username ? "me" : "other"}`}
          >
            <div
              className={`message-${message.username === username ? "me" : "other"}`}
            >
              <span className="conversation-messageBox-username">
                {message.username}
              </span>

              {/* Render image if message_type is "image" */}
              {message.message_type === "image" && message.image_url && (
                <img
                  className="message-image"
                  src={API + message.image_url}
                  alt="Shared image"
                  loading="lazy"
                  onClick={(e) => {
                    // Toggle full size on click
                    e.currentTarget.classList.toggle("message-image--expanded");
                  }}
                />
              )}

              {/* Render text content */}
              {message.content && (
                <p className="conversation-messageBox-content">
                  {message.content}
                </p>
              )}

              {/* Show sending indicator for optimistic messages */}
              {message._optimistic && (
                <span className="message-sending">Đang gửi...</span>
              )}
            </div>
          </div>
        ))}
        {showScrollButton && (
          <button className="scroll-down-btn" onClick={scrollDown}>
            ↓
          </button>
        )}
        <div ref={messageEndRef}></div>
      </div>
      <div className="conversation-input">
        {/* Image preview */}
        {imagePreviewUrl && (
          <div className="image-preview-container">
            <img src={imagePreviewUrl} alt="Preview" className="image-preview" />
            <button
              className="image-preview-remove"
              onClick={clearImage}
              title="Xóa ảnh"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageSelect}
        />

        {/* Upload button */}
        <button
          className="input-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Gửi ảnh"
        >
          {isUploading ? "⏳" : "🖼️"}
        </button>

        <textarea
          className="input-form"
          ref={textareaRef}
          value={inputMessage}
          placeholder={selectedImage ? "Thêm chú thích (tùy chọn)..." : "Nhập tin nhắn..."}
          onChange={(e) => {
            setInputMessage(e.target.value);
            handleTextareaChange();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              postMessage(e);
              e.target.value = "";
              handleTextareaChange();
            }
          }}
        ></textarea>
        <button
          className="input-sent-btn"
          onClick={(e) => {
            e.preventDefault();
            postMessage(e);
            e.target.value = "";
            handleTextareaChange();
          }}
          disabled={isUploading}
        >
          {isUploading ? "..." : "Gửi"}
        </button>
      </div>
    </div>
  );
}

export default App;
