import { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
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

const RequireAuth = ({ children }) => {
  const userId = localStorage.getItem("user_id");
  const userRole = localStorage.getItem("userRole");
  if (!userId || !userRole) {
    return <Navigate to={`/auth/${getAuthHash("login")}`} replace />;
  }
  return children;
};

const AuthSwitcher = () => {
  const { authHash } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");
  const userRole = localStorage.getItem("userRole")?.toLowerCase();

  useEffect(() => {
    if (userId && userRole) {
      navigate(`/dashboard/${getHashedPath(userRole, "home")}`, { replace: true });
    }
  }, []);

  if (userId && userRole) return null;

  if (authHash === getAuthHash("login")) return <Login />;
  if (authHash === getAuthHash("otp")) return <OTPInput />;
  if (authHash === getAuthHash("forgot")) return <ForgotPassword />;
  if (authHash === getAuthHash("reset")) return <Reset />;
  if (authHash === getAuthHash("recovered")) return <Recovered />;

  return <Navigate to={`/auth/${getAuthHash("login")}`} replace />;
};

const RedirectToHome = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const userRole = localStorage.getItem("userRole")?.toLowerCase();
    if (userId && userRole) {
      navigate(`/dashboard/${getHashedPath(userRole, "home")}`, { replace: true });
    } else {
      navigate(`/auth/${getAuthHash("login")}`, { replace: true });
    }
  }, []);
  return null;
};

function App() {
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState();
  const location = useLocation();
  const timerRef = useRef(null);

  const isAuthPage = location.pathname.startsWith("/auth");

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
    window.location.href = `/auth/${getAuthHash("login")}`;
  };

  useEffect(() => {
    if (!localStorage.getItem("user_id") || isAuthPage) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        if (localStorage.getItem("user_id")) {
          await handleLogoutLogic();
        }
      }, 180000);
    };

    resetTimer();
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location.pathname]);

  return (
    <RecoveryContext.Provider value={{ otp, setOTP, setEmail, email }}>
      <Routes>
        <Route path="/" element={<Navigate to={`/auth/${getAuthHash("login")}`} replace />} />
        <Route path="/auth/:authHash" element={<AuthSwitcher />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <RoleLayout />
            </RequireAuth>
          }
        >
          <Route path={getHashedPath("sales", "home")} element={<SalesDashboard />} />
          <Route path={getHashedPath("sales", "inventory")} element={<SalesInventory />} />
          <Route path={getHashedPath("sales", "warehouse")} element={<Warehouse />} />
          <Route path={getHashedPath("sales", "statistics")} element={<Orders />} />

          <Route path={getHashedPath("production", "home")} element={<ProductionDashboard />} />
          <Route path={getHashedPath("production", "artisan")} element={<Artisan />} />
          <Route path={getHashedPath("production", "inventory")} element={<ProductionInventory />} />

          <Route index element={<RedirectToHome />} />
          <Route path="*" element={<RedirectToHome />} />
        </Route>

        <Route path="*" element={<RedirectToHome />} />
      </Routes>
    </RecoveryContext.Provider>
  );
}

const RoleLayout = () => {
  const userRole = localStorage.getItem("userRole")?.toLowerCase();

  switch (userRole) {
    case "admin":      return <AdminLayout />;
    case "finance":    return <FinanceLayout />;
    case "sales":      return <SalesLayout />;
    case "production": return <ProductionLayout />;
    default:           return <RedirectToHome />;
  }
};

export default App;