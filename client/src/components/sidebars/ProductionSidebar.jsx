import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  HiOutlineHome, 
  HiOutlineCube, 
  HiOutlineTruck, 
  HiOutlineShoppingBag, 
  HiOutlineLogout 
} from "react-icons/hi";

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
    { name: 'Home', path: '/production', icon: <HiOutlineHome size={22} /> },
    { name: 'Artisan', path: '/production/artisan', icon: <HiOutlineCube size={22} /> },
    { name: 'Inventory', path: '/production/inventory', icon: <HiOutlineTruck size={22} /> },
    { name: 'Order', path: '/production/order', icon: <HiOutlineShoppingBag size={22} /> },
  ];

  const handleLogout = async () => {
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("userRole");

    try {
      await axios.post("http://localhost:5000/api/logout", {
        userId: userId,
        role: role
      });
    } catch (err) {
      console.error("Logout log failed:", err);
    }

    localStorage.clear();
    navigate('/', { replace: true });
  };

  return (
    <div className="w-[240px] h-screen bg-[#262221] text-white flex flex-col sticky top-0 left-0 font-sans overflow-hidden border-r border-white/5">
      
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
            const isActive = location.pathname === item.path; 

            return (
              <li key={item.name} className="relative pl-3">
                <Link
                  to={item.path}
                  className={`group flex items-center justify-between py-3 px-4 transition-all duration-300 relative ${
                    isActive 
                      ? "bg-white text-black rounded-l-full shadow-md" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className={`${isActive ? "text-black" : "text-gray-500 group-hover:text-white"}`}>
                      {item.icon}
                    </span>
                    <span className="text-[15px] font-medium tracking-wide">
                      {item.name}
                    </span>
                  </div>

                  {isActive && (
                    <div className="w-2 h-2 bg-[#262221] rounded-full mr-1" />
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
          className="flex items-center space-x-4 text-gray-500 hover:text-red-400 transition-colors w-full py-2 group"
        >
          <HiOutlineLogout size={22} />
          <span className="text-[15px] font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default ProductionSidebar;