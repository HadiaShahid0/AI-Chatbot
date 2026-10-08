import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";

import "./models/index.js";
import sequelize from "./config/db.js";

import dotenv from "dotenv";
dotenv.config();
const app = express();

try {
  await sequelize.authenticate();

  console.log("MySQL connected successfully.");

  await sequelize.sync({ alter: true });

  console.log("Database synchronized.");
} catch (error) {
  console.error("Database connection failed:", error);
}

const server = http.createServer(app);

app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api", routes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
