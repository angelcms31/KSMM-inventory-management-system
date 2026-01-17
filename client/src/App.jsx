import { useState, createContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import OTPInput from "./pages/auth/OTPInput";
import Recovered from "./pages/auth/Recovered";
import Reset from "./pages/auth/Reset";

import AdminLayout from "./components/layouts/AdminLayout";
import SalesLayout from "./components/layouts/SalesLayout";
import ProductionLayout from "./components/layouts/ProductionLayout";
import FinanceLayout from "./components/layouts/FinanceLayout";

import ManageUsers from "./pages/admin/ManageUsers";

const AdminDashboard = () => <div className="p-4">Admin Dashboard Content</div>;
const ArtisanPage = () => <div className="p-4">Artisan Management Page</div>;
const SuppliersPage = () => <div className="p-4">Suppliers List Page</div>;
const AuditLogs = () => <div className="p-4">Audit Logs History</div>;

const SalesInventory = () => <div className="p-4">Sales Inventory Content</div>;
const StatisticsPage = () => <div className="p-4">Sales Statistics Content</div>;

const ProductionOrders = () => <div className="p-4">Production Orders Content</div>;
const FinanceReports = () => <div className="p-4">Finance Reports Content</div>;

export const RecoveryContext = createContext();

function App() {
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState();

  return (
    <RecoveryContext.Provider value={{ otp, setOTP, setEmail, email }}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/otp" element={<OTPInput />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/recovered" element={<Recovered />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="artisan" element={<ArtisanPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="users" element={<ManageUsers />} />
        </Route>

        <Route path="/sales" element={<SalesLayout />}>
          <Route index element={<SalesInventory />} />
          <Route path="inventory" element={<SalesInventory />} />
          <Route path="statistics" element={<StatisticsPage />} />
        </Route>

        <Route path="/production" element={<ProductionLayout />}>
          <Route index element={<ProductionOrders />} />
        </Route>

        <Route path="/finance" element={<FinanceLayout />}>
          <Route index element={<FinanceReports />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </RecoveryContext.Provider>
  );
}

export default App;