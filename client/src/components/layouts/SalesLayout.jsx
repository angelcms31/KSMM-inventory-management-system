import React from "react";
import { Outlet } from "react-router-dom";
import SalesSidebar from "../sidebars/SalesSidebar"; 

export default function SalesLayout() {
  return (
    <div className="flex min-h-screen w-screen bg-gray-50">
      <SalesSidebar /> 
      <div className="flex-1 flex flex-col">
        <main className="p-8 lg:p-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}