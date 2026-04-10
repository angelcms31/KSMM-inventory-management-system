import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHash } from "../../utils/hash";

export default function Recovered() {
  const navigate = useNavigate();

  useEffect(() => {
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function () {
      window.history.go(1);
    };
  }, []);

  const handleBackToLogin = () => {
    navigate(`/auth/${getAuthHash("login")}`, { replace: true });
  };

  return (
    <div className="flex h-screen w-screen justify-center items-center font-serif bg-white overflow-hidden px-4">
      <div className="w-full max-w-md p-10 border border-gray-100 shadow-2xl rounded-[2.5rem] bg-white text-[#262221] text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h1 className="text-3xl font-black tracking-tighter uppercase mb-4 text-[#8B6B4A]">Success!</h1>
        <p className="text-sm text-gray-400 font-sans mb-10 leading-relaxed">
          Your password has been successfully reset. You can now use your new credentials to access your account.
        </p>

        <button 
          onClick={handleBackToLogin}
          className="w-full bg-[#262221] text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs shadow-lg hover:bg-black transition-all active:scale-[0.98] cursor-pointer"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}