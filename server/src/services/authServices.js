import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
export const registerUserService = async (username, email, password) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }
  const bcryptedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    username,
    email,
    password: bcryptedPassword,
  });
  return newUser;
};

export const loginUserService = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }
  const token = generateToken(user.id);
  return { user, token };
};

export const logoutUserService = async (token) => {
  try {
    return { message: "User logged out successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
};

export const getUserProfileService = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const verifyUserService = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};
