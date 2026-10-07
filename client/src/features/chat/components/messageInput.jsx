import { useState } from "react";
import {
  FiSend,
  FiPaperclip,
} from "react-icons/fi";

const MessageInput = ({
  onSend,
  disabled,
}) => {
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() || disabled) {
      return;
    }

    const message = content.trim();

    setContent("");

    await onSend(message);
  };

  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="input-section">

      <form
        className="message-input-wrapper"
        onSubmit={handleSubmit}
      >
        <textarea
          className="message-textarea"
          value={content}
          onChange={(e) =>
            setContent(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows="1"
          disabled={disabled}
        />

        <button
          type="submit"
          className="send-message-btn"
          disabled={
            disabled || !content.trim()
          }
        >
          <FiSend size={18} />
        </button>

      </form>

      <div className="input-footer">
        <span>
          Press <strong>Enter</strong> to send
        </span>

        <span>
          AI can make mistakes. Check important
          information.
        </span>
      </div>

    </div>
  );
};

export default MessageInput;
