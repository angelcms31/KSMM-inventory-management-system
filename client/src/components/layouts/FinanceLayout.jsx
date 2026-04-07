import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import FinanceSidebar from "../sidebars/FinanceSidebar";
import FinanceRightSidebar from "../sidebars/FinanceRightSideBar";

export default function FinanceLayout() {
  const [pendingCompose, setPendingCompose] = useState(null);

  return (
    <div className="flex min-h-screen w-screen bg-gray-50">
      <FinanceSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
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