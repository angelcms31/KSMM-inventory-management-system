import axios from "axios";
import React, { useState, useContext, useEffect } from "react";
import { RecoveryContext } from "../../context/RecoveryContext";
import { useNavigate } from "react-router-dom";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";

export default function Login() {
  const { setEmail, setOTP } = useContext(RecoveryContext);
  const navigate = useNavigate();

  const [localEmail, setLocalEmail] = useState("");
  const [localPassword, setLocalPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setLocalEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    
    if (!localEmail || !localPassword) {
      setError(true);
      setErrorMessage("Please enter your email and password.");
      return;
    }

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", localEmail);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    axios
      .post("http://localhost:5000/login", {
        email: localEmail,
        password: localPassword,
      })
      .then((res) => {
        const { role, firstName, firstname, user_id } = res.data;
        const nameToSave = firstName || firstname;
        setError(false);

        localStorage.setItem("userName", nameToSave || "User");
        localStorage.setItem("userRole", role);
        localStorage.setItem("userId", user_id);

        const userRole = role.toLowerCase();
        if (userRole === "admin") navigate("/admin");
        else if (userRole === "sales") navigate("/sales");
        else if (userRole === "production") navigate("/production");
        else if (userRole === "finance") navigate("/finance");
        else {
          setError(true);
          setErrorMessage("Your role is not recognized: " + role);
        }
      })
      .catch((err) => {
        setError(true);
        const backendMessage = err.response?.data?.message || err.response?.data;
        setErrorMessage(typeof backendMessage === 'string' ? backendMessage : "Incorrect email or password.");
      });
  };

  const navigateToOtp = (e) => {
    if (e) e.preventDefault(); 
    if (!localEmail) {
      setError(true);
      setErrorMessage("Please enter your email first for recovery.");
      return;
    }

    const OTP = Math.floor(Math.random() * 9000 + 1000);
    axios.post("http://localhost:5000/send_recovery_email", {
        OTP,
        recipient_email: localEmail,
      })
      .then(() => {
        setOTP(OTP);
        setEmail(localEmail);
        setError(false);
        navigate("/otp");
      })
      .catch((err) => {
        setError(true);
        const backendMessage = err.response?.data?.message || err.response?.data;
        setErrorMessage(typeof backendMessage === 'string' ? backendMessage : "Failed to send recovery email. Please try again.");
      });
  };

  return (
    <div className="flex h-screen w-screen bg-white font-serif overflow-hidden">
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-10 md:px-20 text-[#262221]">
        <div className="text-center mb-10">
          <h1 className="text-3xl uppercase tracking-[0.3em] font-bold text-[#8B6B4A]">
            Matthew & Melka
          </h1>
          <p className="text-[10px] tracking-[0.2em] text-gray-400 font-sans mt-2">
            KEN SAMUDIO
          </p>
          <p className="mt-8 text-gray-500 text-sm italic">Inventory Management System</p>
        </div>

        <div className="w-full max-sm:">
          <form onSubmit={handleLogin}>
            <h2 className="text-2xl font-bold mb-1 tracking-tight">Welcome!</h2>
            <p className="text-gray-400 text-sm mb-10 font-sans">Please login here</p>
            
            <div className="space-y-7">
              <div className="relative">
                <label className={`absolute -top-2.5 left-3 bg-white px-1 text-[11px] transition-colors ${error ? "text-red-500" : "text-gray-400"}`}>
                  Email or Username
                </label>
                <input 
                  type="text"
                  value={localEmail}
                  onChange={(e) => {
                    setLocalEmail(e.target.value);
                    if(error) setError(false); 
                  }}
                  className={`w-full border rounded-md p-3.5 text-sm outline-none transition-all ${error ? "border-red-400 ring-1 ring-red-100" : "border-gray-200 focus:border-stone-800"}`} 
                  placeholder="john.doe@gmail.com" 
                />
              </div>
              
              <div className="relative">
                 <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] text-gray-400">
                    Password
                 </label>
                 <input 
                   type={showPassword ? "text" : "password"} 
                   value={localPassword}
                   onChange={(e) => {
                     setLocalPassword(e.target.value);
                     if(error) setError(false);
                   }}
                   className="w-full border border-gray-200 rounded-md p-3.5 pr-12 text-sm outline-none focus:border-stone-800" 
                   placeholder="••••••••••••" 
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-4 top-3.5 text-gray-400 hover:text-stone-800"
                 >
                   {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                 </button>
              </div>

              {error && (
                <div className="text-red-500 text-[11px] italic mt-[-15px] animate-pulse">
                  {errorMessage}
                </div>
              )}

              <div className="flex justify-between items-center text-[11px] text-gray-500 pt-1">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mr-2 h-3.5 w-3.5 accent-stone-800" 
                  /> 
                  Remember me
                </label>
                <button 
                  type="button"
                  onClick={navigateToOtp} 
                  className="hover:underline text-gray-400 focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#262221] text-white py-4 rounded-md uppercase tracking-[0.2em] text-[12px] font-bold shadow-lg hover:bg-black transition-all active:scale-[0.98]"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>

      <div 
        className="hidden md:block w-1/2 bg-cover bg-center transition-all duration-700" 
        style={{ 
          backgroundImage: "url('https://ken-samudio.com/wp-content/uploads/2018/05/ken-pictorial__MG_5993-1-683x1024.jpg')" 
        }}
      >
      </div>
    </div>
  );
}