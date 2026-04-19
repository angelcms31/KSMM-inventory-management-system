import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHash } from "../../utils/hash";
import { RecoveryContext } from "../../context/RecoveryContext";
import { useContext } from "react";

export default function ForgotPassword() {
  const { setEmail, setOTP } = useContext(RecoveryContext);
  const navigate = useNavigate();
  const [inputEmail, setInputEmail] = useState("");
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const idleTimerRef = useRef(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem("device_remembered_email");
    if (savedEmail) setInputEmail(savedEmail);

    idleTimerRef.current = setTimeout(() => {
      sessionStorage.removeItem("recoveryEmail");
      sessionStorage.removeItem("recoveryOTP");
      navigate(`/auth/${getAuthHash("login")}`);
    }, 180000);

    const resetIdleTimer = () => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        sessionStorage.removeItem("recoveryEmail");
        sessionStorage.removeItem("recoveryOTP");
        navigate(`/auth/${getAuthHash("login")}`);
      }, 180000);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetIdleTimer));

    return () => {
      clearTimeout(idleTimerRef.current);
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
    };
  }, []);

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!inputEmail) {
      setError(true);
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsSending(true);
    const OTP = Math.floor(Math.random() * 9000 + 1000);
    axios.post("http://localhost:5000/send_recovery_email", { OTP, recipient_email: inputEmail })
      .then(() => {
        setOTP(OTP);
        setEmail(inputEmail);
        sessionStorage.setItem("recoveryEmail", inputEmail);
        sessionStorage.setItem("recoveryOTP", OTP);
        setError(false);
        navigate(`/auth/${getAuthHash("otp")}`);
      })
      .catch((err) => {
        setIsSending(false);
        setError(true);
        const backendMessage = err.response?.data?.message || err.response?.data;
        setErrorMessage(typeof backendMessage === "string" ? backendMessage : "Failed to send recovery email. Please try again.");
      });
  };

  return (
    <div className="flex justify-center items-center w-screen h-screen font-serif bg-gray-50 overflow-hidden">
      <div className="bg-white p-10 shadow-xl rounded-2xl w-full max-w-md text-center border border-gray-100">
        <h2 className="text-3xl font-bold mb-3 uppercase tracking-widest text-[#8B6B4A]">Forgot Password</h2>
        <p className="text-sm text-gray-400 mb-8">Enter your email to receive a 4-digit recovery code.</p>

        <form onSubmit={handleSendCode} className="space-y-5 text-left">
          <div className="relative">
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] text-gray-400">Email Address</label>
            <input
              type="text"
              maxLength={30}
              value={inputEmail}
              onChange={(e) => { setInputEmail(e.target.value); if (error) setError(false); }}
              className={`w-full border rounded-md p-3.5 text-sm outline-none transition-all ${error ? "border-red-400 ring-1 ring-red-100" : "border-gray-200 focus:border-stone-800"}`}
            />
          </div>

          {error && (
            <div className="text-red-500 text-[11px] font-bold italic animate-pulse">{errorMessage}</div>
          )}

          <button
            type="submit"
            disabled={isSending}
            className="w-full bg-[#262221] text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSending ? "Sending..." : "Send Code"}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/auth/${getAuthHash("login")}`)}
            className="w-full text-center text-sm text-gray-400 hover:text-stone-800 transition-colors cursor-pointer"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}