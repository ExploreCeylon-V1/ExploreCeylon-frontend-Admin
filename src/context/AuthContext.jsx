import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./authContextInstance";

// Reads whatever was persisted by a previous session, synchronously, so the
// provider's very first render already reflects auth state — no
// "hydrate from localStorage in an effect" round trip (and no flash of
// unauthenticated content while that effect runs).
function getInitialAuthState() {
  const t =
    localStorage.getItem("ec_admin_token") ||
    localStorage.getItem("exploreCeylonToken") ||
    localStorage.getItem("token");
  const u =
    localStorage.getItem("ec_admin_user") ||
    localStorage.getItem("exploreCeylonUser") ||
    localStorage.getItem("user");

  let token = null;
  let user = null;
  if (t && u) {
    token = t;
    try {
      user = JSON.parse(u);
    } catch {
      localStorage.removeItem("ec_admin_token");
      localStorage.removeItem("ec_admin_user");
      localStorage.removeItem("exploreCeylonToken");
      localStorage.removeItem("exploreCeylonUser");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }
  return { token, user };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getInitialAuthState);
  const { token, user } = auth;
  const navigate = useNavigate();

  const setToken = (value) => setAuth((prev) => ({ ...prev, token: value }));
  const setUser = (value) => setAuth((prev) => ({ ...prev, user: value }));

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
        // Auth state is now derived synchronously on first render (see
        // getInitialAuthState above), so there's no async hydration phase.
        // Kept in the context value because AdminRoute / AdminContactPage
        // still read it as a gate.
        loading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
