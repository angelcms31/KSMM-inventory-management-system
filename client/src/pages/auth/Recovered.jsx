import React from "react";
import { useNavigate } from "react-router-dom";

export default function Recovered() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-screen justify-center items-center font-serif">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 uppercase">Success!</h1>
        <p className="text-gray-500 mb-8">Your password has been successfully reset.</p>
        <button onClick={() => navigate("/")} className="bg-stone-800 text-white px-10 py-3 rounded-md font-bold uppercase">Back to Login</button>
      </div>
    </div>
  );
}