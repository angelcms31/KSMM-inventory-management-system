import React, { useState, useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import AdminSidebar from "../sidebars/AdminSidebar";
import AdminRightSidebar from "../sidebars/AdminRightSideBar";
import { getHashedPath } from "../../utils/hash";

import MainDashboard from "../dashboard/MainDashboard";
import Artisan from "../../pages/admin/ManageArtisan";
import Suppliers from "../../pages/admin/Suppliers";
import ManageUsers from "../../pages/admin/ManageUsers";
import AuditLogs from "../../pages/admin/AuditLogs";
import VarianceLogs from "../../pages/admin/VarianceLogs";

export default function AdminLayout() {
  const { "*": splat } = useParams();
  const [activeTab, setActiveTab] = useState("home");
  const role = "admin";

  const tabs = ["home", "artisan", "suppliers", "users", "audit", "variance"];

  useEffect(() => {
    const currentTab = tabs.find(t => getHashedPath(role, t) === splat);
    if (currentTab) {
      setActiveTab(currentTab);
    } else if (!splat) {
      setActiveTab("home");
    }
  }, [splat]);

  const renderContent = () => {
    switch (activeTab) {
      case "home": return <MainDashboard />;
      case "artisan": return <Artisan />;
      case "suppliers": return <Suppliers />;
      case "users": return <ManageUsers />;
      case "audit": return <AuditLogs />;
      case "variance": return <VarianceLogs />;
      default: return <MainDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-gray-50 overflow-hidden text-left">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <main className="p-8 lg:p-12 pb-24 md:pb-12">
          {renderContent()}
          <Outlet />
        </main>
      </div>
      <AdminRightSidebar />
    </div>
  );
}