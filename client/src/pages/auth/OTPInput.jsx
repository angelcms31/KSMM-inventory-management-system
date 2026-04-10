import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { RecoveryContext } from "../../context/RecoveryContext";
import { useNavigate } from "react-router-dom";
import { getAuthHash } from "../../utils/hash";

export default function OTPInput() {
  const { email, setEmail, otp, setOTP } = useContext(RecoveryContext);
  const navigate = useNavigate();
  
  const [timerCount, setTimer] = useState(60);
  const [expireCount, setExpireCount] = useState(300); 
  const [OTPinput, setOTPinput] = useState(["", "", "", ""]);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false); 
  const [isExpired, setIsExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const resendTimerRef = useRef(null);
  const expireTimerRef = useRef(null);

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("recoveryEmail");
    const savedOTP = sessionStorage.getItem("recoveryOTP");

    if (savedEmail && !email) {
      setEmail(savedEmail);
    }
    if (savedOTP && !otp) {
      setOTP(parseInt(savedOTP));
    }

    if (!savedEmail && !email) {
      navigate("/");
    }
  }, [email, otp, setEmail, setOTP, navigate]);

  const startTimers = () => {
    setTimer(60);
    setExpireCount(300);
    setCanResend(false);
    setIsResending(false); 
    setIsExpired(false);
    setIsSubmitting(false);
    setError(false);

    clearInterval(resendTimerRef.current);
    resendTimerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    clearInterval(expireTimerRef.current);
    expireTimerRef.current = setInterval(() => {
      setExpireCount((prev) => {
        if (prev <= 1) {
          clearInterval(expireTimerRef.current);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startTimers();
    return () => {
      clearInterval(resendTimerRef.current);
      clearInterval(expireTimerRef.current);
    };
  }, []);

  const formatExpireTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  function verifyOTP() {
    if (isExpired) {
      setError(true);
      setErrorMessage("The code has expired. Please request a new one.");
      return;
    }

    const inputCode = OTPinput.join("");
    if (inputCode.length < 4) {
      setError(true);
      setErrorMessage("Please enter the full 4-digit code.");
      return;
    }

    setIsSubmitting(true);
    const currentOTP = otp || parseInt(sessionStorage.getItem("recoveryOTP"));

    if (parseInt(inputCode) === currentOTP) {
      navigate(`/auth/${getAuthHash("reset")}`);
    } else {
      setError(true);
      setErrorMessage("The code you entered is incorrect.");
      setIsSubmitting(false);
    }
  }

  const handleChange = (value, index) => {
    if (error) setError(false);
    let newOtp = [...OTPinput];
    newOtp[index] = value.substring(value.length - 1);
    setOTPinput(newOtp);
    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !OTPinput[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
    if (e.key === "Enter") {
      verifyOTP();
    }
  };

  const handlePaste = (e) => {
    const data = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(data)) return; 
    const pasteValues = data.split("").slice(0, 4); 
    let newOtp = [...OTPinput];
    pasteValues.forEach((char, index) => {
      newOtp[index] = char;
    });
    setOTPinput(newOtp);
    const nextFocusIndex = pasteValues.length < 4 ? pasteValues.length : 3;
    inputRefs[nextFocusIndex].current.focus();
  };

  const resendOTP = () => {
    if (!canResend || isResending) return;
    setIsResending(true); 
    const newOTP = Math.floor(Math.random() * 9000 + 1000);
    axios.post("http://localhost:5000/send_recovery_email", {
      OTP: newOTP,
      recipient_email: email,
    }).then(() => {
      setOTP(newOTP);
      sessionStorage.setItem("recoveryOTP", newOTP);
      setOTPinput(["", "", "", ""]);
      startTimers();
      inputRefs[0].current.focus();
    }).catch(() => {
      setIsResending(false); 
      setError(true);
      setErrorMessage("Failed to resend OTP. Please try again.");
    });
  };

  return (
    <div className="flex justify-center items-center w-screen h-screen font-serif bg-gray-50 overflow-hidden">
      <div className="bg-white p-10 shadow-xl rounded-2xl w-full max-w-lg text-center border border-gray-100">
        <h2 className="text-3xl font-bold mb-4 uppercase tracking-widest text-stone-800">Verification</h2>
        <p className="text-sm font-medium text-gray-400 mb-2">We sent a code to {email}</p>
        
        <p className={`text-xs font-bold mb-10 ${isExpired ? "text-red-500" : "text-stone-500"}`}>
          {isExpired ? "Code Expired" : `Code expires in: ${formatExpireTimer(expireCount)}`}
        </p>

        <div className="flex justify-center mb-6 space-x-4">
          {OTPinput.map((data, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              className={`w-16 h-16 border text-center rounded-xl text-2xl bg-white outline-none transition-all disabled:opacity-50 ${error ? "border-red-400 ring-1 ring-red-100" : "border-gray-200 focus:ring-1 focus:ring-stone-800 focus:bg-gray-50"}`}
              value={data}
              disabled={isExpired}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
            />
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-[11px] font-bold italic mb-6 animate-pulse">
            {errorMessage}
          </div>
        )}

        <button
          onClick={verifyOTP}
          disabled={isExpired || isSubmitting}
          className="w-full bg-stone-800 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-black transition-colors mb-6 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? "Verifying..." : "Verify Account"}
        </button>

        <div className="text-center text-sm">
          <p className="text-gray-500 mb-2">Didn't receive code?</p>
          <button
            onClick={resendOTP}
            disabled={!canResend || isResending}
            className={`font-bold transition-colors ${(!canResend || isResending) ? "text-gray-300 cursor-not-allowed" : "text-stone-800 underline cursor-pointer"}`}
          >
            {isResending ? "Sending..." : (!canResend ? `Resend OTP in ${timerCount}s` : "Resend OTP")}
          </button>
        </div>
      </div>
    </div>
  );
}