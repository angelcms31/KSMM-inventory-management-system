import { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { RecoveryContext } from "./context/RecoveryContext";
import { getHashedPath, getAuthHash } from "./utils/hash";

import Login from "./pages/auth/Login";
import OTPInput from "./pages/auth/OTPInput";
import Recovered from "./pages/auth/Recovered";
import Reset from "./pages/auth/Reset";
import ForgotPassword from "./pages/auth/ForgotPassword";

import AdminLayout from "./components/layouts/AdminLayout";
import SalesLayout from "./components/layouts/SalesLayout";
import ProductionLayout from "./components/layouts/ProductionLayout";
import FinanceLayout from "./components/layouts/FinanceLayout";

import SalesDashboard from "./pages/sales/SalesDashboard";
import SalesInventory from "./pages/sales/SalesInventory";
import Warehouse from "./pages/sales/Warehouse";
import Orders from "./pages/sales/Orders";

import ProductionDashboard from "./pages/production/ProductionDashboard";
import Artisan from "./pages/production/Artisan";
import ProductionInventory from "./pages/production/Inventory";

const AuthSwitcher = () => {
  const { authHash } = useParams();
  const userId = localStorage.getItem("user_id");
  const userRole = localStorage.getItem("userRole")?.toLowerCase();

  if (userId && userRole) {
    const hashedPath = getHashedPath(userRole, "home");
    return <Navigate to={`/dashboard/${hashedPath}`} replace />;
  }

  if (authHash === getAuthHash("login")) return <Login />;
  if (authHash === getAuthHash("otp")) return <OTPInput />;
  if (authHash === getAuthHash("forgot")) return <ForgotPassword />;
  if (authHash === getAuthHash("reset")) return <Reset />;
  if (authHash === getAuthHash("recovered")) return <Recovered />;

  return <Navigate to={`/auth/${getAuthHash("login")}`} replace />;
};

const ProtectedRoute = ({ children, allowedRole }) => {
  const userId = localStorage.getItem("user_id");
  const userRole = localStorage.getItem("userRole")?.toLowerCase();

  if (!userId || !userRole) {
    return <Navigate to={`/auth/${getAuthHash("login")}`} replace />;
  }

  if (userRole !== allowedRole.toLowerCase()) {
    const myDefault = getHashedPath(userRole, "home");
    return <Navigate to={`/dashboard/${myDefault}`} replace />;
  }

  return children;
};

function App() {
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState();
  const location = useLocation();
  const timerRef = useRef(null);

  const handleLogoutLogic = async () => {
    const userId = localStorage.getItem("user_id");
    const role = localStorage.getItem("userRole");
    if (userId) {
      try {
        await axios.post("http://localhost:5000/api/logout", { userId, role });
      } catch (err) {
        console.error("Logout failed", err);
      }
    }
    localStorage.clear();
  };

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        if (localStorage.getItem("user_id")) {
          await handleLogoutLogic();
          window.location.href = "/";
        }
      }, 1800000);
    };

    if (localStorage.getItem("user_id")) {
      resetTimer();
      const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
      events.forEach(e => window.addEventListener(e, resetTimer));
      return () => events.forEach(e => window.removeEventListener(e, resetTimer));
    }
  }, [location.pathname]);

  return (
    <RecoveryContext.Provider value={{ otp, setOTP, setEmail, email }}>
      <Routes>
        <Route path="/" element={<Navigate to={`/auth/${getAuthHash('login')}`} replace />} />
        <Route path="/auth/:authHash" element={<AuthSwitcher />} />

        <Route
          path="/dashboard"
          element={(() => {
            const role = localStorage.getItem("userRole")?.toLowerCase();
            switch (role) {
              case "admin":
                return <ProtectedRoute allowedRole="Admin"><AdminLayout /></ProtectedRoute>;
              case "sales":
                return <ProtectedRoute allowedRole="Sales"><SalesLayout /></ProtectedRoute>;
              case "production":
                return <ProtectedRoute allowedRole="Production"><ProductionLayout /></ProtectedRoute>;
              case "finance":
                return <ProtectedRoute allowedRole="Finance"><FinanceLayout /></ProtectedRoute>;
              default:
                return <Navigate to="/" replace />;
            }
          })()}
        >
          <Route path={getHashedPath("sales", "home")} element={<SalesDashboard />} />
          <Route path={getHashedPath("sales", "inventory")} element={<SalesInventory />} />
          <Route path={getHashedPath("sales", "warehouse")} element={<Warehouse />} />
          <Route path={getHashedPath("sales", "statistics")} element={<Orders />} />

          <Route path={getHashedPath("production", "home")} element={<ProductionDashboard />} />
          <Route path={getHashedPath("production", "artisan")} element={<Artisan />} />
          <Route path={getHashedPath("production", "inventory")} element={<ProductionInventory />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RecoveryContext.Provider>
  );
}

export default App;