import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import FinanceSidebar from "../sidebars/FinanceSidebar";
import FinanceRightSidebar from "../sidebars/FinanceRightSideBar";
import { getHashedPath } from "../../utils/hash";

export default function FinanceLayout() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("home");
  const [pendingCompose, setPendingCompose] = useState(null);

  const tabs = ["home", "financedashboard", "purchaseorder", "inventory", "variance"];

  useEffect(() => {
    const pathSegment = location.pathname.split("/").filter(Boolean).pop();
    const matched = tabs.find(t => getHashedPath("finance", t) === pathSegment)
      || tabs.find(t => getHashedPath("sales", t) === pathSegment);
    setActiveTab(matched || "home");
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-screen bg-gray-50 overflow-hidden text-left">
      <FinanceSidebar activeTab={activeTab} />
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <main className="p-8 lg:p-12 pb-24 md:pb-12">
          <Outlet context={{ onCompose: (data) => setPendingCompose(data) }} />
        </main>
      </div>
      <FinanceRightSidebar
        pendingCompose={pendingCompose}
        onComposeHandled={() => setPendingCompose(null)}
      />
    </div>
  );
}