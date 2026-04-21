import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../sidebars/AdminSidebar";
import AdminRightSidebar from "../sidebars/AdminRightSideBar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <main className="p-8 lg:p-12 mb-20 lg:mb-0">
          <Outlet />
        </main>
      </div>
      <AdminRightSidebar />
    </div>
  );
}