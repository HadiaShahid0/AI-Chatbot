import { useEffect, useRef } from "react";
import {
  FiUser,
  FiStar,
  FiCode,
  FiBookOpen,
  FiHelpCircle,
} from "react-icons/fi";
import ReactMarkdown from "react-markdown";

const MessageList = ({ messages, loading }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  if (messages.length === 0) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="welcome-ai-icon">
            <FiStar size={30} />
          </div>

          <div className="welcome-badge">
            <span />
            AI Assistant
          </div>

          <h1>
            How can I help
            <span> you today?</span>
          </h1>

          <p>
            Ask questions, solve problems, explain concepts, or get help with
            your code.
          </p>

          <div className="suggestion-grid">
            <button type="button" className="suggestion-card">
              <div className="suggestion-icon">
                <FiBookOpen size={19} />
              </div>

              <div>
                <strong>Explain a concept</strong>

                <span>Explain JWT in simple English</span>
              </div>
            </button>

            <button type="button" className="suggestion-card">
              <div className="suggestion-icon">
                <FiCode size={19} />
              </div>

              <div>
                <strong>Help with code</strong>

                <span>How do React protected routes work?</span>
              </div>
            </button>

            <button type="button" className="suggestion-card">
              <div className="suggestion-icon">
                <FiHelpCircle size={19} />
              </div>

              <div>
                <strong>Debug an issue</strong>

                <span>Why is my API returning 401?</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-scroll">
      <div className="messages-content">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={`message-row ${
                isUser ? "user-message-row" : "assistant-message-row"
              }`}
            >
              <div
                className={`message-avatar ${
                  isUser ? "user-avatar" : "assistant-avatar"
                }`}
              >
                {isUser ? <FiUser size={17} /> : <FiStar size={17} />}
              </div>

              <div className="message-body">
                <div className="message-meta">
                  <strong>{isUser ? "You" : "AI Assistant"}</strong>

                  {!isUser && <span>AI</span>}
                </div>

                <div
                  className={`message-bubble ${
                    isUser ? "user-bubble" : "assistant-bubble"
                  }`}
                >
                  {isUser ? (
                    message.content
                  ) : (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="message-row assistant-message-row">
            <div className="message-avatar assistant-avatar">
              <FiStar size={17} />
            </div>

            <div className="message-body">
              <div className="message-meta">
                <strong>AI Assistant</strong>
                <span>AI</span>
              </div>

              <div className="typing-bubble">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MessageList;
