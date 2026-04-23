import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ProductionSidebar from "../sidebars/ProductionSidebar";
import ProdSalesRightSidebar from "../sidebars/ProdSalesRightSideBar";
import { getHashedPath } from "../../utils/hash";

import MainDashboard from "../../components/dashboard/MainDashboard";
import Artisan from "../../pages/production/Artisan";
import Inventory from "../../pages/production/Inventory";
import RawMaterials from "../../pages/production/RawMaterials";

export default function ProductionLayout() {
  const { "*": splat } = useParams();
  const [activeTab, setActiveTab] = useState("home");
  const role = "production";

  const tabs = ["home", "artisan", "inventory", "rawmaterials"]; 

  useEffect(() => {
    const cleanSplat = splat ? splat.replace(/^\/|\/$/g, '') : "";
    const matched = tabs.find(t => getHashedPath(role, t) === cleanSplat);
    setActiveTab(matched || "home");
  }, [splat]);

  const renderContent = () => {
    switch (activeTab) {
      case "home": return <MainDashboard />;
      case "artisan": return <Artisan />;
      case "rawmaterials": return <RawMaterials />;
      case "inventory": return <Inventory />;
      default: return <MainDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-gray-50 overflow-hidden text-left">
      <ProductionSidebar activeTab={activeTab} />
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        <main className="p-8 lg:p-12 pb-24 md:pb-12">
          {renderContent()}
        </main>
      </div>
      <ProdSalesRightSidebar />
    </div>
  );
}