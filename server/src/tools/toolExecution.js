import { searchDocuments } from "./toolRegistoery.js";
import { searchWikipedia } from "./toolService.js";

const toolRegistry = {
  searchDocuments,
  searchWikipedia,
};

export const executeToolService = async (functionCall) => {
  const { name, args } = functionCall;

  const tool = toolRegistry[name];

  if (!tool) throw new Error(`Unknown tool: ${name}`);

  const result = await tool(args);
  
  return result;
};
