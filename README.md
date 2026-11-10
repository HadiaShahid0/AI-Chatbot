# 🤖 AI Chatbot

A full-stack AI chatbot built with **React, Vite, Node.js, Express, MySQL, Sequelize, and Google Gemini**. It supports conversational AI, persistent chat history, conversation summaries, document and image uploads, LLM tool calling, source citations, and Retrieval-Augmented Generation (RAG) for retrieving information from uploaded PDF content.

## ✨ Features

### 🔐 Authentication

- User registration and login
- JWT-based authentication using HTTP-only cookies
- Protected chat routes

### 💬 AI Chat and Conversation Management

- Chat with Google Gemini
- Create and view conversations
- Save user and assistant messages in MySQL
- Use recent messages to maintain conversation context
- Summarize longer conversations and save summaries in the database
- Stream responses through the backend response handler

### 📄 Document and Image Uploads

- Upload supported documents and images
- Ask questions about uploaded files
- Process supported files with Gemini
- Store file information with the associated chat message

### 🧠 Retrieval-Augmented Generation (RAG)

- Extract text from PDF documents
- Split extracted text into smaller chunks
- Generate document and query embeddings with Google's `gemini-embedding-001`
- Store and search document chunks in ChromaDB
- Retrieve relevant chunks using vector similarity search
- Use **Top-K retrieval** (default `topK = 5`)
- Apply metadata filtering using `scope: "shared"`
- Retrieve relevant document information through the custom `searchDocuments` tool
- Use retrieved document content to help Gemini answer document-related questions

#### Current chunking strategy

The current chunking function uses **fixed-size character chunking with overlap**:

- Chunk size: `512` characters by default
- Overlap: `50` characters by default
- Each next chunk starts at the previous chunk's end position minus the overlap.

#### RAG workflow

```text
PDF document
     |
     v
Extract PDF text
     |
     v
Split text into chunks
(512 characters, 50-character overlap)
     |
     v
Generate document embeddings
(gemini-embedding-001)
     |
     v
Store chunks, embeddings, and metadata
in ChromaDB


User question
     |
     v
Generate query embedding
     |
     v
Search ChromaDB
(vector similarity + scope metadata filter)
     |
     v
Retrieve up to 5 matching chunks
     |
     v
Return relevant document information
through searchDocuments
     |
     v
Gemini generates the answer
```

**Retrieval method:** Vector similarity search with Top-K retrieval and metadata filtering. The retrieval service returns each chunk's text, metadata, and distance. The distance is available for evaluation; this code does not apply a relevance-distance threshold.

### 🛠️ LLM Tool Calling

The chatbot uses Gemini Function Calling to allow the model to select and execute tools based on the user's question.

Instead of handling every request using general knowledge, Gemini can request specific tools to retrieve information or perform tasks.

#### Custom Tools

The project implements the following custom tools:

| Tool | Description |
|---|---|
| `searchDocuments` | Searches uploaded documents and retrieves relevant information for document-related questions. |
| `searchWikipedia` | Searches Wikipedia and returns relevant page titles, descriptions, and URLs. |

#### Gemini Built-in Tools

The project also uses Gemini's built-in tools:

| Tool | Description |
|---|---|
| Google Search | Retrieves information from the web when additional or current information is needed. |
| Code Execution | Executes code for calculations, mathematical problems, and data analysis. |
| URL Context | Retrieves and understands content from user-provided webpage URLs. |

#### Tool Execution Features

- Define custom tools using Gemini function declarations.
- Allow Gemini to decide when a tool is needed.
- Execute multiple requested function calls using `Promise.all()`.
- Handle tool execution errors.
- Send tool results back to Gemini.
- Support multiple tool execution rounds (maximum 5 rounds).
- Generate a final response using the returned tool results.
- Combine multiple tools when a question requires information from different sources.

#### Tool Calling Workflow

```text
User Question
     |
     v
Gemini Model
     |
     v
Analyze User Question
     |
     v
Select Relevant Tool(s)
     |
     v
Request Function Calls
     |
     v
Execute Requested Tools
     |
     v
Return Tool Results to Gemini
     |
     v
Gemini Analyzes Results
     |
     v
More Tool Calls Needed?
     |
     ├── Yes --> Execute Tools Again
     |
     └── No
          |
          v
     Generate Final Answer
          |
          v
     Display Response
```

### 🔗 Source Citations

The chatbot supports collecting and displaying source references for AI-generated answers.

- Extract source information from Gemini grounding metadata.
- Collect citations from custom tool results.
- Support source references from Google Search grounding results.
- Collect Wikipedia source titles and URLs.
- Include uploaded document references when returned by the document search tool.
- Remove duplicate citations based on URLs.
- Format citations as Markdown links.
- Display clickable source links below the AI response using React Markdown.

#### Citation Workflow

```text
Gemini Response / Custom Tool Results
              |
              v
       Collect Citations
              |
              v
       Extract Title and URL
              |
              v
       Remove Duplicate Sources
              |
              v
       Format as Markdown Links
              |
              v
       Append Sources to Answer
              |
              v
       Display Clickable Citations
```

### 🛠️ Tech Stack

#### Frontend

- React
- Vite
- JavaScript
- Bootstrap 5
- React Icons
- React Markdown

#### Backend

- Node.js
- Express.js
- Sequelize ORM
- MySQL
- JWT authentication and HTTP-only cookies
- Multer for file uploads

#### AI and LLM

- Google Gemini API
- `gemini-3.5-flash-lite` for chat responses
- Gemini Function Calling
- Custom tools: `searchDocuments` and `searchWikipedia`
- Built-in tools: Google Search, Code Execution, and URL Context
- Multiple tool execution rounds
- Tool result handling and error management
- Source citation collection and formatting

