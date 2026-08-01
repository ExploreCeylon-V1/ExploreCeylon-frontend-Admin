import { createContext } from "react";

// Split out from AuthContext.jsx so that file can export only the
// AuthProvider component (react-refresh/only-export-components requires
// component-only files for Fast Refresh to work reliably).
export const AuthContext = createContext(null);
