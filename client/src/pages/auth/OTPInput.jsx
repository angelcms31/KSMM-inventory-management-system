import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { RecoveryContext } from "../../context/RecoveryContext";
import { useNavigate } from "react-router-dom";
import { HiOutlineEye, HiOutlineEyeOff, HiChevronLeft } from "react-icons/hi";
import { getAuthHash } from "../../utils/hash";

export default function OTPInput() {
  const { email, setEmail, otp, setOTP } = useContext(RecoveryContext);
  const navigate = useNavigate();

  const [timerCount, setTimer] = useState(60);
  const [expireCount, setExpireCount] = useState(180);
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
  const redirectTimerRef = useRef(null);

  useEffect(() => {
    if (!email) {
      navigate(`/auth/${getAuthHash("login")}`, { replace: true });
    }

    window.history.pushState(null, null, window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, null, window.location.href);
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [email, navigate]);

  const startTimers = () => {
    setTimer(60);
    setExpireCount(180);
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
          redirectTimerRef.current = setTimeout(() => {
            sessionStorage.clear();
            setEmail("");
            setOTP(null);
            navigate(`/auth/${getAuthHash("login")}`, { replace: true });
          }, 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (email) startTimers();
    return () => {
      clearInterval(resendTimerRef.current);
      clearInterval(expireTimerRef.current);
      clearTimeout(redirectTimerRef.current);
    };
  }, [email]);

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
    if (parseInt(inputCode) === otp) {
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
    newOtp[index] = value.substring(value.length - 1).replace(/[^0-9]/g, "");
    setOTPinput(newOtp);
    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !OTPinput[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
    if (e.key === "Enter") verifyOTP();
  };

  const handlePaste = (e) => {
    const data = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(data)) return;
    const pasteValues = data.split("").slice(0, 4);
    let newOtp = [...OTPinput];
    pasteValues.forEach((char, index) => { newOtp[index] = char; });
    setOTPinput(newOtp);
    const nextFocusIndex = pasteValues.length < 4 ? pasteValues.length : 3;
    inputRefs[nextFocusIndex].current.focus();
  };

  const resendOTP = () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    clearTimeout(redirectTimerRef.current);
    const newOTP = Math.floor(Math.random() * 9000 + 1000);
    axios.post("http://localhost:5000/send_recovery_email", {
      OTP: newOTP,
      recipient_email: email,
    }).then(() => {
      setOTP(newOTP);
      setOTPinput(["", "", "", ""]);
      startTimers();
      inputRefs[0].current.focus();
    }).catch(() => {
      setIsResending(false);
      setError(true);
      setErrorMessage("Failed to resend OTP. Please try again.");
    });
  };

  const handleBack = () => {
    setEmail("");
    setOTP(null);
    sessionStorage.clear();
    navigate(`/auth/${getAuthHash("forgotpassword")}`, { replace: true });
  };

  return (
    <div className="flex justify-center items-center w-screen h-screen font-serif bg-white overflow-hidden px-4">
      <div className="bg-white p-10 shadow-2xl rounded-[2.5rem] w-full max-w-md text-center border border-gray-100 relative">
        <button 
          onClick={handleBack}
          className="absolute top-8 left-8 text-gray-400 hover:text-stone-800 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-widest cursor-pointer"
        >
          <HiChevronLeft size={20} />
          Back
        </button>

        <div className="mt-8">
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter text-[#8B6B4A]">Verification</h2>
          <p className="text-sm font-medium text-gray-400 mb-2 font-sans">We sent a code to {email}</p>

          <p className={`text-[10px] font-black uppercase tracking-widest mb-10 font-sans ${isExpired ? "text-red-500" : "text-stone-400"}`}>
            {isExpired ? "Code Expired. Redirecting..." : `Valid for: ${formatExpireTimer(expireCount)}`}
          </p>

          <div className="flex justify-center mb-8 space-x-3">
            {OTPinput.map((data, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength="1"
                className={`w-14 h-16 border text-center rounded-xl text-2xl font-black outline-none transition-all font-sans disabled:opacity-50 ${error ? "border-red-400 ring-1 ring-red-100" : "border-gray-200 focus:border-stone-800 focus:bg-gray-50"}`}
                value={data}
                disabled={isExpired}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
              />
            ))}
          </div>

          {error && (
            <div className="text-red-500 text-[11px] font-bold italic mb-6 animate-pulse font-sans">{errorMessage}</div>
          )}

          <button
            onClick={verifyOTP}
            disabled={isExpired || isSubmitting}
            className="w-full bg-[#262221] text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs shadow-lg hover:bg-black transition-all active:scale-[0.98] mb-8 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Verifying..." : "Verify Account"}
          </button>

          <div className="text-center text-xs font-sans">
            <p className="text-gray-400 mb-2 uppercase tracking-widest text-[9px] font-black">Didn't receive code?</p>
            <button
              onClick={resendOTP}
              disabled={!canResend || isResending}
              className={`font-black uppercase tracking-widest transition-all ${(!canResend || isResending) ? "text-gray-200 cursor-not-allowed" : "text-stone-800 hover:text-black cursor-pointer underline"}`}
            >
              {isResending ? "Sending..." : (!canResend ? `Resend in ${timerCount}s` : "Resend OTP")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}