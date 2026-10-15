# 🤖 AI Chatbot

A full-stack AI chatbot built with **React, Vite, Node.js, Express,
MySQL, Sequelize, and Google Gemini**. It supports conversational AI,
persistent chat history, conversation summaries, document and image
uploads, streaming responses, and Retrieval-Augmented Generation (RAG)
for retrieving information from uploaded PDF content.

## ✨ Features

### 🔐 Authentication

-   User registration and login
-   JWT-based authentication using HTTP-only cookies
-   Protected chat routes

### 💬 AI Chat and Conversation Management

-   Chat with Google Gemini
-   Create and view conversations
-   Save user and assistant messages in MySQL
-   Use recent messages to maintain conversation context
-   Summarize longer conversations and save summaries in the database
-   Stream AI responses to the frontend

### 📄 Document and Image Uploads

-   Upload supported documents and images
-   Ask questions about uploaded files
-   Process supported files with Gemini
-   Store file information with the associated chat message

### 🧠 Retrieval-Augmented Generation (RAG)

-   Extract text from PDF documents
-   Split extracted text into smaller chunks
-   Generate document and query embeddings with Google's
    `gemini-embedding-001`
-   Store and search document chunks in ChromaDB
-   Retrieve relevant chunks using vector similarity search
-   Use **Top-K retrieval** (default `topK = 5`)
-   Apply metadata filtering using `scope: "shared"`
-   Add retrieved document content to the Gemini prompt to help answer
    document-related questions

#### Current chunking strategy

The current chunking function uses **fixed-size character chunking with
overlap**: - Chunk size: `512` characters by default - Overlap: `50`
characters by default - Each next chunk starts at the previous chunk's
end position minus the overlap


#### RAG workflow

``` text
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
Add retrieved text to Gemini context
    |
    v
Generate the answer
```

**Retrieval method:** vector similarity search with Top-K retrieval and
metadata filtering. The retrieval service returns each chunk's text,
metadata, and distance. The distance is available for evaluation; this
code does not apply a relevance-distance threshold.

## 🛠️ Tech Stack

### Frontend

-   React
-   Vite
-   JavaScript
-   Bootstrap 5
-   React Icons
-   React Markdown

### Backend

-   Node.js
-   Express.js
-   Sequelize ORM
-   MySQL
-   JWT authentication and HTTP-only cookies
-   Multer for file uploads

### AI and RAG

-   Google Gemini API
-   `gemini-3.5-flash-lite` for chat responses (as configured in the
    project)
-   `gemini-embedding-001` for embeddings
-   ChromaDB for vector storage and similarity search
-   PDF-Parse for PDF text extraction
-   Conversation context management and summarization
-   Streaming responses

## 📁 Project Structure

``` text
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
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── uploads/
│   ├── config/
│   └── ...
├── .gitignore
└── README.md
```

The tree above is a simplified overview; exact files may differ as the
project evolves.

## 🔄 Application Workflow

``` text
User
 |
 v
React frontend
 |
 | HTTP requests / streamed response
 v
Express backend
 |                  |
 v                  v
MySQL            Gemini API
(users,          (chat response,
 conversations,   file processing)
 messages)
 |
 v
Saved conversation history
```

For RAG-enabled questions, the backend also retrieves relevant document
chunks from ChromaDB and includes them in the context sent to Gemini.

## 🧠 Conversation Context and Memory

The chatbot keeps the prompt manageable by combining: - A saved summary
of earlier conversation content - A limited number of recent messages -
Relevant retrieved document chunks when RAG retrieval is used

The summary and recent messages help the chatbot maintain conversation
continuity. Retrieved RAG content provides additional information from
indexed documents.

## 🗄️ Database

The application uses **MySQL with Sequelize ORM**.

### Main entities

-   **User:** account and authentication information.
-   **Conversation:** chat ownership, title, summary, and
    summary-tracking information.
-   **Message:** user/assistant content and associated file details when
    applicable.

Main entities include:

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
 │
 └─── hasMany ───► Conversations
                         │
                         └─── hasMany ───► Messages
```

## 🔑 Environment Variables

Create a `.env` file inside the `server` directory. Example:

``` env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_db_name
DB_USER=your_db_username
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

> Never commit your `.env` file or expose API keys and database
> credentials publicly.

## 🚀 Installation

### 1. Clone the repository

``` bash
git clone https://github.com/HadiaShahid0/AI-Chatbot.git
cd AI-Chatbot
```

### 2. Install backend dependencies

``` bash
cd server
npm install
```

### 3. Configure environment variables

Create `server/.env` and add your MySQL, JWT, and Gemini configuration.

### 4. Create the MySQL database

Create a database in MySQL, using your chosen database name:

``` sql
CREATE DATABASE your_db_name;
```

Make sure the database credentials in `server/.env` match your MySQL
setup.

### 5. Start the backend

From the `server` directory, run:

``` bash
npm run dev
```

Use the script defined in `server/package.json` if your development
command differs.

### 6. Install frontend dependencies

Open another terminal at the project root:

``` bash
cd client
npm install
```

### 7. Start the frontend

``` bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

## 🔌 API Overview

The backend includes endpoints for authentication, conversations, and
messages. The exact paths depend on the current route configuration.

### Authentication

``` text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Conversations

``` text
POST   /api/conversations
GET    /api/conversations
GET    /api/conversations/:id
DELETE /api/conversations/:id
```

### Messages

``` text
GET  /api/messages/:conversationId
POST /api/messages
```

## 🔐 Security Notes

-   Hash passwords before storing them.
-   Use HTTP-only cookies for authentication tokens.
-   Protect private routes and verify conversation ownership on the
    backend.
-   Keep API keys and database credentials in environment variables.
-   Validate uploaded files and their supported types.
-   Do not expose sensitive server configuration to the frontend.

## 🧪 Suggested Testing Areas

-   Registration, login, logout, and protected routes
-   Conversation creation and message persistence
-   Conversation context and summary updates
-   Streaming response behavior
-   File uploads and Gemini file processing
-   PDF text extraction and chunk creation
-   Embedding generation and ChromaDB storage
-   Retrieval relevance, metadata filtering, and Top-K results
-   RAG answers for document-related and general questions

## 🎯 Learning Goals

This project provides practical experience with: - Large Language Models
and Gemini API integration - Prompt construction and conversation
context - Token and context-window management - Conversation memory and
summarization - Multimodal file processing - Retrieval-Augmented
Generation (RAG) - Text chunking and overlap - Document and query
embeddings - Vector databases and similarity search - Top-K retrieval
and metadata filtering - REST APIs, React, Node.js, and Express - MySQL,
Sequelize, and authentication

## 👩‍💻 Author

**Hadia Shahid**

GitHub: [HadiaShahid0](https://github.com/HadiaShahid0)