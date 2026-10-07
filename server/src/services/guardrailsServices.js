export const validateUserInputService = (content) => {
  if (!content || !content.trim()) {
    throw new Error("Message cannot be empty.");
  }

  if (content.length > 100) {
    throw new Error(
      "Message is too long. Please keep it under 100 characters.",
    );
  }

  return true;
};

export const validateAIInputService = (response) => {
  if (!response || !response.trim()) {
    return "Sorry, I could not generate a response.";
  }

  if (response.length > 50) {
    return response.slice(0, 50);
  }

  return response;
};
