import axios from "axios";
import React, { useState, useContext, useEffect } from "react";
import { RecoveryContext } from "../../context/RecoveryContext";
import { useNavigate } from "react-router-dom";
import { HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";
import { getHashedRole, getAuthHash } from "../../utils/hash";

export default function Login() {
  const { setEmail, setOTP } = useContext(RecoveryContext);
  const navigate = useNavigate();

  const [localEmail, setLocalEmail] = useState("");
  const [localPassword, setLocalPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pendingUserId, setPendingUserId] = useState(null);
  const [pendingRole, setPendingRole] = useState(null);
  const [defaultPassword, setDefaultPassword] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("device_remembered_email");
    if (savedEmail) {
      setLocalEmail(savedEmail);
    }
  }, []);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setLocalEmail(val);
    if (error) setError(false);
  };

  const redirectByRole = (role) => {
    const hashedRole = getHashedRole(role.toLowerCase());
    if (hashedRole) {
      navigate(`/dashboard/${hashedRole}`, { replace: true });
    } else {
      setError(true);
      setErrorMessage("Access denied: Invalid role configuration.");
    }
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();

    if (!localEmail || !localPassword) {
      setError(true);
      setErrorMessage("Please enter your email and password.");
      return;
    }

    axios
      .post("http://localhost:5000/login", {
        email: localEmail,
        password: localPassword,
      })
      .then((res) => {
        const { role, firstName, firstname, user_id, is_default_password, is_head_admin } = res.data;
        const nameToSave = firstName || firstname;
        setError(false);

        localStorage.setItem("device_remembered_email", localEmail);
        localStorage.setItem("userName", nameToSave || "User");
        localStorage.setItem("userRole", role);
        localStorage.setItem("user_id", user_id);
        localStorage.setItem("is_head_admin", is_head_admin);

        if (is_default_password) {
          setPendingUserId(user_id);
          setPendingRole(role);
          setDefaultPassword(localPassword);
          setShowChangePassword(true);
          return;
        }

        redirectByRole(role);
      })
      .catch((err) => {
        setError(true);
        const backendMessage = err.response?.data?.message || err.response?.data;
        setErrorMessage(typeof backendMessage === "string" ? backendMessage : "Incorrect email or password.");
      });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword === defaultPassword) {
      setError(true);
      setErrorMessage("Please enter a different password.");
      return;
    }

    if (newPassword.length < 8) {
      setError(true);
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(true);
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/change_password", {
        user_id: pendingUserId,
        new_password: newPassword,
      });
      setError(false);
      setShowChangePassword(false);
      redirectByRole(pendingRole);
    } catch (err) {
      setError(true);
      const backendMessage = err.response?.data?.message || err.response?.data;
      setErrorMessage(typeof backendMessage === "string" ? backendMessage : "Failed to update password. Please try again.");
    }
  };

  const navigateToOtp = (e) => {
    if (e) e.preventDefault();
    
    if (!localEmail) {
      navigate(`/auth/${getAuthHash("forgot")}`);
      return;
    }

    const OTP = Math.floor(Math.random() * 9000 + 1000);
    axios
      .post("http://localhost:5000/send_recovery_email", {
        OTP,
        recipient_email: localEmail,
      })
      .then(() => {
        setOTP(OTP);
        setEmail(localEmail);
        sessionStorage.setItem("recoveryEmail", localEmail);
        sessionStorage.setItem("recoveryOTP", OTP);
        setError(false);
        navigate(`/auth/${getAuthHash("otp")}`);
      })
      .catch((err) => {
        setError(true);
        const backendMessage = err.response?.data?.message || err.response?.data;
        setErrorMessage(typeof backendMessage === "string" ? backendMessage : "Failed to send recovery email. Please try again.");
      });
  };

  if (showChangePassword) {
    return (
      <div className="flex h-screen w-screen bg-white font-serif overflow-hidden">
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 md:px-20 text-[#262221]">
          <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl uppercase tracking-[0.3em] font-bold text-[#8B6B4A]">
              Matthew & Melka
            </h1>
            <p className="text-[10px] tracking-[0.2em] text-gray-400 font-sans mt-2 uppercase">Ken Samudio</p>
          </div>

          <div className="w-full max-w-md">
            <form onSubmit={handleChangePassword} autoComplete="off">
              <h2 className="text-xl md:text-2xl font-bold mb-1 tracking-tight">Set New Password</h2>
              <p className="text-gray-400 text-xs md:text-sm mb-10 font-sans">
                For security, please change your default password before continuing.
              </p>

              <div className="space-y-7">
                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] text-gray-400">
                    New Password
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    maxLength={24}
                    autoComplete="new-password"
                    onChange={(e) => { setNewPassword(e.target.value); if (error) setError(false); }}
                    className={`w-full border rounded-md p-3.5 pr-12 text-sm outline-none transition-all ${error ? "border-red-400 ring-1 ring-red-100" : "border-gray-200 focus:border-stone-800"}`}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-stone-800 cursor-pointer">
                    {showNewPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                  </button>
                </div>

                <div className="relative">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] text-gray-400">
                    Confirm New Password
                  </label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    maxLength={24}
                    autoComplete="new-password"
                    onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(false); }}
                    className={`w-full border rounded-md p-3.5 pr-12 text-sm outline-none transition-all ${error ? "border-red-400 ring-1 ring-red-100" : "border-gray-200 focus:border-stone-800"}`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-stone-800 cursor-pointer">
                    {showConfirmPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                  </button>
                </div>

                {error && (
                  <div className="text-red-500 text-[11px] italic mt-[-15px] animate-pulse">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full cursor-pointer bg-[#262221] text-white py-4 rounded-md uppercase tracking-[0.2em] text-[12px] font-bold shadow-lg hover:bg-stone-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  Save & Continue
                </button>
              </div>
            </form>
          </div>
        </div>

        <div
          className="hidden md:block w-1/2 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: "url('https://silverkris.singaporeair.com/wp-content/uploads/2019/10/Ken-Samudio.jpg')" }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-white font-serif overflow-hidden">
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 md:px-20 text-[#262221]">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl uppercase tracking-[0.3em] font-bold text-[#8B6B4A]">
            Matthew & Melka
          </h1>
          <p className="text-[10px] tracking-[0.2em] text-gray-400 font-sans mt-2 uppercase">Ken Samudio</p>
          <p className="mt-8 text-gray-500 text-xs md:text-sm italic">Inventory Management System</p>
        </div>

        <div className="w-full max-w-md">
          <form onSubmit={handleLogin} autoComplete="on">
            <h2 className="text-xl md:text-2xl font-bold mb-1 tracking-tight">Welcome!</h2>
            <p className="text-gray-400 text-sm mb-10 font-sans">Please login here</p>

            <div className="space-y-7">
              <div className="relative">
                <label className={`absolute -top-2.5 left-3 bg-white px-1 text-[11px] transition-colors ${error ? "text-red-500" : "text-gray-400"}`}>
                  Email
                </label>
                <input
                  type="text"
                  name="email"
                  maxLength={30}
                  autoComplete="email"
                  value={localEmail}
                  onChange={handleEmailChange}
                  className={`w-full border rounded-md p-3.5 text-sm outline-none transition-all ${error ? "border-red-400 ring-1 ring-red-100" : "border-gray-200 focus:border-stone-800"}`}
                />
              </div>

              <div className="relative">
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] text-gray-400">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  maxLength={24}
                  autoComplete="current-password"
                  value={localPassword}
                  onChange={(e) => { setLocalPassword(e.target.value); if (error) setError(false); }}
                  className="w-full border border-gray-200 rounded-md p-3.5 pr-12 text-sm outline-none focus:border-stone-800 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-stone-800 cursor-pointer transition-colors"
                >
                  {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
                </button>
              </div>

              {error && (
                <div className="text-red-500 text-[11px] font-bold italic mt-[-15px] animate-pulse">
                  {errorMessage}
                </div>
              )}

              <div className="flex justify-between items-center text-[11px] text-gray-500 pt-1">
                <button
                  type="button"
                  onClick={navigateToOtp}
                  className="hover:underline hover:text-stone-800 text-gray-400 focus:outline-none cursor-pointer transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full cursor-pointer bg-[#262221] text-white py-4 rounded-md uppercase tracking-[0.2em] text-[12px] font-bold shadow-lg hover:bg-black hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className="hidden md:block w-1/2 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: "url('https://silverkris.singaporeair.com/wp-content/uploads/2019/10/Ken-Samudio.jpg')" }}
      />
    </div>
  );
}