import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  HiOutlineHome, 
  HiOutlineCube, 
  HiOutlineTruck, 
  HiOutlineShieldCheck, 
  HiOutlineUserGroup, 
  HiOutlineLogout,
  HiChevronDown,
  HiOutlineClipboardList,
  HiOutlineBeaker
} from "react-icons/hi";
import { getHashedPath } from "../../utils/hash";

const AdminSidebar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState("User");
  const [logsOpen, setLogsOpen] = useState(false);
  const [mobileLogsOpen, setMobileLogsOpen] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState("home");
  
  const navigate = useNavigate();
  const { "*": splat } = useParams();
  const role = localStorage.getItem("userRole")?.toLowerCase() || "admin";

  const auditSubTabs = ['audit', 'variance'];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    const savedName = localStorage.getItem("userName");
    if (savedName) setUserName(savedName);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const allTabs = ['home', 'artisan', 'suppliers', 'users', 'audit', 'variance'];
    const currentTab = allTabs.find(t => getHashedPath(role, t) === splat);
    if (currentTab) {
      setInternalActiveTab(currentTab);
      if (auditSubTabs.includes(currentTab)) setLogsOpen(true);
    }
  }, [splat, role]);

  const truncateName = (name) => {
    return name.length > 12 ? `${name.substring(0,10)}...` : name;
  };

  const menuItems = [
    { id: 'home', name: 'Home', icon: <HiOutlineHome size={20} /> },
    { id: 'artisan', name: 'Artisan', icon: <HiOutlineCube size={20} /> },
    { id: 'suppliers', name: 'Suppliers', icon: <HiOutlineTruck size={20} /> },
    { id: 'users', name: 'Users', icon: <HiOutlineUserGroup size={20} /> },
  ];

  const logSubItems = [
    { id: 'audit', name: 'Audit Logs', icon: <HiOutlineClipboardList size={16} /> },
    { id: 'variance', name: 'Variance Logs', icon: <HiOutlineBeaker size={16} /> },
  ];

  const handleTabClick = (tabId) => {
    setMobileLogsOpen(false);
    const newHash = getHashedPath(role, tabId);
    navigate(`/dashboard/${newHash}`, { replace: true });
  };

  const handleLogout = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      const userRole = localStorage.getItem("userRole");
      if (userId) {
        await axios.post("http://localhost:5000/api/logout", { userId, role: userRole });
      }
      localStorage.clear();
      navigate("/", { replace: true });
      window.location.reload();
    } catch (err) {
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  const isLogsActive = auditSubTabs.includes(internalActiveTab);

  return (
    <>
      <div className="hidden lg:flex w-[240px] h-screen bg-[#262221] text-white flex-col sticky top-0 left-0 font-sans overflow-hidden border-r border-white/5">
        <div className="pt-10 pb-8 px-6 text-left">
          <h3 className="text-[18px] font-bold leading-tight tracking-tight capitalize text-white">
            Welcome back,<br />{truncateName(userName)}!
          </h3>
          <p className="text-[11px] text-gray-500 mt-4 font-light">
            Last update: Today, {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
          </p>
        </div>

        <nav className="flex-grow mt-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = internalActiveTab === item.id;
              return (
                <li key={item.id} className="relative pl-3">
                  <button
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full group flex items-center justify-between py-2.5 px-4 transition-all duration-300 relative rounded-l-full cursor-pointer outline-none ${
                      isActive ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`${isActive ? "text-black" : "text-gray-500 group-hover:text-white"}`}>
                        {item.icon}
                      </span>
                      <span className="text-[13.5px] font-medium">{item.name}</span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 bg-[#262221] rounded-full mr-1" />}
                  </button>
                </li>
              );
            })}

            <li className="relative pl-3 text-left">
              <button
                onClick={() => setLogsOpen(prev => !prev)}
                className={`w-full group flex items-center justify-between py-2.5 px-4 transition-all duration-300 rounded-l-full cursor-pointer outline-none ${
                  isLogsActive ? "bg-white text-black shadow-md" : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`${isLogsActive ? "text-black" : "text-gray-500 group-hover:text-white"}`}>
                    <HiOutlineShieldCheck size={18} />
                  </span>
                  <span className="text-[13.5px] font-medium">Logs</span>
                </div>
                <HiChevronDown
                  size={14}
                  className={`transition-transform duration-300 mr-1 ${logsOpen ? 'rotate-180' : ''} ${isLogsActive ? 'text-black' : 'text-gray-500'}`}
                />
              </button>

              {logsOpen && (
                <ul className="mt-1 ml-4 space-y-0.5 border-l border-white/10 pl-3">
                  {logSubItems.map((sub) => {
                    const isSubActive = internalActiveTab === sub.id;
                    return (
                      <li key={sub.id}>
                        <button
                          onClick={() => handleTabClick(sub.id)}
                          className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-[12.5px] font-medium transition-all duration-200 cursor-pointer outline-none ${
                            isSubActive
                              ? 'bg-white/10 text-white'
                              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          <span className={isSubActive ? 'text-white' : 'text-gray-600'}>
                            {sub.icon}
                          </span>
                          {sub.name}
                          {isSubActive && <div className="ml-auto w-1 h-1 rounded-full bg-white" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          </ul>
        </nav>

        <div className="px-6 mt-auto pb-8">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-gray-500 hover:text-red-400 transition-colors w-full py-2 group cursor-pointer outline-none"
          >
            <HiOutlineLogout size={18} />
            <span className="text-[13.5px] font-medium">Log Out</span>
          </button>
        </div>
      </div>

      {/* Mobile view remains same using internalActiveTab */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3">
        {/* ... mobile bottom bar code using internalActiveTab ... */}
      </div>
    </>
  );
};

export default AdminSidebar;