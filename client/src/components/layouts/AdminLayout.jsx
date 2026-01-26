import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../sidebars/AdminSidebar";
import AdminFinanceRightSidebar from "../sidebars/AdminFinanceRightSideBar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      <AdminSidebar /> 

      <div className="flex-1 flex flex-col overflow-y-auto">
        <main className="p-8 lg:p-12">
          <Outlet />
        </main>
      </div>

      <AdminFinanceRightSidebar />
    </div>
  );
}