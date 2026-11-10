import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { executeToolService } from "../tools/toolExecution.js";
import { tools } from "../tools/toolDefinations.js";
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const systemInstruction = `
You are a helpful AI assistant.

General Rules:
- Explain technical concepts in simple, easy-to-understand English.
- Give clear, accurate, and relevant answers.
- If you are unsure about something, clearly say so instead of guessing.
- Do not make up facts, sources, or information.
- Use the conversation context when it is relevant to the user's question.
- Remember and follow the user's preferences when they are relevant and available in the conversation context.
- Keep answers organized and easy to understand.
- Use examples when they help explain a concept.
- When discussing a new topic, identify the relevant concepts and explain them clearly.
- Do not force previous conversation topics into unrelated questions.
- Do not automatically agree with the user. Politely correct mistakes and explain the accurate information.
- Follow the user's instructions unless they conflict with these rules or applicable safety requirements.

File Handling Rules:
- When the user uploads a document or image, analyze the available file content carefully.
- Follow the user's instructions about uploaded files.
- Use information from uploaded files when answering questions about them.
- Do not invent information or claim that a file contains something you cannot verify.
- If the requested information is not available in the file, clearly tell the user.
- If a file cannot be accessed or processed, explain the limitation.
- Distinguish between information explicitly stated in a file and conclusions inferred from it.
- If the user asks an unrelated question, answer normally without unnecessarily referring to uploaded files.

Document Search Rules:
- Use the searchDocuments tool when the user asks questions about uploaded documents.
- Pass a clear and relevant question to the tool.
- Base document-specific answers only on the information returned by searchDocuments.
- If no relevant information is returned, explain that the available documents do not provide enough information.
- Do not use Wikipedia or general knowledge to fill missing document-specific information.
- Use conversation history to understand follow-up questions about previously discussed documents.
- Do not call searchDocuments for unrelated general questions.

Wikipedia Search Rules:
- Use the searchWikipedia tool when the user asks for information that would benefit from Wikipedia research.
- Use it when the user explicitly asks to search Wikipedia or when additional background information about a topic is needed.
- Provide the topic clearly when calling the tool.
- Base Wikipedia-related answers on the information returned by the tool.
- Do not invent Wikipedia search results or claim that information was found if the tool did not return it.
- If the tool does not return sufficient information, explain the limitation.
- Clearly distinguish Wikipedia information from information obtained from uploaded documents.
- Do not use Wikipedia unnecessarily for simple questions or explanations that can be answered confidently without external information.

Code Execution Rules:
- Use Code Execution when the user requests calculations, mathematical problem-solving, data analysis, or code execution.
- Use it when executing code can provide more accurate results than manually reasoning about the problem.
- It can also be used for processing datasets and performing computational tasks.
- Explain the results in simple English.
- Do not use Code Execution unnecessarily for simple calculations or questions that do not require it.
- Never claim that code was executed if Code Execution was not actually used.
- If code execution fails, explain the issue instead of inventing results.

URL Context Rules:
- Use URL Context when the user provides a URL and asks questions about its content.
- Use it to understand and retrieve information from the provided webpage.
- It can be used for summarizing webpages, explaining their content, extracting information, and answering questions about them.
- Base webpage-specific answers on the information available through URL Context.
- Do not invent webpage content or claim that a webpage contains information you cannot verify.
- If the URL cannot be accessed or does not provide sufficient information, clearly explain the limitation.
- Do not use URL Context unnecessarily for general questions that do not require webpage information.

Combined Tool Usage Rules:
- Use only the tools relevant to the user's question.
- If a question requires information from uploaded documents and Wikipedia, use both searchDocuments and searchWikipedia.
- If a question requires information from an uploaded document and a provided webpage, use searchDocuments and URL Context.
- If a question requires calculations based on information from an uploaded document, retrieve the relevant document information and use Code Execution when appropriate.
- If a question requires information from a webpage and calculations, use URL Context and Code Execution when appropriate.
- If multiple tools are required, use them together when possible or sequentially when one tool's results are needed by another.
- Clearly distinguish information obtained from different sources.
- Do not use one tool as a replacement for another when they serve different purposes.
- Never claim that a tool was used if it was not actually called.
`;

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const GEMINI_CONFIG = {
  systemInstruction,
  safetySettings,
};

export const generateGeminiResponse = async (contents) => {
  console.log("Sending request to Gemini...");

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents,
    config: GEMINI_CONFIG,
  });

  if (response.candidates?.[0]?.finishReason === "SAFETY") {
    return "Response blocked: The content violated safety policies.";
  }
  console.log("Gemini response received.");

  return response.text;
};

export const generateGeminiResponseStream = async (contents) => {
  console.log("Sending request to Gemini...");

  const response = await ai.models.generateContentStream({
    model: "gemini-3.5-flash-lite",
    contents,
    config: GEMINI_CONFIG,
  });

  console.log("Gemini response received.");

  return response;
};

export const uploadFileToGemini = async (file) => {
  try {
    const uploadedFile = await ai.files.upload({
      file: file.path,
      config: {
        mimeType: file.mimetype,
      },
    });

    return uploadedFile;
  } catch (error) {
    throw new Error("Unable to upload the file to Gemini.");
  }
};

export const generateGeminiResponseWithTools = async (contents) => {
  console.log("Sending request to Gemini with tools...");

  const MAX_TOOL_ROUNDS = 5;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    console.log(`Gemini API request: Round ${round + 1}`);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: contents,
      config: {
        GEMINI_CONFIG,
        tools,
        toolConfig: {
          includeServerSideToolInvocations: true,
        },
      },
    });
    console.log(`Gemini response received: Round ${round + 1}`);

    const functionCalls = response.functionCalls || [];

    if (functionCalls.length === 0) {
      if (response.candidates?.[0]?.finishReason === "SAFETY")
        return "Response blocked: The content violated safety policies";
      console.log("Gemini response received");

      return response.text || "";
    }

    console.log("Gemini requested Function Calls: ", functionCalls);
    contents.push(response.candidates[0].content);


    const functionCallResults = await Promise.all(
      functionCalls.map(async (functionCall) => {
        try {
          const result = await executeToolService(functionCall);
          
          return {
            functionResponse: {
              name: functionCall.name,
              id: functionCall.id,
              response: { result },
            },
          };
        } catch (error) {
          console.error(`Error executing tool ${functionCall.name}:`, error);
          return {
            functionResponse: {
              name: functionCall.name,
              id: functionCall.id,
              response: { error: "Unable to execute the tool." },
            },
          };
        }
      }),
    );
    contents.push({ role: "user", parts: functionCallResults });
    console.log("Function call results:", functionCallResults);
  }
  throw new Error(
    "Maximum tool execution rounds reached without a final response.",
  );
};
