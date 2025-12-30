import { Outlet } from "react-router";
import Sidebar from "./components/sidebar";
import "./app.css";

export default function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden">

      <Sidebar />

      <main className="flex-1 bg-[#121212] overflow-y-auto p-10">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}