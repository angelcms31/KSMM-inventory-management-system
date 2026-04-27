import React, { useContext, useState, useEffect } from "react";
import { RecoveryContext } from "../../context/RecoveryContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { HiOutlineEye, HiOutlineEyeOff, HiChevronLeft, HiCheckCircle, HiXCircle } from "react-icons/hi";
import { getAuthHash } from "../../utils/hash";

const AlertDialog = ({ alert, onClose }) => {
  if (!alert) return null;
  const isSuccess = alert.type === 'success';

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/20 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in duration-300">
        <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center mb-6 ${isSuccess ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          {isSuccess ? <HiCheckCircle size={44} className="text-emerald-500" /> : <HiXCircle size={44} className="text-rose-500" />}
        </div>
        <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isSuccess ? 'Success' : 'Error'}
        </p>
        <p className="text-slate-800 font-bold text-lg leading-snug tracking-tight mb-8">
          {alert.message}
        </p>
        <button
          onClick={onClose}
          className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg
            ${isSuccess ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
        >
          {isSuccess ? 'Proceed to Login' : 'Try Again'}
        </button>
      </div>
    </div>
  );
};

export default function Reset() {
  const { email, setEmail, setOTP } = useContext(RecoveryContext);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!email) {
      navigate(`/auth/${getAuthHash("login")}`, { replace: true });
      return;
    }
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = () => window.history.pushState(null, null, window.location.href);
  }, [email, navigate]);

  const handleBackToLogin = () => {
    setEmail("");
    setOTP(null);
    navigate(`/auth/${getAuthHash("login")}`, { replace: true });
  };

const closeAlert = () => {
    if (alert?.type === 'success') {
      localStorage.clear(); 
      sessionStorage.clear();

      setEmail("");
      setOTP(null);

      navigate(`/auth/${getAuthHash("login")}`, { replace: true });
    }
    setAlert(null);
  };

  function changePassword() {
    if (!password || !confirmPassword) {
      setError(true);
      setErrorMessage("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError(true);
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (password.length > 25) {
      setError(true);
      setErrorMessage("Password must not exceed 25 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError(true);
      setErrorMessage("Passwords do not match!");
      return;
    }

    axios.post("http://localhost:5000/api/reset_password", { 
      email: email, 
      newPassword: password 
    })
    .then(() => {
      setAlert({ message: "Your password has been successfully updated.", type: "success" });
    })
    .catch((err) => {
      setError(true);
      const msg = err.response?.data?.message || "Failed to update password.";
      setErrorMessage(typeof msg === "string" ? msg : "Failed to update password.");
    });
  }

  return (
    <div className="flex h-screen w-screen justify-center items-center font-serif bg-white overflow-hidden px-4">
      <AlertDialog alert={alert} onClose={closeAlert} />
      
      <div className="w-full max-w-md p-10 border border-gray-100 shadow-2xl rounded-[2.5rem] bg-white text-[#262221] relative">
        <button 
          onClick={handleBackToLogin}
          className="absolute top-8 left-8 text-gray-400 hover:text-stone-800 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest cursor-pointer font-sans"
        >
          <HiChevronLeft size={20} /> Back
        </button>

        <div className="text-center mb-10 mt-4">
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-2 text-[#8B6B4A]">New Password</h2>
          <p className="text-sm text-gray-400 font-sans">Set your new account credentials</p>
        </div>
        
        <div className="space-y-6 text-left">
          <div className="relative">
            <label className={`absolute -top-2 left-3 bg-white px-1 text-[11px] font-sans ${error ? "text-red-500" : "text-gray-400"}`}>
              New Password
            </label>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••••••" 
              maxLength={25}
              onChange={(e) => { setPassword(e.target.value); if(error) setError(false); }} 
              className={`w-full border rounded-xl p-4 pr-12 text-sm outline-none transition-all font-sans ${error ? "border-red-400 ring-1 ring-red-100" : "border-gray-200 focus:border-stone-800"}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-400 hover:text-stone-800 cursor-pointer">
              {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
            </button>
          </div>

          <div className="relative">
            <label className={`absolute -top-2 left-3 bg-white px-1 text-[11px] font-sans ${error ? "text-red-500" : "text-gray-400"}`}>
              Confirm Password
            </label>
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="••••••••••••" 
              maxLength={25}
              onChange={(e) => { setConfirmPassword(e.target.value); if(error) setError(false); }} 
              className={`w-full border rounded-xl p-4 pr-12 text-sm outline-none transition-all font-sans ${error ? "border-red-400 ring-1 ring-red-100" : "border-gray-200 focus:border-stone-800"}`}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-4 text-gray-400 hover:text-stone-800 cursor-pointer">
              {showConfirmPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
            </button>
          </div>

          {error && <div className="text-red-500 text-[11px] font-bold italic mt-1 animate-pulse font-sans text-center">{errorMessage}</div>}

          <button 
            onClick={changePassword} 
            className="w-full bg-[#262221] text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs shadow-lg hover:bg-black transition-all active:scale-[0.98] mt-4 cursor-pointer"
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}