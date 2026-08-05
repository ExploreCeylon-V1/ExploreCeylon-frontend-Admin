import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./authContextInstance";
import {
  getAccessToken,
  getUser as getStoredUser,
  saveAuth,
  clearAuth,
} from "../utils/authStorage";

function getInitialAuthState() {
  const token = getAccessToken();
  const user = getStoredUser();

  if (token && user) {
    return { token, user };
  }
  clearAuth();
  return { token: null, user: null };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getInitialAuthState);
  const { token, user } = auth;
  const navigate = useNavigate();

  const login = (newToken, newUser, newRefreshToken = null) => {
    setAuth({ token: newToken, user: newUser });
    saveAuth(newToken, newUser, newRefreshToken);
  };

  const logout = (redirectTo = "/login") => {
    clearAuth();
    setAuth({ token: null, user: null });
    navigate(redirectTo);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isAdmin: user?.role === "ADMIN",
        loading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
