import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { RecoveryContext } from "../../App";
import { useNavigate } from "react-router-dom";

export default function OTPInput() {
  const { email, otp } = useContext(RecoveryContext);
  const navigate = useNavigate();
  const [timerCount, setTimer] = useState(60);
  const [OTPinput, setOTPinput] = useState(["", "", "", ""]);
  const [disable, setDisable] = useState(true);

  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  function verifyOTP() {
    if (parseInt(OTPinput.join("")) === otp) {
      navigate("/reset");
      return;
    }
    alert("The code you entered is incorrect.");
  }

  const handleChange = (value, index) => {
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
  };

  useEffect(() => {
    let interval = setInterval(() => {
      setTimer((lastTimerCount) => {
        if (lastTimerCount <= 1) {
          clearInterval(interval);
          setDisable(false);
        }
        return lastTimerCount <= 0 ? lastTimerCount : lastTimerCount - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [disable]);

  return (
    <div className="flex justify-center items-center w-screen h-screen font-serif bg-gray-50">
      <div className="bg-white p-10 shadow-xl rounded-2xl w-full max-w-lg text-center">
        <h2 className="text-3xl font-bold mb-4 uppercase tracking-widest text-stone-800">Verification</h2>
        <p className="text-sm font-medium text-gray-400 mb-10">We sent a code to {email}</p>
        
        <div className="flex justify-between mb-10 space-x-2">
          {OTPinput.map((data, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              maxLength="1"
              className="w-16 h-16 border border-gray-200 text-center rounded-xl text-2xl bg-white outline-none focus:ring-1 focus:ring-stone-800 focus:bg-gray-50 transition-all"
              value={data}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>

        <button 
          onClick={verifyOTP} 
          className="w-full bg-stone-800 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-black transition-colors mb-6"
        >
          Verify Account
        </button>

        <div className="text-center text-sm">
          <p className="text-gray-500 mb-2">Didn't receive code?</p>
          <button 
            disabled={disable}
            className={`font-bold ${disable ? "text-gray-300" : "text-stone-800 underline cursor-pointer"}`}
          >
            {disable ? `Resend OTP in ${timerCount}s` : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}