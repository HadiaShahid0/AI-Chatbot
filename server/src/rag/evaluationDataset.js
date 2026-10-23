export const evaluationDataset = [
  {
    id: 1,
    question: "What technologies were used in the Facebook Clone?",
    expectedAnswer:
      "The Facebook Clone uses React.js, Supabase, PostgreSQL, Supabase Auth, Supabase Realtime, Supabase Storage, RLS, and Bootstrap 5.",
    relevantChunkIds: [
      "document=1-chunk-1",
      "document=1-chunk-2",
    ],
  },
  {
    id: 2,
    question: "List all projects in the resume.",
    expectedAnswer:
      "The four projects are Facebook Clone, Real-Time Chat Application, Task Management System, and ResumEase.",
    relevantChunkIds: [
      "document=1-chunk-2",
      "document=1-chunk-3",
      "document=1-chunk-4",
      "document=1-chunk-5",
    ],
  },
  {
    id: 3,
    question: "Which database is used in ResumEase?",
    expectedAnswer: "ResumEase uses SQLite.",
    relevantChunkIds: ["document=1-chunk-5"],
  },
  {
    id: 4,
    question: "What is the person's monthly salary?",
    expectedAnswer:
      "The resume does not provide the person's monthly salary.",
    relevantChunkIds: [],
  },
  {
    id: 5,
    question: "Which frontend library was used in the Facebook Clone?",
    expectedAnswer: "The Facebook Clone uses React.js.",
    relevantChunkIds: ["document=1-chunk-1", "document=1-chunk-2"],
  },
  {
    id: 6,
    question: "Which backend or platform services does the Facebook Clone use?",
    expectedAnswer:
      "The Facebook Clone uses Supabase, including Supabase Auth, Supabase Realtime, and Supabase Storage.",
    relevantChunkIds: ["document=1-chunk-1", "document=1-chunk-2"],
  },
  {
    id: 7,
    question: "Which database does the Facebook Clone use?",
    expectedAnswer: "The Facebook Clone uses PostgreSQL.",
    relevantChunkIds: ["document=1-chunk-1", "document=1-chunk-2"],
  },
  {
    id: 8,
    question: "Which CSS framework was used in the Facebook Clone?",
    expectedAnswer: "The Facebook Clone uses Bootstrap 5.",
    relevantChunkIds: ["document=1-chunk-1"],
  },
  {
    id: 9,
    question: "What authentication service is used in the Facebook Clone?",
    expectedAnswer: "The Facebook Clone uses Supabase Auth.",
    relevantChunkIds: ["document=1-chunk-1"],
  },
  {
    id: 10,
    question:
      "Which Supabase feature supports realtime functionality in the Facebook Clone?",
    expectedAnswer: "The project uses Supabase Realtime.",
    relevantChunkIds: ["document=1-chunk-1", "document=1-chunk-2"],
  },
  {
    id: 11,
    question:
      "Which Supabase service is used for file storage in the Facebook Clone?",
    expectedAnswer: "The project uses Supabase Storage.",
    relevantChunkIds: ["document=1-chunk-1", "document=1-chunk-2"],
  },
  {
    id: 12,
    question:
      "What does RLS refer to in the Facebook Clone's technology stack?",
    expectedAnswer: "RLS refers to Row Level Security.",
    relevantChunkIds: ["document=1-chunk-0", "document=1-chunk-1", "document=1-chunk-2"],
  },
  {
    id: 13,
    question: "What is the name of the second project in the resume?",
    expectedAnswer: "The second project is Real-Time Chat Application.",
    relevantChunkIds: ["document=1-chunk-2", "document=1-chunk-3"],
  },
  {
    id: 14,
    question: "What is the name of the third project in the resume?",
    expectedAnswer: "The third project is Task Management System.",
    relevantChunkIds: ["document=1-chunk-4"],
  },
  {
    id: 15,
    question: "What is the name of the fourth project in the resume?",
    expectedAnswer: "The fourth project is ResumEase.",
    relevantChunkIds: ["document=1-chunk-5"],
  },
  {
    id: 16,
    question: "Which database is used by the Task Management System?",
    expectedAnswer: "The Task Management System uses MongoDB.",
    relevantChunkIds: ["document=1-chunk-4"],
  },
  {
    id: 17,
    question:
      "Which technologies were used to build the Real-Time Chat Application?",
    expectedAnswer:
      "The Real-Time Chat Application uses React.js, Node.js, Express.js, MongoDB, Mongoose, Socket.IO, WebRTC, and JWT.",
    relevantChunkIds: ["document=1-chunk-3"],
  },
  {
    id: 18,
    question: "What features does ResumEase provide?",
    expectedAnswer:
      "ResumEase provides resume uploading, candidate information extraction, skill matching, candidate shortlisting based on education, skills, and professional experience, interview scheduling support, and responsive dashboards.",
    relevantChunkIds: ["document=1-chunk-5"],
  },
  {
    id: 19,
    question: "Which programming languages are listed in the resume?",
    expectedAnswer:
      "The listed programming languages are C, C++, C#, JavaScript, and Python.",
    relevantChunkIds: ["document=1-chunk-1"],
  },
  {
    id: 20,
    question: "What educational qualifications are mentioned in the resume?",
    expectedAnswer:
      "The resume lists a Bachelor of Information Engineering Technology from Superior University, Lahore, Pakistan, completed from 2021 to 2025, with a CGPA of 3.48/4.00. It also lists JavaScript Full Stack / Web Development certification from NAVTTC, AI Fundamentals certification from Cisco / IBM SkillsBuild, and an Advanced Certification in JavaScript & Full Stack Development (MEAN-MERN).",
    relevantChunkIds: ["document=1-chunk-6"],
  },
  {
    id: 21,
    question:
      "How many years of professional experience does the person have?",
    expectedAnswer:
      "The resume states that the person is working as a MERN Stack Developer Intern at ArhamSoft from July 2026 to the present, but it does not explicitly state the total number of years of professional experience.",
    relevantChunkIds: [],
  },
  {
    id: 22,
    question: "What is the person's home address?",
    expectedAnswer:
      "The resume does not provide the person's home address.",
    relevantChunkIds: [],
  },
  {
    id: 23,
    question: "What is the person's date of birth?",
    expectedAnswer:
      "The resume does not provide the person's date of birth.",
    relevantChunkIds: [],
  },
  {
    id: 24,
    question: "What is the person's favorite programming language?",
    expectedAnswer:
      "The resume lists programming languages but does not specify a favorite programming language.",
    relevantChunkIds: ["document=1-chunk-1"],
  },
];