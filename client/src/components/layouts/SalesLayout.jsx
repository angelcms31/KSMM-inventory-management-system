import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import SalesSidebar from "../sidebars/SalesSidebar";
import ProdSalesRightSidebar from "../sidebars/ProdSalesRightSideBar";
import { getHashedPath } from "../../utils/hash";

import MainDashboard from "../../components/dashboard/MainDashboard";
import Orders from "../../pages/sales/Orders";
import SalesInventory from "../../pages/sales/SalesInventory";
import Warehouse from "../../pages/sales/Warehouse";

export default function SalesLayout() {
  const { "*": splat } = useParams();
  const [activeTab, setActiveTab] = useState("home");
  const role = "sales";

  const tabs = ["home", "salesorders", "inventory", "warehouse"];

  useEffect(() => {
    const cleanSplat = splat ? splat.replace(/^\/|\/$/g, '') : "";
    const matched = tabs.find(t => getHashedPath(role, t) === cleanSplat);
    setActiveTab(matched || "home");
  }, [splat]);

  const renderContent = () => {
    switch (activeTab) {
      case "home":      return <MainDashboard />;
      case "salesorders":    return <Orders />;
      case "inventory": return <SalesInventory />;
      case "warehouse": return <Warehouse />;
      default:          return <MainDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-gray-50 overflow-hidden text-left">
      <SalesSidebar activeTab={activeTab} />
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <main className="p-8 lg:p-12 pb-24 md:pb-12">
          {renderContent()}
        </main>
      </div>
      <ProdSalesRightSidebar />
    </div>
  );
}