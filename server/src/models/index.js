import User from "./userModel.js";
import Conversation from "./conversationModel.js";
import Message from "./messageModel.js";

User.hasMany(Conversation, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

Conversation.belongsTo(User, {
  foreignKey: "userId",
});

Conversation.hasMany(Message, {
  foreignKey: "conversationId",
  onDelete: "CASCADE",
});

Message.belongsTo(Conversation, {
  foreignKey: "conversationId",
});

export { User, Conversation, Message };
