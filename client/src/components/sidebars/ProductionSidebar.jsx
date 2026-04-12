import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  HiOutlineHome,
  HiOutlineCube,
  HiOutlineTruck,
  HiOutlineLogout
} from "react-icons/hi";
import { getHashedPath } from "../../utils/hash";

const ProductionSidebar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState("User");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    const savedName = localStorage.getItem("userName");
    if (savedName) setUserName(savedName);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { name: 'Home', tab: 'home', icon: <HiOutlineHome size={18} /> },
    { name: 'Artisan', tab: 'artisan', icon: <HiOutlineCube size={18} /> },
    { name: 'Work Order Inventory', tab: 'inventory', icon: <HiOutlineTruck size={18} /> },
  ];

  const getPath = (tab) => `/dashboard/${getHashedPath('production', tab)}`;

  const isActive = (tab) => location.pathname === getPath(tab);

  const handleLogout = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      const role = localStorage.getItem("userRole");
      if (userId) {
        await axios.post("http://localhost:5000/api/logout", { userId, role });
      }
      localStorage.clear();
      window.history.pushState(null, null, window.location.href);
      window.onpopstate = function () {
        window.history.go(1);
      };
      navigate("/", { replace: true });
      window.location.reload();
    } catch (err) {
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  return (
    <>
      <div className="hidden lg:flex w-[240px] h-screen bg-[#262221] text-white flex-col sticky top-0 left-0 font-sans overflow-hidden border-r border-white/5">
        <div className="pt-10 pb-8 px-6">
          <h3 className="text-[18px] font-bold leading-tight tracking-tight capitalize">
            Welcome back,<br />{userName}!
          </h3>
          <p className="text-[11px] text-gray-500 mt-4 font-light">
            Last update: Today, {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
          </p>
        </div>

        <nav className="flex-grow mt-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const active = isActive(item.tab);
              const path = getPath(item.tab);
              return (
                <li key={item.name} className="relative pl-3">
                  <Link
                    to={path}
                    className={`group flex items-center justify-between py-2.5 px-4 transition-all duration-300 relative ${
                      active
                        ? "bg-white text-black rounded-l-full shadow-md"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`${active ? "text-black" : "text-gray-500 group-hover:text-white"}`}>
                        {item.icon}
                      </span>
                      <span className="text-[13.5px] font-medium">{item.name}</span>
                    </div>
                    {active && (
                      <div className="w-1.5 h-1.5 bg-[#262221] rounded-full mr-1" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-6 mt-auto pb-8">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-gray-500 hover:text-red-400 transition-colors w-full py-2 group"
          >
            <HiOutlineLogout size={18} />
            <span className="text-[13.5px] font-medium">Log Out</span>
          </button>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3">
        <div
          className="rounded-2xl"
          style={{
            background: 'rgba(38, 34, 33, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center justify-around px-2 py-2">
            {menuItems.map((item) => {
              const active = isActive(item.tab);
              const path = getPath(item.tab);
              return (
                <Link
                  key={item.name}
                  to={path}
                  className="flex flex-col items-center justify-center px-2 py-1.5 min-w-[44px]"
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                      active ? 'bg-white shadow-md' : 'bg-transparent'
                    }`}
                  >
                    <span
                      className={`transition-colors duration-300 ${active ? 'text-[#262221]' : 'text-gray-400'}`}
                      style={{ display: 'flex' }}
                    >
                      {React.cloneElement(item.icon, { size: 22 })}
                    </span>
                  </div>
                  {active && (
                    <span className="mt-1 w-1 h-1 rounded-full bg-white block" />
                  )}
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center px-2 py-1.5 min-w-[44px]"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-transparent">
                <HiOutlineLogout size={22} className="text-gray-400" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductionSidebar;