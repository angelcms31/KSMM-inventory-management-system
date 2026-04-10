import { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from "react-router-dom";
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

const AuthRoute = ({ children }) => {
  const userId = localStorage.getItem("user_id");
  const userRole = localStorage.getItem("userRole")?.toLowerCase();

  if (userId && userRole) {
    const hashedPath = getHashedPath(userRole, "home");
    return <Navigate to={`/dashboard/${hashedPath}`} replace />;
  }
  return children;
};

const ProtectedRoute = ({ children, allowedRole }) => {
  const { hash } = useParams();
  const userId = localStorage.getItem("user_id");
  const userRole = localStorage.getItem("userRole")?.toLowerCase();

  if (!userId || !userRole) {
    return <Navigate to="/" replace />;
  }

  if (userRole !== allowedRole.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  const tabs = [
    "home", "artisan", "suppliers", "audit", "users", 
    "inventory", "warehouse", "statistics", 
    "transactions", "logs", "purchaseorder"
  ];

  const isValidHash = tabs.some(t => getHashedPath(userRole, t) === hash);

  if (!isValidHash) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AuthSwitcher = () => {
  const { authHash } = useParams();

  if (authHash === getAuthHash("login")) return <Login />;
  if (authHash === getAuthHash("otp")) return <OTPInput />;
  if (authHash === getAuthHash("forgot")) return <ForgotPassword />;
  if (authHash === getAuthHash("reset")) return <Reset />;
  if (authHash === getAuthHash("recovered")) return <Recovered />;

  return <Navigate to="/" replace />;
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
      if (event.key === "user_id" && !event.newValue) {
        window.location.href = "/";
      }
    };
    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, []);

  return (
    <RecoveryContext.Provider value={{ otp, setOTP, setEmail, email }}>
      <Routes>
        <Route path="/" element={<Navigate to={`/auth/${getAuthHash('login')}`} replace />} />
        
        <Route path="/auth/:authHash" element={
          <AuthRoute>
            <AuthSwitcher />
          </AuthRoute>
        } />

        <Route path="/dashboard/:hash" element={<ProtectedRoute allowedRole="Admin"><AdminLayout /></ProtectedRoute>} />
        <Route path="/dashboard/:hash" element={<ProtectedRoute allowedRole="Sales"><SalesLayout /></ProtectedRoute>} />
        <Route path="/dashboard/:hash" element={<ProtectedRoute allowedRole="Production"><ProductionLayout /></ProtectedRoute>} />
        <Route path="/dashboard/:hash" element={<ProtectedRoute allowedRole="Finance"><FinanceLayout /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RecoveryContext.Provider>
  );
}

export default App;