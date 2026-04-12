import React, { useState } from "react";
import AdminSidebar from "../sidebars/AdminSidebar";
import AdminRightSidebar from "../sidebars/AdminRightSideBar";

import AdminDashboard from "../../pages/admin/AdminDashboard";
import ManageArtisan from "../../pages/admin/ManageArtisan";
import Suppliers from "../../pages/admin/Suppliers";
import AuditLogs from "../../pages/admin/AuditLogs";
import Variance from "../../pages/admin/VarianceLogs";
import ManageUsers from "../../pages/admin/ManageUsers";

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <AdminDashboard />;
      case "artisan":
        return <ManageArtisan />;
      case "suppliers":
        return <Suppliers />;
      case "audit":
        return <AuditLogs />;
      case "variance":
        return <Variance />;
      case "users":
        return <ManageUsers />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <main className="p-8 lg:p-12 mb-20 lg:mb-0">
          {renderContent()}
        </main>
      </div>

      <AdminRightSidebar />
    </div>
  );
}