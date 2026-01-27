import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { RecoveryContext } from "./context/RecoveryContext";

import Login from "./pages/auth/Login";
import OTPInput from "./pages/auth/OTPInput";
import Recovered from "./pages/auth/Recovered";
import Reset from "./pages/auth/Reset";

import AdminLayout from "./components/layouts/AdminLayout";
import SalesLayout from "./components/layouts/SalesLayout";
import ProductionLayout from "./components/layouts/ProductionLayout";
import FinanceLayout from "./components/layouts/FinanceLayout";

import ManageUsers from "./pages/admin/ManageUsers";
import ManageArtisan from "./pages/admin/ManageArtisan";
import Suppliers from "./pages/admin/suppliers"; 
import AuditLogs from "./pages/admin/AuditLogs";
import FinanceTransactions from "./pages/finance/FinanceTransaction";
import Inventory from "./pages/production/Inventory";
import Order from "./pages/production/Order";
import Artisan from "./pages/production/Artisan";
import SalesInventory from "./pages/sales/SalesInventory";
import FinanceLogs from "./pages/finance/FinanceLogs";


const AdminDashboard = () => <div className="p-4 font-black text-2xl uppercase tracking-tighter">Admin Dashboard</div>;
const StatisticsPage = () => <div className="p-4 font-black text-2xl uppercase tracking-tighter">Sales Statistics</div>;
const ProductionOrders = () => <div className="p-4 font-black text-2xl uppercase tracking-tighter">Production Orders</div>;
const FinanceReports = () => <div className="p-4 font-black text-2xl uppercase tracking-tighter">Finance Reports</div>;

function App() {
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState();

  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === "userId" && !event.newValue) {
        window.location.href = "/";
      }
    };

    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, []);

  return (
    <RecoveryContext.Provider value={{ otp, setOTP, setEmail, email }}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/otp" element={<OTPInput />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/recovered" element={<Recovered />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="artisan" element={<ManageArtisan />} />
          <Route path="suppliers" element={<Suppliers />} />          
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="users" element={<ManageUsers />} />
        </Route>

        <Route path="/sales" element={<SalesLayout />}>
          <Route index element={<div className="p-4 font-black text-2xl uppercase tracking-tighter">Dashboard</div>} />
          <Route path="inventory" element={<SalesInventory />} />
          <Route path="statistics" element={<StatisticsPage />} />
        </Route>

        <Route path="/production" element={<ProductionLayout />}>
          <Route index element={<ProductionOrders />} />
          <Route path="artisan" element={<Artisan />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="order" element={<Order />} />
        </Route>

        <Route path="/finance" element={<FinanceLayout />}>
          <Route index element={<FinanceReports />} />
          <Route path="transactions" element={<FinanceTransactions />} /> 
          <Route path="logs" element={<FinanceLogs />} /> 
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </RecoveryContext.Provider>
  );
}

export default App;