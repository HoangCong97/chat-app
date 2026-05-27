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

  const API = import.meta.env.VITE_API_URL;

  const [messages, setMessages] = useState([]);
  const [conversationName, setConversationName] = useState("Công Message");
  const [username, setUsername] = useState(sessionStorage.getItem("username"));
  const [inputMessage, setInputMessage] = useState("");
  const textareaRef = useRef(null);

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
    getConversation();
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

  const updateUsername = (username) => {
    setUsername(username);
    sessionStorage.setItem("username", username);
  };

  const getConversation = async () => {
    try {
      var api = API + "/conversation/messages";
      console.log("API: " + API);
      const res = await axios.get(api, {
        params: {
          conversation_id: 1,
          username: username,
        },
      });
      setMessages(res.data);
    } catch (error) {}
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

  const createMessageCache = (content) => {
    const created_at = new Date().toISOString();
    const msg = {
      id: Date.now(),
      content: content,
      created_at: created_at,
      username: username,
      avatar_url: "https://example.com/avatar1.png",
    };
    return msg;
  };

  const postMessage = async () => {
    try {
      if (inputMessage.trim() === "") return;
      var api = API + "/conversation/1/postMessage";
      var content = inputMessage;
      setMessages([...messages, createMessageCache(content)]);
      setInputMessage("");
      textareaRef.current.focus();
      const res = await axios.post(api, {
        username,
        content,
      });
    } catch (error) {}
  };

  return (
    <div className="conversation-container">
      <div className="conversation-header">
        <div className="conversation-header-name">{conversationName}</div>
        <input
          className="conversation-header-username"
          placeholder="Nhập single id"
          value={username}
          onChange={(e) => updateUsername(e.target.value)}
          onBlur={(e) => updateUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateUsername(e.target.value);
            }
          }}
        />
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
            <div className="message-me">
              <span className="conversation-messageBox-username">
                {message.username}
              </span>
              <p className="conversation-messageBox-content">
                {message.content}
              </p>
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
        <textarea
          className="input-form"
          ref={textareaRef}
          value={inputMessage}
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
        >
          Gửi
        </button>
      </div>
    </div>
  );
}

export default App;
