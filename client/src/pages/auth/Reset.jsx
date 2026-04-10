import React, { useContext, useState } from "react";
import { RecoveryContext } from "../../context/RecoveryContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { getAuthHash } from "../../utils/hash";

export default function Reset() {
  const { email, setEmail, setOTP } = useContext(RecoveryContext);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    if (password !== confirmPassword) {
      setError(true);
      setErrorMessage("Passwords do not match!");
      return;
    }

    axios.post("http://localhost:5000/api/reset_password", { 
      email: email || sessionStorage.getItem("recoveryEmail"), 
      newPassword: password 
    })
    .then(() => {
      setError(false);
      sessionStorage.removeItem("recoveryEmail");
      sessionStorage.removeItem("recoveryOTP");
      setEmail("");
      setOTP(null);
      navigate(`/auth/${getAuthHash("recovered")}`, { replace: true });
    })
    .catch((err) => {
      setError(true);
      const backendMessage = err.response?.data?.message || err.response?.data;
      setErrorMessage(typeof backendMessage === "string" ? backendMessage : "Failed to update password. Please try again.");
    });
  }

  return (
    <div className="flex h-screen w-screen justify-center items-center font-serif bg-white overflow-hidden">
      <div className="w-full max-w-md p-10 border border-gray-100 shadow-2xl rounded-[2.5rem] bg-white text-[#262221]">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-2 text-[#8B6B4A]">New Password</h2>
          <p className="text-sm text-gray-400 font-sans">Set your new account credentials</p>
        </div>
        
        <div className="space-y-6">
          <div className="relative">
            <label className={`absolute -top-2 left-3 bg-white px-1 text-[11px] font-sans transition-colors ${error ? "text-red-500" : "text-gray-400"}`}>
              New Password
            </label>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••••••" 
              onChange={(e) => { setPassword(e.target.value); if(error) setError(false); }} 
              className={`w-full border rounded-xl p-4 pr-12 text-sm outline-none transition-all font-sans ${error ? "border-red-400 ring-1 ring-red-100" : "border-gray-200 focus:border-stone-800"}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-400 hover:text-stone-800 cursor-pointer">
              {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
            </button>
          </div>

          <div className="relative">
            <label className={`absolute -top-2 left-3 bg-white px-1 text-[11px] font-sans transition-colors ${error ? "text-red-500" : "text-gray-400"}`}>
              Confirm Password
            </label>
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="••••••••••••" 
              onChange={(e) => { setConfirmPassword(e.target.value); if(error) setError(false); }} 
              className={`w-full border rounded-xl p-4 pr-12 text-sm outline-none transition-all font-sans ${error ? "border-red-400 ring-1 ring-red-100" : "border-gray-200 focus:border-stone-800"}`}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-4 text-gray-400 hover:text-stone-800 cursor-pointer">
              {showConfirmPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
            </button>
          </div>

          {error && (
            <div className="text-red-500 text-[11px] font-bold italic mt-1 animate-pulse font-sans">
              {errorMessage}
            </div>
          )}

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