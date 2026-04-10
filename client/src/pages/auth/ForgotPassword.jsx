import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { RecoveryContext } from "../../context/RecoveryContext";

export default function ForgotPassword() {
  const { setEmail, setOTP } = useContext(RecoveryContext);
  const navigate = useNavigate();
  const [inputEmail, setInputEmail] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRecover = (e) => {
    e.preventDefault();
    
    if (!inputEmail) {
      setError(true);
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    const OTP = Math.floor(Math.random() * 9000 + 1000);

    axios
      .post("http://localhost:5000/send_recovery_email", {
        OTP,
        recipient_email: inputEmail,
      })
      .then(() => {
        setOTP(OTP);
        setEmail(inputEmail);
        sessionStorage.setItem("recoveryEmail", inputEmail);
        sessionStorage.setItem("recoveryOTP", OTP);
        setError(false);
        navigate(`/auth/${getAuthHash("otp")}`);
      })
      .catch((err) => {
        setError(true);
        setIsSubmitting(false);
        const backendMessage = err.response?.data?.message || err.response?.data;
        setErrorMessage(typeof backendMessage === "string" ? backendMessage : "Email not found or server error.");
      });
  };

  return (
    <div className="flex h-screen w-screen justify-center items-center font-serif bg-gray-50 overflow-hidden px-4">
      <div className="w-full max-w-md p-10 border border-gray-100 shadow-2xl rounded-[2.5rem] bg-white text-[#262221]">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tighter uppercase mb-2 text-[#8B6B4A]">Forgot Password</h2>
          <p className="text-sm text-gray-400 font-sans">Enter your email to receive a 4-digit recovery code.</p>
        </div>

        <form onSubmit={handleRecover} className="space-y-6">
          <div className="relative">
            <label className={`absolute -top-2 left-3 bg-white px-1 text-[11px] font-sans transition-colors ${error ? "text-red-500" : "text-gray-400"}`}>
              Email Address
            </label>
            <input 
              type="email" 
              value={inputEmail}
              onChange={(e) => { setInputEmail(e.target.value); if(error) setError(false); }} 
              className={`w-full border rounded-xl p-4 text-sm outline-none transition-all font-sans ${error ? "border-red-400 ring-1 ring-red-100" : "border-gray-200 focus:border-stone-800"}`}
            />
          </div>

          {error && (
            <div className="text-red-500 text-[11px] font-bold italic animate-pulse font-sans">
              {errorMessage}
            </div>
          )}

          <div className="space-y-3">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#262221] text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs shadow-lg hover:bg-black transition-all active:scale-[0.98] cursor-pointer disabled:bg-gray-400"
            >
              {isSubmitting ? "Sending..." : "Send Code"}
            </button>
            
            <button 
              type="button"
              onClick={() => navigate("/")}
              className="w-full text-gray-400 py-2 text-xs font-sans hover:text-stone-800 transition-colors cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}