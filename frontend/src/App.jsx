import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const messageEndRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messageContainerRef = useRef(null);

  const API = "http://localhost:5000";
  const [messages, setMessages] = useState([]);
  const [conversationName, setConversationName] = useState("Công Message");
  const [username, setUsername] = useState(sessionStorage.getItem("username"));
  const [tempMessage, setTempMessage] = useState("");

  useEffect(() => {
    getConversation();
    const a = setInterval(() => getConversation(), 1000);
    return () => clearInterval(a);
  }, [username]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, []);

  const updateUsername = (username) => {
    setUsername(username);
    sessionStorage.setItem("username", username);
  };

  const getConversation = async () => {
    try {
      var api = API + "/conversation/1/messages";
      const res = await axios.get(api);
      setMessages(res.data);
    } catch (error) {}
  };

  const scrollDown = async () => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    const container = messageContainerRef.current;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom > 200) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  };

  const postMessage = async () => {
    try {
      const now = "2026-05-21T05:52:21.610Z";
      var api = API + "/conversation/1/postMessage";
      var content = tempMessage;
      var created_at = now;
      const res = await axios.post(api, {
        username,
        content,
      });
      setTempMessage("");
      await getConversation();
    } catch (error) {}
  };

  return (
    <div className="conversation-container">
      <div className="conversation-header">
        <div className="conversation-header-name">{conversationName}</div>
        <input
          className="conversation-header-name"
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
        className="message-container"
        ref={messageContainerRef}
        onScroll={handleScroll}
      >
        {messages.map((message) => (
          <div
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
          <button className="scroll-down" onClick={scrollDown}>
            ↓
          </button>
        )}
        <div ref={messageEndRef}></div>
      </div>
      <textarea
        className="conversation-input"
        value={tempMessage}
        onChange={(e) => setTempMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            postMessage();
          }
        }}
      ></textarea>
    </div>
  );
}

export default App;
