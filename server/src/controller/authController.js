import {
  registerUserService,
  loginUserService,
  logoutUserService,
  verifyUserService,
} from "../services/authServices.js";

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const newUser = await registerUserService(username, email, password);
    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { user, token } = await loginUserService(email, password);
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });
    res
      .status(200)
      .json({ message: "User logged in successfully", user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const user = await verifyUserService(req.user.id);
    res.status(200).json({ message: "Token is valid", user });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};
