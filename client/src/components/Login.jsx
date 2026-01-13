import axios from "axios";
import React, { useState, useContext } from "react";
import { RecoveryContext } from "../App";

export default function Login() {
  const { setEmail, setPage, setOTP } = useContext(RecoveryContext);
  
  const [localEmail, setLocalEmail] = useState("");
  const [localPassword, setLocalPassword] = useState("");
  
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function nagigateToOtp(e) {
    if (e) e.preventDefault(); 

    if (localEmail) {
      const OTP = Math.floor(Math.random() * 9000 + 1000);
      
      console.log("Generated OTP:", OTP);

      axios
        .post("http://localhost:5000/send_recovery_email", {
          OTP,
          recipient_email: localEmail,
        })
        .then(() => {
          setOTP(OTP);
          setEmail(localEmail);
          setError(false);
          setPage("otp");
        })
        .catch((err) => {
          setError(true);
          setErrorMessage(err.response?.data || "An error occurred. Please try again.");
        });
      return;
    }
    
    setError(true);
    setErrorMessage("Please enter your email address first.");
  }

  return (
    <div className="flex h-screen w-screen bg-white font-serif">
      <div className="w-1/2 flex flex-col justify-center items-center px-20">
        <div className="text-center mb-8">
          <h1 className="text-3xl uppercase tracking-widest font-bold text-[#8B6B4A]">
            Matthew & Melka
          </h1>
          <p className="text-[10px] tracking-[0.2em] text-gray-500 font-sans">
            KEN SAMUDIO
          </p>
          <p className="mt-6 text-gray-600 text-sm">Inventory Management System</p>
        </div>

        <div className="w-full max-w-sm">
          <form onSubmit={(e) => e.preventDefault()}>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome!</h2>
            <p className="text-gray-400 text-sm mb-8">Please login here</p>
            
            <div className="space-y-6">
              <div className="relative">
                <label 
                  className={`absolute -top-2.5 left-3 bg-white px-1 text-[11px] transition-colors ${
                    error ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  Email or Username
                </label>
                <input 
                  type="text"
                  value={localEmail}
                  onChange={(e) => {
                    setLocalEmail(e.target.value);
                    if(error) setError(false); 
                  }}
                  className={`w-full border rounded-md p-3 text-sm outline-none transition-all ${
                    error ? "border-red-400 ring-1 ring-red-100" : "border-gray-300 focus:border-stone-800"
                  }`} 
                  placeholder="john.doe@gmail.com" 
                />
              </div>
              
              <div className="relative">
                 <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] text-gray-400">
                   Password
                 </label>
                 <input 
                   type="password" 
                   value={localPassword}
                   onChange={(e) => setLocalPassword(e.target.value)}
                   className="w-full border border-gray-300 rounded-md p-3 text-sm outline-none focus:border-stone-800" 
                   placeholder="••••••••••••" 
                 />
              </div>

              {error && (
                <p className="text-red-500 text-[11px] italic mt-[-10px]">
                  {errorMessage}
                </p>
              )}

              <div className="flex justify-between items-center text-[11px] text-gray-500 pt-2">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="mr-2 h-3 w-3 accent-stone-800" /> 
                  Remember me
                </label>
                <button 
                  type="button"
                  onClick={(e) => nagigateToOtp(e)} 
                  className="hover:underline text-gray-400 focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#262221] text-white py-3.5 rounded-md uppercase tracking-[0.2em] text-[12px] font-bold shadow-md hover:bg-black transition-colors"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>

      <div 
        className="w-1/2 bg-cover bg-center" 
        style={{ 
          backgroundImage: "url('https://ken-samudio.com/wp-content/uploads/2018/05/ken-pictorial__MG_5993-1-683x1024.jpg')" 
        }}
      >
      </div>
    </div>
  );
}