#### RAG

- `gemini-embedding-001` for embeddings
- ChromaDB for vector storage and similarity search
- PDF-Parse for PDF text extraction
- Text chunking and overlap
- Vector similarity search
- Top-K retrieval and metadata filtering

## 📁 Project Structure

```text
AI-Chatbot/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatHeader/
│   │   │   ├── ChatSidebar/
│   │   │   ├── MessageInput/
│   │   │   └── MessageList/
│   │   ├── features/
│   │   │   └── auth/
│   │   ├── services/
│   │   │   └── chatServices.js
│   │   └── ...
│   └── package.json
├── server/
│   ├── controllers/
│   ├── services/
│   │   ├── geminiServices.js
│   │   ├── citationsService.js
│   │   └── ...
│   ├── tools/
│   │   ├── toolDefinations.js
│   │   └── toolExecution.js
│   ├── rag/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── uploads/
│   ├── config/
│   └── ...
├── .gitignore
└── README.md
```

The tree above is a simplified overview; exact files may differ as the project evolves.

## 🔄 Application Workflow

```text
User
 |
 v
React Frontend
 |
 | HTTP requests / response
 v
Express Backend
 |                 |
 v                 v
MySQL          Gemini API
(users,        (chat response,
conversations,  tool calling,
messages)       file processing)
                   |
                   v
              Tool Selection
                   |
          +--------+--------+
          |        |        |
          v        v        v
      Documents Wikipedia  Built-in
       Search    Search     Tools
          |        |        |
          +--------+--------+
                   |
                   v
             Tool Results
                   |
                   v
             Final Response
                   |
                   v
             Source Citations
                   |
                   v
            Saved Chat History
```

For RAG-enabled questions, the backend retrieves relevant document information from ChromaDB through the `searchDocuments` tool.

## 🧠 Conversation Context and Memory

The chatbot keeps the prompt manageable by combining:

- A saved summary of earlier conversation content.
- A limited number of recent messages.
- Relevant retrieved document information when document search is used.

The summary and recent messages help the chatbot maintain conversation continuity. Retrieved RAG content provides additional information from indexed documents.

## 🗄️ Database

The application uses **MySQL with Sequelize ORM**.

### Main entities

- **User:** Account and authentication information.
- **Conversation:** Chat ownership, title, summary, and summary-tracking information.
- **Message:** User/assistant content and associated file details when applicable.

### User

Stores user authentication and account information.

### Conversation

Stores individual chat conversations.

Example fields:

```text
id
userId
title
summary
lastSummarizedMessageId
createdAt
updatedAt
```

### Message

Stores messages exchanged between the user and AI.

Example fields:

```text
id
conversationId
role
content
createdAt
updatedAt
```

The relationship can be represented as:

```text
User
 |
 └─── hasMany ───► Conversations
                         |
                         └─── hasMany ───► Messages
```

## 🔑 Environment Variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_db_name
DB_USER=your_db_username
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

> Never commit your `.env` file or expose API keys and database credentials publicly.

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/HadiaShahid0/AI-Chatbot.git
cd AI-Chatbot
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Configure environment variables

Create `server/.env` and add your MySQL, JWT, and Gemini configuration.

### 4. Create the MySQL database

Create a database in MySQL, using your chosen database name:

```sql
CREATE DATABASE your_db_name;
```

Make sure the database credentials in `server/.env` match your MySQL setup.

### 5. Start the backend

From the `server` directory, run:

```bash
npm run dev
```

Use the script defined in `server/package.json` if your development command differs.

### 6. Install frontend dependencies

Open another terminal at the project root:

```bash
cd client
npm install
```

### 7. Start the frontend

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

## 🔌 API Overview

The backend includes endpoints for authentication, conversations, and messages. The exact paths depend on the current route configuration.

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Conversations

```text
POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:id
DELETE /api/conversations/:id
```

### Messages

```text
GET  /api/messages/:conversationId
POST /api/messages
```

## 🔐 Security Notes

- Hash passwords before storing them.
- Use HTTP-only cookies for authentication tokens.
- Protect private routes and verify conversation ownership on the backend.
- Keep API keys and database credentials in environment variables.
- Validate uploaded files and their supported types.
- Do not expose sensitive server configuration to the frontend.

## 🧪 Suggested Testing Areas

- Registration, login, logout, and protected routes.
- Conversation creation and message persistence.
- Conversation context and summary updates.
- Response streaming behavior.
- File uploads and Gemini file processing.
- PDF text extraction and chunk creation.
- Embedding generation and ChromaDB storage.
- Retrieval relevance, metadata filtering, and Top-K results.
- RAG answers for document-related and general questions.
- Custom tool selection and execution.
- Multiple function calls and tool execution rounds.
- Wikipedia search results.
- Google Search and URL Context responses.
- Code Execution for calculations and data analysis.
- Citation extraction and duplicate removal.
- Clickable source links in AI responses.

## 🎯 Learning Goals

This project provides practical experience with:

- Large Language Models (LLMs) and Gemini API integration.
- Prompt engineering and system instructions.
- Gemini Function Calling and custom tool development.
- Built-in AI tools and tool execution workflows.
- Multiple tool calling and result handling.
- Source citations and grounding metadata.
- Conversation context and summarization.
- Token and context-window management.
- Multimodal file processing.
- Retrieval-Augmented Generation (RAG).
- Text chunking and overlap.
- Document and query embeddings.
- Vector databases and similarity search.
- Top-K retrieval and metadata filtering.
- REST APIs, React, Node.js, and Express.
- MySQL, Sequelize, and authentication.

## 👩‍💻 Author

**Hadia Shahid**