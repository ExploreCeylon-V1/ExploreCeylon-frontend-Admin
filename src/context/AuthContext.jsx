import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const t =
      localStorage.getItem("ec_admin_token") ||
      localStorage.getItem("exploreCeylonToken") ||
      localStorage.getItem("token");
    const u =
      localStorage.getItem("ec_admin_user") ||
      localStorage.getItem("exploreCeylonUser") ||
      localStorage.getItem("user");
    if (t && u) {
      try {
        setToken(t);
        setUser(JSON.parse(u));
      } catch {
        localStorage.removeItem("ec_admin_token");
        localStorage.removeItem("ec_admin_user");
        localStorage.removeItem("exploreCeylonToken");
        localStorage.removeItem("exploreCeylonUser");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("ec_admin_token", newToken);
    localStorage.setItem("ec_admin_user", JSON.stringify(newUser));
    localStorage.setItem("exploreCeylonToken", newToken);
    localStorage.setItem("token", newToken);
    localStorage.setItem("exploreCeylonUser", JSON.stringify(newUser));
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = (redirectTo = "/login") => {
    localStorage.removeItem("ec_admin_token");
    localStorage.removeItem("ec_admin_user");
    localStorage.removeItem("exploreCeylonToken");
    localStorage.removeItem("exploreCeylonRole");
    localStorage.removeItem("exploreCeylonUser");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
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
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
