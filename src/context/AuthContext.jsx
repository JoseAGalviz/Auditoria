/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.login({
        usuario: username,
        contraseña: password,
      });

      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      }

      navigate("/ventas");
      return data;
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al iniciar sesión");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        error,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
