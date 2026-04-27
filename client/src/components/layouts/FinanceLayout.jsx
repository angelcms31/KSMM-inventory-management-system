import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import FinanceSidebar from "../sidebars/FinanceSidebar";
import FinanceRightSidebar from "../sidebars/FinanceRightSideBar";
import { getHashedPath } from "../../utils/hash";

import MainDashboard from "../../components/dashboard/MainDashboard";
import Transactions from "../../pages/finance/FinanceTransaction";
import PurchaseOrder from "../../pages/finance/PurchaseOrder";
import AuditLogs from "../../pages/finance/FinanceLogs";
import FinanceVarianceLogs from "../../pages/finance/FinanceVariance";

export default function FinanceLayout() {
  const { "*": splat } = useParams();
  const [activeTab, setActiveTab] = useState("home");
  const [pendingCompose, setPendingCompose] = useState(null);
  const role = "finance";

  const tabs = ["home", "inventory", "purchaseorder", "variance", "audit"];

  useEffect(() => {
    const cleanSplat = splat ? splat.replace(/^\/|\/$/g, '') : "";
    const matched = tabs.find(t => getHashedPath(role, t) === cleanSplat);
    setActiveTab(matched || "home");
  }, [splat]);

  const renderContent = () => {
    switch (activeTab) {
      case "home": return <MainDashboard />;
      case "inventory": return <Transactions />;
      case "purchaseorder": return <PurchaseOrder onCompose={setPendingCompose} />;
      case "variance": return <FinanceVarianceLogs />;
      case "audit": return <AuditLogs />;
      default: return <MainDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-gray-50 overflow-hidden text-left">
      <FinanceSidebar activeTab={activeTab} />
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <main className="p-8 lg:p-12 pb-24 md:pb-12">
          {renderContent()}
        </main>
      </div>
      <FinanceRightSidebar
        pendingCompose={pendingCompose}
        onComposeHandled={() => setPendingCompose(null)}
      />
    </div>
  );
}