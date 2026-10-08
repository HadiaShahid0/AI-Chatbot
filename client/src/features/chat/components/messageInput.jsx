import { useState } from "react";
import { FiSend, FiPaperclip, FiX } from "react-icons/fi";

const MessageInput = ({ onSend, disabled }) => {
  const [content, setContent] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!content.trim() && !selectedFile) {
      return;
    }

    try {
      setLoading(true);
      await onSend(content, selectedFile);
      setContent("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Send message error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="input-section">
      <form className="message-input-wrapper" onSubmit={handleSubmit}>
        <input
          type="file"
          id="chat-file"
          className="d-none"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(event) => {
            const file = event.target.files[0];
            if (!file) {
              return;
            }
            setSelectedFile(file);
          }}
        />

        <label htmlFor="chat-file" className="btn btn-light">
          <FiPaperclip size={18} />
        </label>

        {selectedFile && (
          <div className="d-flex align-items-center gap-2 mb-2 p-2 border rounded">
            <span>{selectedFile.name}</span>

            <button
              type="button"
              className="btn btn-sm btn-light"
              onClick={() => setSelectedFile(null)}
            >
              <FiX size={16} />
            </button>
          </div>
        )}
        <textarea
          className="message-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows="1"
          disabled={disabled}
        />

        <button
          type="submit"
          className="send-message-btn"
          disabled={disabled || (!content.trim() && !selectedFile)}
        >
          <FiSend size={18} />
        </button>
      </form>

      <div className="input-footer">
        <span>
          Press <strong>Enter</strong> to send
        </span>

        <span>AI can make mistakes. Check important information.</span>
      </div>
    </div>
  );
};

export default MessageInput;
