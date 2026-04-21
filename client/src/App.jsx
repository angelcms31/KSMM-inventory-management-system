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

import MainDashboard from "./components/dashboard/MainDashboard";
import SalesInventory from "./pages/sales/SalesInventory";
import Warehouse from "./pages/sales/Warehouse";
import Orders from "./pages/sales/Orders";

import Transactions from "./pages/finance/FinanceTransaction";
import FinanceLogs from "./pages/finance/FinanceLogs";
import PurchaseOrder from "./pages/finance/PurchaseOrder";

import RawMaterials from "./pages/production/RawMaterials";
import Artisan from "./pages/production/Artisan";
import ProductionInventory from "./pages/production/Inventory";

const RequireAuth = ({ children }) => {
  const userId = localStorage.getItem("user_id");
  const userRole = localStorage.getItem("userRole");
  if (!userId || !userRole) return <Navigate to={`/auth/${getAuthHash("login")}`} replace />;
  return children;
};

const RequireRole = ({ allowed, children }) => {
  const userRole = localStorage.getItem("userRole")?.toLowerCase();
  if (!allowed.includes(userRole)) return <RedirectToHome />;
  return children;
};

const AuthSwitcher = () => {
  const { authHash } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");
  const userRole = localStorage.getItem("userRole")?.toLowerCase();

  useEffect(() => {
    if (userId && userRole) navigate(`/dashboard/${getHashedPath("sales", "home")}`, { replace: true });
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
    if (userId && userRole) navigate(`/dashboard/${getHashedPath("sales", "home")}`, { replace: true });
    else navigate(`/auth/${getAuthHash("login")}`, { replace: true });
  }, []);
  return null;
};

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
        if (localStorage.getItem("user_id")) await handleLogoutLogic();
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

        <Route path="/dashboard" element={<RequireAuth><RoleLayout /></RequireAuth>}>

          <Route path={getHashedPath("sales", "home")}       element={<MainDashboard />} />
          <Route path={getHashedPath("sales", "inventory")}  element={<RequireRole allowed={["sales","admin","finance","production"]}><SalesInventory /></RequireRole>} />
          <Route path={getHashedPath("sales", "warehouse")}  element={<RequireRole allowed={["sales","admin","finance","production"]}><Warehouse /></RequireRole>} />
          <Route path={getHashedPath("sales", "statistics")} element={<RequireRole allowed={["sales","admin","finance","production"]}><Orders /></RequireRole>} />

          <Route path={getHashedPath("finance", "inventory")}     element={<RequireRole allowed={["finance","admin"]}><Transactions /></RequireRole>} />
          <Route path={getHashedPath("finance", "variance")}      element={<RequireRole allowed={["finance","admin"]}><FinanceLogs /></RequireRole>} />
          <Route path={getHashedPath("finance", "purchaseorder")} element={<RequireRole allowed={["finance","admin"]}><PurchaseOrder /></RequireRole>} />

          <Route path={getHashedPath("production", "rawmaterials")} element={<RequireRole allowed={["production","admin"]}><RawMaterials /></RequireRole>} />
          <Route path={getHashedPath("production", "artisan")}      element={<RequireRole allowed={["production","admin"]}><Artisan /></RequireRole>} />
          <Route path={getHashedPath("production", "inventory")}    element={<RequireRole allowed={["production","admin"]}><ProductionInventory /></RequireRole>} />

          <Route index element={<RedirectToHome />} />
          <Route path="*" element={<RedirectToHome />} />
        </Route>

        <Route path="*" element={<RedirectToHome />} />
      </Routes>
    </RecoveryContext.Provider>
  );
}

export default App;