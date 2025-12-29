import React, { useContext, useState } from "react";
import { RecoveryContext } from "../App";
import axios from "axios";

export default function Reset() {
  const { email, setPage } = useContext(RecoveryContext);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function changePassword() {
    if (password !== confirmPassword) return alert("Passwords do not match!");
    
    axios.post("http://localhost:5000/update_password", {
      email: email,
      password: password
    })
    .then(() => setPage("recovered"))
    .catch(() => alert("Failed to update password."));
  }

  return (
    <div className="flex h-screen w-screen bg-white font-serif justify-center items-center">
      <div className="w-full max-w-md p-8 border border-gray-100 shadow-2xl rounded-2xl">
        <h2 className="text-3xl font-bold text-stone-800 uppercase tracking-widest mb-2">New Password</h2>
        <p className="text-gray-400 text-sm mb-8">Please enter your new password below.</p>
        
        <div className="space-y-6">
          <input 
            type="password"
            placeholder="New Password"
            className="w-full border-b border-gray-300 p-3 outline-none focus:border-stone-800"
            onChange={(e) => setPassword(e.target.value)}
          />
          <input 
            type="password"
            placeholder="Confirm Password"
            className="w-full border-b border-gray-300 p-3 outline-none focus:border-stone-800"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button 
            onClick={changePassword}
            className="w-full bg-stone-800 text-white py-4 rounded-md uppercase font-bold tracking-widest shadow-lg"
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}