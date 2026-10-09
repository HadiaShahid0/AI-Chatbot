# 🤖 AI Chatbot

A full-stack AI chatbot application built with **React, Node.js, Express, MySQL, Sequelize, and Google Gemini API**. The application provides conversational AI with persistent conversations, message history, chat summarization, context management, and support for uploading documents and images.

## ✨ Features

* 🔐 **User Authentication**

  * User registration and login
  * Secure authentication
  * Protected chat routes

* 💬 **AI Chat**

  * Conversational chat with Google Gemini
  * Context-aware responses
  * Persistent message history
  * User and AI message management

* 🗂️ **Conversation Management**

  * Create new conversations
  * View previous conversations
  * Store conversations in the database
  * Automatically manage conversation context

* 🧠 **Context & Memory**

  * Maintains recent conversation context
  * Chat summarization for longer conversations
  * Stores generated summaries in the database
  * Uses previous conversation information when generating responses

* 📄 **Document Upload**

  * Upload documents to the chatbot
  * Send prompts related to uploaded documents
  * Process document content with Gemini

* 🖼️ **Image Upload**

  * Upload images
  * Send prompts about uploaded images
  * Multimodal AI processing with Gemini

* 📊 **Token & Context Management**

  * Research and implementation of token-aware conversation handling
  * Controls the amount of previous conversation sent to the AI
  * Uses summarization to manage long conversations

* 🎨 **Modern Chat Interface**

  * Chat sidebar
  * Chat header
  * Message list
  * Message input
  * Responsive interface
  * Markdown-based AI responses

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* React Icons
* React Markdown
* Bootstrap 5
* JavaScript

### Backend

* Node.js
* Express.js
* Sequelize
* MySQL
* JWT Authentication
* Cookie-based authentication
* Multer for file uploads

### AI

* Google Gemini API
* Gemini multimodal processing
* Conversation context management
* Chat summarization
* Token/context management

## 📁 Project Structure

```text
AI-Chatbot/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatHeader/
│   │   │   ├── ChatSidebar/
│   │   │   ├── MessageInput/
│   │   │   └── MessageList/
│   │   │
│   │   ├── features/
│   │   │   └── auth/
│   │   │
│   │   ├── services/
│   │   │   └── chatServices.js
│   │   │
│   │   └── ...
│   │
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── services/
│   │   ├── geminiServices.js
│   │   └── ...
│   │
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── uploads/
│   ├── config/
│   └── ...
│
├── .gitignore
└── README.md
```

## 🔄 Application Workflow

```text
                    ┌─────────────────┐
                    │      User       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ React Frontend  │
                    └────────┬────────┘
                             │
                    HTTP Requests
                             │
                             ▼
                    ┌─────────────────┐
                    │ Express Server  │
                    └────────┬────────┘
                             │
                    ┌────────┴─────────┐
                    │                  │
                    ▼                  ▼
             ┌──────────────┐   ┌──────────────┐
             │    MySQL     │   │ Gemini API   │
             │  + Sequelize │   │              │
             └──────────────┘   └──────┬───────┘
                                        │
                                        ▼
                                ┌──────────────┐
                                │ AI Response  │
                                └──────┬───────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ Save Message │
                                └──────┬───────┘
                                       │
                                       ▼
                                ┌──────────────┐
                                │ React Chat   │
                                └──────────────┘
```

## 🧠 Conversation Context Flow

The chatbot manages conversation context instead of sending an unlimited number of previous messages to Gemini.

```text
User Message
     │
     ▼
Load Conversation
     │
     ▼
Get Previous Messages
     │
     ▼
Check Context / Summary
     │
     ├───────────────┐
     │               │
     ▼               ▼
Recent Messages   Summary
     │               │
     └───────┬───────┘
             ▼
       Build AI Context
             │
             ▼
        Gemini API
             │
             ▼
        AI Response
             │
             ▼
       Save Message
             │
             ▼
     Update Summary
       when needed
```

This approach helps the application handle longer conversations while keeping the AI context manageable.

## 📄 Document & Image Workflow

The chatbot supports multimodal input.

```text
User
 │
 ├── Text Prompt
 │
 ├── Document
 │
 └── Image
       │
       ▼
  React Frontend
       │
       ▼
  Express Backend
       │
       ▼
 File Processing
       │
       ▼
 Gemini API
       │
       ▼
 AI analyzes
 text/document/image
       │
       ▼
 AI Response
       │
       ▼
 Database
```

Users can upload a document or image and provide a prompt such as:

```text
"Summarize this document."

"Explain this image."

"What are the important points in this file?"
```

## 🗄️ Database

The application uses **MySQL** with **Sequelize ORM**.

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

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=ai_chatbot
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key
```

> Never commit your `.env` file or expose your Gemini API key publicly.

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

Create:

```text
server/.env
```

and add your database, JWT, and Gemini API configuration.

### 4. Create the MySQL database

Create a database in MySQL:

```sql
CREATE DATABASE ai_chatbot;
```

Configure the database credentials in your `.env` file.

### 5. Start the backend

```bash
cd server
npm run dev
```

The backend will run on your configured port.

### 6. Install frontend dependencies

Open another terminal:

```bash
cd client
npm install
```

### 7. Start the frontend

```bash
npm run dev
```

The React application will then be available at the Vite development URL.

## 🔌 API Overview

The backend provides APIs for:

### Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
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
GET    /api/messages/:conversationId
POST   /api/messages
```

> Exact API paths may vary depending on the current route configuration.

## 🔐 Security

The application follows several security practices:

* Password hashing
* JWT authentication
* HTTP-only cookies
* Protected routes
* User-specific conversation access
* Environment variables for sensitive credentials
* Backend-side Gemini API communication
* File upload validation

## 🧪 Testing

Testing can be added for:

* Authentication
* Conversation creation
* Message creation
* Gemini service
* Context management
* Summarization
* File uploads
* Document processing
* Image processing

## 📌 Future Improvements

Possible future improvements include:

* [ ] Streaming Gemini responses
* [ ] Better token counting
* [ ] Advanced document parsing
* [ ] PDF-specific processing
* [ ] More file formats
* [ ] Conversation search
* [ ] Message editing
* [ ] Message regeneration
* [ ] Voice input
* [ ] Voice output
* [ ] Improved long-term memory
* [ ] Rate limiting
* [ ] Automated testing
* [ ] Production deployment

## 🎯 Learning Goals

This project was developed to understand practical implementation of:

* Large Language Models (LLMs)
* Gemini API integration
* Prompt processing
* Tokenization
* Context windows
* Conversation memory
* Chat summarization
* Multimodal AI
* Document processing
* Image processing
* REST APIs
* React frontend architecture
* Node.js and Express
* MySQL and Sequelize
* Authentication and authorization
* File uploads

## 👩‍💻 Author

**Hadia Shahid**

GitHub:
https://github.com/HadiaShahid0

