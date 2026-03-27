import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";

function App() {
  useEffect(() => {
    const modoOscuro = localStorage.getItem("modoOscuro");
    if (modoOscuro === "true") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);
  return <AppRoutes />;
}

export default App;
