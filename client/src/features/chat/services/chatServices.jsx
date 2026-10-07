const API_URL = "http://localhost:5000/api";

export const getConversationsServices = async () => {
  const response = await fetch(`${API_URL}/conversations`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch conversations");
  }

  return data.getUserConversations;
};

export const createConversationServices = async (title = "New Chat") => {
  const response = await fetch(`${API_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      title,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create conversation");
  }

  return data.conversation;
};

export const getMessagesServices = async (conversationId) => {
  const response = await fetch(
    `${API_URL}/messages/conversations/${conversationId}`,
    {
      credentials: "include",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch messages");
  }

  return data.messages;
};
export const sendMessageServices = async (
  conversationId,
  content
) => {
  const response = await fetch(`${API_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      conversationId,
      content,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Failed to send message"
    );
  }

  return data;
};

export const logoutServices = async () => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to logout");
  }

  return data;
};