import React from "react";
import { Outlet } from "react-router-dom";
import SalesSidebar from "../sidebars/SalesSidebar";
import ProdSalesRightSidebar from "../sidebars/ProdSalesRightSideBar";

export default function SalesLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <SalesSidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden p-6">
          <Outlet />
        </main>
      </div>
      <ProdSalesRightSidebar />
    </div>
  );
}