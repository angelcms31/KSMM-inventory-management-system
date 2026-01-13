import React from "react";

export default function Recovered() {
  return (
    <div className="flex h-screen w-screen bg-white font-serif justify-center items-center">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-100 p-6">
            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-stone-800 uppercase tracking-widest mb-4">Success!</h1>
        <p className="text-gray-500 mb-8">Your password has been successfully reset.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-stone-800 text-white px-10 py-3 rounded-md uppercase font-bold text-sm tracking-widest"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}