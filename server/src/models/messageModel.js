import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Message = db.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("user", "assistant"),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    fileType: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    filePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    geminiFileUri: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "messages",
    timestamps: true,
  },
);
export default Message;
