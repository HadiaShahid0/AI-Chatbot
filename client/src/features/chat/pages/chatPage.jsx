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

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const conversations = await getConversationsServices();

      setConversations(conversations);

      if (conversations.length > 0) {
        setActiveConversationId(conversations[0].id);

        await loadMessages(conversations[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const messages = await getMessagesServices(conversationId);

      console.log("Loaded messages:", messages);

      setMessages(messages);
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

  const handleSendMessage = async (content, file) => {
    if ((!content.trim() && !file) || !activeConversationId || loading) {
      return;
    }
    const userContent = content.trim();
    const conversationId = activeConversationId;

    const userMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userContent,
      file: file || null,
      fileName: file?.name || null,
      fileType: file?.type || null,
    };

    const assistantMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
    };
    setMessages((previous) => [...previous, userMessage, assistantMessage]);

    setLoading(true);

    try {
      await sendMessageServices(
        activeConversationId,
        userContent,
        file,
        (chunk) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessage.id
                ? {
                    ...message,
                    content: message.content + chunk,
                  }
                : message,
            ),
          );
        },
      );
      const savedMessages = await getMessagesServices(activeConversationId);
      
      if (conversationId === activeConversationId) {
        setMessages(savedMessages);
      }
    } catch (error) {
      console.error("Send message error:", error);

      setMessages((prev) =>
        prev.filter(
          (message) =>
            message.id !== userMessage.id && message.id !== assistantMessage.id,
        ),
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
