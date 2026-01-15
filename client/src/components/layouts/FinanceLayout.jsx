import React from "react";
import { Outlet } from "react-router-dom";
import FinanceSidebar from "../sidebars/FinanceSidebar"; 

export default function FinanceLayout() {
  return (
    <div className="flex min-h-screen w-screen bg-gray-50">
      <FinanceSidebar /> 

      <div className="flex-1 flex flex-col">
        
        <main className="p-8 lg:p-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}