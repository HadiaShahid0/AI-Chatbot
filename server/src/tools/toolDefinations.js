export const tools = [
  {
    functionDeclarations: [
      {
        name: "searchDocuments",
        description:
          "Search uploaded documents to find information relevant to the user's question. Use this tool for questions about uploaded documents.",

        parameters: {
          type: "OBJECT",
          properties: {
            question: {
              type: "STRING",
              description:
                "The question or information to search for in uploaded documents",
            },
          },
          required: ["question"],
        },
      },
      {
        name: "searchWikipedia",
        description:
        "Search Wikipedia for relevant information. Return search results containing the page title, description, and original URL so the AI can cite its sources.",
        parameters: {
          type: "OBJECT",
          properties: {
            topic: {
              type: "STRING",
              description: "The topic to search for on Wikipedia",
            },
          },
          required: ["topic"],
        },
      },
    ],
  },
  {
    codeExecution: {},
  },
  {
    urlContext: {},
  },
];
