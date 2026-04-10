import { useParams, Navigate } from "react-router-dom";
import { getAuthHash } from "./utils/hash";
import Login from "./pages/auth/Login";
import OTPInput from "./pages/auth/OTPInput";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Reset from "./pages/auth/Reset";

const AuthSwitcher = () => {
  const { authHash } = useParams();

  if (authHash === getAuthHash("login")) return <Login />;
  if (authHash === getAuthHash("otp")) return <OTPInput />;
  if (authHash === getAuthHash("forgot")) return <ForgotPassword />;
  if (authHash === getAuthHash("reset")) return <Reset />;

  return <Navigate to="/" replace />;
};