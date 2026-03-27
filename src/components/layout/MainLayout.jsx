import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function MainLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-black font-inter">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="bg-white dark:bg-[#0b1120] rounded-xl shadow-sm dark:border dark:border-white/10 m-4 p-6 sm:p-4 min-h-[calc(100vh-2rem)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
