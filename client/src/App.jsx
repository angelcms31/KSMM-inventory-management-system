import { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
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
import Suppliers from "./pages/admin/Suppliers"; 
import AuditLogs from "./pages/admin/AuditLogs";
import AdminDashboard from "./pages/admin/AdminDashboard";
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import FinanceTransactions from "./pages/finance/FinanceTransaction";
import ProductionDashboard from "./pages/production/ProductionDashboard";
import Inventory from "./pages/production/Inventory";
import Artisan from "./pages/production/Artisan";
import SalesDashboard from "./pages/sales/SalesDashboard";
import SalesInventory from "./pages/sales/SalesInventory";
import Statistics from "./pages/sales/Statistics"
import FinanceLogs from "./pages/finance/FinanceLogs";
import PurchaseOrder from "./pages/finance/PurchaseOrder";

const ProtectedRoute = ({ children, allowedRole }) => {
  const userId = localStorage.getItem("user_id");
  const userRole = localStorage.getItem("userRole");

  if (!userId) return <Navigate to="/" replace />;
  if (allowedRole && userRole?.toLowerCase() !== allowedRole.toLowerCase()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState();
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef(null);

  const handleLogoutLogic = async () => {
    const userId = localStorage.getItem("user_id");
    const role = localStorage.getItem("userRole");

    if (userId) {
      try {
        await axios.post("http://localhost:5000/api/logout", { userId, role });
      } catch (err) {
        console.error("Logout log failed", err);
      }
    }
    localStorage.clear();
  };

  const handleAutoLogout = async () => {
    await handleLogoutLogic();
    navigate("/", { replace: true });
    window.location.reload();
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleAutoLogout, 180000);
  };

  useEffect(() => {
    if (location.pathname === "/") {
      const userId = localStorage.getItem("user_id");
      if (userId) {
        handleLogoutLogic(); 
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    const handleActivity = () => resetTimer();

    if (localStorage.getItem("user_id")) {
      resetTimer();
      events.forEach((event) => window.addEventListener(event, handleActivity));
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [location.pathname]);

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

        <Route path="/admin" element={<ProtectedRoute allowedRole="Admin"><AdminLayout /></ProtectedRoute>}>
          <Route path="" element={<AdminDashboard />} />
          <Route path="artisan" element={<ManageArtisan />} />
          <Route path="suppliers" element={<Suppliers />} />          
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="users" element={<ManageUsers />} />
        </Route>

        <Route path="/sales" element={<ProtectedRoute allowedRole="Sales"><SalesLayout /></ProtectedRoute>}>
          <Route path="" element={<SalesDashboard />} /> 
          <Route path="inventory" element={<SalesInventory />} />
          <Route path="statistics" element={<Statistics />} />

        </Route>

        <Route path="/production" element={<ProtectedRoute allowedRole="Production"><ProductionLayout /></ProtectedRoute>}>
          <Route path="" element={<ProductionDashboard />} /> 
          <Route path="artisan" element={<Artisan />} />
          <Route path="inventory" element={<Inventory />} />
        </Route>

        <Route path="/finance" element={<ProtectedRoute allowedRole="Finance"><FinanceLayout /></ProtectedRoute>}>
          <Route path="" element={<FinanceDashboard />} /> 
          <Route path="transactions" element={<FinanceTransactions />} /> 
          <Route path="logs" element={<FinanceLogs />} /> 
          <Route path="PurchaseOrder" element={<PurchaseOrder />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RecoveryContext.Provider>
  );
}

export default App;