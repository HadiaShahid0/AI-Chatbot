import { BrowserRouter, Routes, Route } from "react-router-dom";

import RegisterPage from "../features/auth/pages/register";
import LoginPage from "../features/auth/pages/login";
import ProtectedRoute from "./protectedRoutes";

import ChatPage from "../features/chat/pages/chatPage";

const App = () => {
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
