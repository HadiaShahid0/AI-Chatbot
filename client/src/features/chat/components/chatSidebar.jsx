import {
  FiPlus,
  FiMessageSquare,
  FiStar,
  FiChevronRight,
  FiLogOut,
} from "react-icons/fi";

const ChatSidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onLogout,
}) => {
  return (
    <aside className="chat-sidebar">
      <div className="sidebar-brand">
        <div className="brand-left">
          <div className="brand-icon">
            <FiStar size={19} />
          </div>

          <div>
            <h5>AI Chat</h5>
            <small>Your AI workspace</small>
          </div>
        </div>
      </div>

      <div className="new-chat-wrapper">
        <button type="button" className="new-chat-btn" onClick={onNewChat}>
          <span className="new-chat-icon">
            <FiPlus size={18} />
          </span>

          <span>New conversation</span>

          <FiChevronRight size={17} className="ms-auto" />
        </button>
      </div>

      <div className="conversation-area">
        <div className="conversation-heading">
          <span>Recent conversations</span>

          <span className="conversation-count">{conversations.length}</span>
        </div>

        <div className="conversation-list">
          {conversations.length === 0 ? (
            <div className="empty-conversations">
              <div className="empty-icon">
                <FiMessageSquare size={23} />
              </div>

              <h6>No conversations</h6>

              <p>Start a new conversation with your AI assistant.</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`conversation-item ${
                  activeConversationId === conversation.id ? "active" : ""
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <span className="conversation-icon">
                  <FiMessageSquare size={16} />
                </span>

                <span className="conversation-title">
                  {conversation.title || "New Chat"}
                </span>

                {activeConversationId === conversation.id && (
                  <FiChevronRight size={15} className="conversation-arrow" />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="assistant-status">
          <div className="assistant-status-icon">
            <FiStar size={16} />
          </div>

          <div className="assistant-status-text">
            <strong>AI Assistant</strong>

            <span>
              <i />
              Ready to help
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-light w-100 d-flex align-items-center gap-2 text-danger text-start border-0"
          onClick={onLogout}
        >
          <FiLogOut size={17} />

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
