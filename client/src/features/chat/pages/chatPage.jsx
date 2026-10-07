import { useEffect, useState } from "react";

import {
  getConversationsServices,
  createConversationServices,
  getMessagesServices,
  sendMessageServices,
  logoutServices,
} from "../services/chatServices";

import ChatSidebar from "../components/chatSidebar";
import MessageList from "../components/messageList";
import MessageInput from "../components/messageInput";

import "./chatPage.css";

const ChatPage = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);
  const handleLogout = async () => {
    try {
      await logoutServices();

      // Redirect to login
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const loadConversations = async () => {
    try {
      const data = await getConversationsServices();

      setConversations(data);

      if (data.length > 0) {
        setActiveConversationId(data[0].id);

        await loadMessages(data[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const data = await getMessagesServices(conversationId);

      setMessages(data);
    } catch (error) {
      console.error(error);
      setMessages([]);
    }
  };

  const handleNewChat = async () => {
    try {
      const conversation = await createConversationServices();

      setConversations((previous) => [conversation, ...previous]);

      setActiveConversationId(conversation.id);
      setMessages([]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectConversation = async (conversationId) => {
    setActiveConversationId(conversationId);

    await loadMessages(conversationId);

  };

  const handleSendMessage = async (content) => {
    if (!content.trim() || !activeConversationId || loading) {
      return;
    }

    const userContent = content.trim();

    const temporaryUserMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userContent,
    };

    setMessages((previous) => [...previous, temporaryUserMessage]);

    setLoading(true);

    try {
      const data = await sendMessageServices(activeConversationId, userContent);

      setMessages((previous) => {
        const withoutTemporary = previous.filter(
          (message) => message.id !== temporaryUserMessage.id,
        );

        return [...withoutTemporary, data.userMessage, data.assistantMessage];
      });
    } catch (error) {
      console.error(error);

      setMessages((previous) =>
        previous.filter((message) => message.id !== temporaryUserMessage.id),
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="chat-loading vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="ai-loading-icon mb-3">✦</div>

          <div className="spinner-border text-primary mb-3" />

          <p className="text-muted mb-0">Preparing your AI workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
      />

      <main className="chat-main">
        <div className="chat-messages">
          <MessageList messages={messages} loading={loading} />
        </div>

        <MessageInput onSend={handleSendMessage} disabled={loading} />
      </main>
    </div>
  );
};

export default ChatPage;
