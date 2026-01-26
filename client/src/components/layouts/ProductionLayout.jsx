import React from "react";
import { Outlet } from "react-router-dom";
import ProductionSidebar from "../sidebars/ProductionSidebar";
import ProdSalesRightSidebar from "../sidebars/ProdSalesRightSideBar";

export default function ProductionLayout() {
  return (
    <div className="flex min-h-screen w-screen bg-gray-50">
      <ProductionSidebar /> 
      <div className="flex-1 flex flex-col">
        <main className="p-8 lg:p-12">
          <Outlet />
        </main>
      </div>
            <ProdSalesRightSidebar />
    </div>
  );
}