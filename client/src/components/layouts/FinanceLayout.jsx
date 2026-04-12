import React, { useState, useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import FinanceSidebar from "../sidebars/FinanceSidebar";
import FinanceRightSidebar from "../sidebars/FinanceRightSideBar";
import { getHashedPath } from "../../utils/hash";

import FinanceDashboard from "../../pages/finance/FinanceDashboard";
import PurchaseOrder from "../../pages/finance/PurchaseOrder";
import Inventory from "../../pages/finance/FinanceTransaction";
import VarianceLogs from "../../pages/finance/FinanceLogs";

export default function FinanceLayout() {
  const { hash } = useParams();
  const [activeTab, setActiveTab] = useState("home");
  const [pendingCompose, setPendingCompose] = useState(null);
  const role = "finance";

  const tabs = ["home", "purchaseorder", "inventory", "variance"];

  useEffect(() => {
    const currentTab = tabs.find(t => getHashedPath(role, t) === hash);
    if (currentTab) {
      setActiveTab(currentTab);
    }
  }, [hash]);

  const renderContent = () => {
    switch (activeTab) {
      case "home": return <FinanceDashboard />;
      case "purchaseorder": return <PurchaseOrder />;
      case "inventory": return <Inventory />;
      case "variance": return <VarianceLogs />;
      default: return <FinanceDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-gray-50 overflow-hidden">
      <FinanceSidebar activeTab={activeTab} />
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <main className="p-8 lg:p-12 pb-24 md:pb-12">
          {renderContent()}
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