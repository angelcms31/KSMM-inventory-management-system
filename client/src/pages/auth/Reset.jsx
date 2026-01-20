import React, { useContext, useState } from "react";
import { RecoveryContext } from "../../context/RecoveryContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Reset() {
  const { email } = useContext(RecoveryContext);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function changePassword() {
    if (!password || !confirmPassword) return alert("Please fill in all fields.");
    if (password !== confirmPassword) return alert("Passwords do not match!");

    axios.post("http://localhost:5000/api/reset_password", { 
      email: email, 
      newPassword: password 
    })
    .then(() => {
      navigate("/recovered");
    })
    .catch((err) => {
      console.error(err);
      alert("Failed to update password. Please try again.");
    });
  }

  return (
    <div className="flex h-screen w-screen justify-center items-center font-serif bg-white">
      <div className="w-full max-w-md p-10 border border-gray-100 shadow-2xl rounded-[2.5rem] bg-white text-[#262221]">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">New Password</h2>
          <p className="text-sm text-gray-400 font-sans">Set your new account credentials</p>
        </div>
        
        <div className="space-y-6">
          <div className="relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] text-gray-400 font-sans">New Password</label>
            <input 
              type="password" 
              placeholder="••••••••••••" 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-stone-800 transition-all font-sans" 
            />
          </div>

          <div className="relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[11px] text-gray-400 font-sans">Confirm Password</label>
            <input 
              type="password" 
              placeholder="••••••••••••" 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="w-full border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-stone-800 transition-all font-sans" 
            />
          </div>

          <button 
            onClick={changePassword} 
            className="w-full bg-[#262221] text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs shadow-lg hover:bg-black transition-all active:scale-[0.98] mt-4"
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}