import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { RecoveryContext } from "../App";

export default function OTPInput() {
  const { email, otp, setPage } = useContext(RecoveryContext);
  const [timerCount, setTimer] = useState(60);
  const [OTPinput, setOTPinput] = useState(["", "", "", ""]);
  const [disable, setDisable] = useState(true);

  function resendOTP() {
    if (disable) return;
    axios.post("http://localhost:5000/send_recovery_email", {
      OTP: otp,
      recipient_email: email,
    })
    .then(() => {
      setDisable(true);
      setTimer(60);
      alert("A new OTP has been sent to your email.");
    })
    .catch(console.log);
  }

  function verifyOTP() {
    if (parseInt(OTPinput.join("")) === otp) {
      setPage("reset");
      return;
    }
    alert("The code you entered is incorrect.");
  }

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
    <div className="flex justify-center items-center w-screen h-screen bg-gray-50 font-serif">
      <div className="bg-white px-6 pt-10 pb-9 shadow-xl mx-auto w-full max-w-lg rounded-2xl border border-gray-100">
        <div className="flex flex-col items-center justify-center text-center space-y-2 mb-10">
          <h2 className="font-bold text-3xl text-stone-800 uppercase tracking-widest">Verification</h2>
          <p className="text-sm font-medium text-gray-400">We sent a code to {email}</p>
        </div>

        <div className="flex flex-row items-center justify-between mx-auto w-full max-w-xs mb-10">
          {OTPinput.map((data, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              className="w-16 h-16 flex flex-col items-center justify-center text-center px-5 outline-none rounded-xl border border-gray-200 text-lg bg-white focus:bg-gray-50 focus:ring-1 ring-stone-800"
              value={data}
              onChange={(e) => {
                let newOtp = [...OTPinput];
                newOtp[index] = e.target.value;
                setOTPinput(newOtp);
              }}
            />
          ))}
        </div>

        <button onClick={verifyOTP} className="w-full bg-stone-800 text-white py-4 rounded-xl uppercase tracking-widest font-bold mb-6">
          Verify Account
        </button>

        <div className="text-center text-sm">
          <p className="text-gray-500">Didn't receive code?</p>
          <button 
            disabled={disable}
            onClick={resendOTP}
            className={`font-bold ${disable ? "text-gray-300" : "text-stone-800 underline"}`}
          >
            {disable ? `Resend OTP in ${timerCount}s` : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}