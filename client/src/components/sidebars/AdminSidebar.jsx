import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HiOutlineHome, 
  HiOutlineCube, 
  HiOutlineTruck, 
  HiOutlineShieldCheck, 
  HiOutlineUserGroup, 
  HiOutlineLogout 
} from "react-icons/hi";

const AdminSidebar = () => {
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
    { name: 'Home', path: '/admin', icon: <HiOutlineHome size={18} /> },
    { name: 'Artisan', path: '/admin/artisan', icon: <HiOutlineCube size={18} /> },
    { name: 'Suppliers', path: '/admin/suppliers', icon: <HiOutlineTruck size={18} /> },
    { name: 'Audit logs', path: '/admin/audit-logs', icon: <HiOutlineShieldCheck size={18} /> },
    { name: 'Users', path: '/admin/users', icon: <HiOutlineUserGroup size={18} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("userName");
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
                  className={`group flex items-center justify-between py-2.5 px-4 transition-all duration-300 relative ${
                    isActive 
                      ? "bg-white text-black rounded-l-full shadow-md" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`${isActive ? "text-black" : "text-gray-500 group-hover:text-white"}`}>
                      {item.icon}
                    </span>
                    <span className="text-[13.5px] font-medium">
                      {item.name}
                    </span>
                  </div>

                  {isActive && (
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
  );
};

export default AdminSidebar;