import React, { useContext, useState } from "react";
import { RecoveryContext } from "../../App";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Reset() {
  const { email } = useContext(RecoveryContext);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function changePassword() {
    if (password !== confirmPassword) return alert("Passwords do not match!");
    axios.post("http://localhost:5000/update_password", { email, password })
      .then(() => navigate("/recovered"))
      .catch(() => alert("Failed to update password."));
  }

  return (
    <div className="flex h-screen w-screen justify-center items-center font-serif">
      <div className="w-full max-w-md p-8 border shadow-2xl rounded-2xl">
        <h2 className="text-3xl font-bold mb-8 uppercase">New Password</h2>
        <input type="password" placeholder="New Password" onChange={(e) => setPassword(e.target.value)} className="w-full border-b p-3 mb-6 outline-none" />
        <input type="password" placeholder="Confirm Password" onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border-b p-3 mb-10 outline-none" />
        <button onClick={changePassword} className="w-full bg-stone-800 text-white py-4 rounded-md font-bold uppercase">Reset Password</button>
      </div>
    </div>
  );
}