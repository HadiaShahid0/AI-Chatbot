export const validateUserInputService = (content) => {
  if (!content || !content.trim()) {
    throw new Error("Message cannot be empty.");
  }

  if (content.length > 1000) {
    throw new Error(
      "Message is too long. Please keep it under 100 characters.",
    );
  }

  return true;
};

export const MAX_AI_RESPONSE_LENGTH = 4000;

export const validateAIInputService = (response) => {
  if (typeof response !== "string" || !response.trim()) {
    return "Sorry, I could not generate a response.";
  }

  if (response.length > MAX_AI_RESPONSE_LENGTH) {
    return response.slice(0, MAX_AI_RESPONSE_LENGTH);
  }

  return response;
};