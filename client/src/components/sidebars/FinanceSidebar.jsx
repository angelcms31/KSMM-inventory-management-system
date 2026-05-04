import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  HiOutlineHome,
  HiOutlinePresentationChartBar,
  HiOutlineShieldCheck,
  HiOutlineLogout,
  HiOutlineShoppingCart,
  HiOutlineClipboardList,
  HiOutlineBeaker,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";
import { getHashedPath } from "../../utils/hash";

const COLLAPSE_THRESHOLD = 120;
const ICON_WIDTH = 64;
const DEFAULT_WIDTH = 240;
const MAX_WIDTH = 360;

const FinanceSidebar = ({ activeTab: propActiveTab }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState("User");
  const [internalActiveTab, setInternalActiveTab] = useState("home");
  const [mobileLogsOpen, setMobileLogsOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  const navigate = useNavigate();
  const { "*": splat } = useParams();
  const role = "finance";

  const isCollapsed = sidebarWidth <= COLLAPSE_THRESHOLD;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    const savedName = localStorage.getItem("userName");
    if (savedName) setUserName(savedName);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const allTabs = ['home', 'inventory', 'purchaseorder', 'audit', 'variance'];
    const currentTab = allTabs.find(t => getHashedPath(role, t) === splat);
    if (currentTab) {
      setInternalActiveTab(currentTab);
    } else if (propActiveTab) {
      setInternalActiveTab(propActiveTab);
    }
  }, [splat, propActiveTab]);

  const toggleCollapse = useCallback(() => {
    setSidebarWidth(prev => prev <= COLLAPSE_THRESHOLD ? DEFAULT_WIDTH : ICON_WIDTH);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

  const startResizing = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback((e) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    const clamped = Math.min(Math.max(newWidth, ICON_WIDTH), MAX_WIDTH);
    setSidebarWidth(clamped <= COLLAPSE_THRESHOLD ? ICON_WIDTH : clamped);
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const menuItems = [
    { id: 'home', name: 'Home', icon: <HiOutlineHome size={20} /> },
    { id: 'inventory', name: 'Transactions', icon: <HiOutlinePresentationChartBar size={20} /> },
    { id: 'purchaseorder', name: 'Purchase Orders', icon: <HiOutlineShoppingCart size={20} /> },
    { id: 'audit', name: 'Audit Logs', icon: <HiOutlineClipboardList size={20} /> },
    { id: 'variance', name: 'Variance Logs', icon: <HiOutlineBeaker size={20} /> },
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
    } catch {
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  const NavItem = ({ item }) => {
    const isActive = internalActiveTab === item.id;
    if (isCollapsed) {
      return (
        <li className="flex justify-center transition-all duration-300">
          <button
            onClick={() => handleTabClick(item.id)}
            title={item.name}
            className={`relative w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-300 outline-none cursor-pointer group ${
              isActive ? 'bg-white shadow-md scale-105' : 'hover:bg-white/10'
            }`}
          >
            <span className={`transition-colors duration-200 ${isActive ? 'text-[#262221]' : 'text-gray-500 group-hover:text-gray-200'}`}>
              {item.icon}
            </span>
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#1a1715] border border-white/10 rounded-lg text-[11px] font-bold text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 z-50 shadow-xl translate-x-[-10px] group-hover:translate-x-0">
              {item.name}
            </div>
          </button>
        </li>
      );
    }
    return (
      <li className="relative pl-3 pr-0 transition-all duration-300">
        <button
          onClick={() => handleTabClick(item.id)}
          className={`w-full group flex items-center justify-between py-2.5 px-4 transition-all duration-300 relative rounded-l-full outline-none ${
            isActive ? 'bg-white text-black shadow-md cursor-default' : 'text-gray-400 hover:text-white hover:bg-white/5 cursor-pointer'
          }`}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <span className={`${isActive ? 'text-black' : 'text-gray-50 group-hover:text-white'} transition-colors duration-300`}>
              {item.icon}
            </span>
            <span className={`text-[13.5px] font-medium whitespace-nowrap transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>{item.name}</span>
          </div>
          {isActive && <div className="w-1.5 h-1.5 bg-[#262221] rounded-full mr-1 transition-transform duration-300 scale-100" />}
        </button>
      </li>
    );
  };

  const LogoutBtn = () => {
    if (isCollapsed) {
      return (
        <div className="flex justify-center pb-6 transition-all duration-300">
          <button
            onClick={handleLogout}
            title="Log Out"
            className="w-11 h-11 flex items-center justify-center rounded-2xl hover:bg-red-500/10 transition-all duration-300 group cursor-pointer outline-none"
          >
            <HiOutlineLogout size={20} className="text-gray-500 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      );
    }
    return (
      <div className="px-6 mt-auto pb-8 transition-all duration-300">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 text-gray-500 hover:text-red-400 transition-all duration-300 w-full py-2 group cursor-pointer outline-none"
        >
          <HiOutlineLogout size={18} />
          <span className="text-[13.5px] font-medium whitespace-nowrap transition-opacity duration-300 opacity-80 group-hover:opacity-100">Log Out</span>
        </button>
      </div>
    );
  };

  const isLogsActive = ['audit', 'variance'].includes(internalActiveTab);
  const logSubItems = [
    { id: 'audit', name: 'Audit Logs', icon: <HiOutlineClipboardList size={16} /> },
    { id: 'variance', name: 'Variance Logs', icon: <HiOutlineBeaker size={16} /> },
  ];

  return (
    <>
      <div
        className="hidden lg:flex h-screen bg-[#262221] text-white flex-col sticky top-0 left-0 font-sans border-r border-white/5 relative transition-all duration-300 ease-in-out group overflow-visible"
        style={{ width: isCollapsed ? ICON_WIDTH : sidebarWidth, minWidth: isCollapsed ? ICON_WIDTH : sidebarWidth, flexShrink: 0 }}
      >
        <button
          onClick={toggleCollapse}
          className={`absolute -right-3 top-1/2 -translate-y-1/2 z-[60] w-6 h-6 flex items-center justify-center rounded-full bg-[#262221] border border-white/10 text-gray-400 hover:text-white transition-all duration-300 shadow-lg cursor-pointer group/toggle ${
            isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-100'
          }`}
        >
          <div className="transition-transform duration-300">
            {isCollapsed ? <HiChevronRight size={12} /> : <HiChevronLeft size={12} />}
          </div>
          <div className="absolute inset-0 rounded-full bg-white/5 group-hover/toggle:scale-150 transition-all duration-300" />
        </button>

        {!isCollapsed && (
          <div className="pt-10 pb-8 px-6 text-left flex-shrink-0 transition-all duration-300">
            <h3 className="text-[18px] font-bold leading-tight tracking-tight capitalize text-white">
              Welcome back,<br />{userName.length > 12 ? `${userName.substring(0, 10)}...` : userName}!
            </h3>
            <p className="text-[11px] text-gray-500 mt-4 font-light">
              Last update: Today, {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
            </p>
          </div>
        )}

        {isCollapsed && <div className="h-10 flex-shrink-0 transition-all duration-300" />}

        <nav className="flex-grow overflow-hidden transition-all duration-300">
          <ul className={`${isCollapsed ? 'flex flex-col items-center gap-2 px-0' : 'space-y-1'} transition-all duration-300`}>
            {menuItems.map(item => <NavItem key={item.id} item={item} />)}
          </ul>
        </nav>

        <LogoutBtn />

        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            className={`absolute right-0 top-0 w-3 h-full cursor-col-resize z-40 group/handle flex items-center justify-center ${isResizing ? '[&>div]:opacity-100 [&>div]:bg-indigo-500/40' : ''}`}
          >
            <div className={`w-1 h-full transition-all duration-150 group-hover/handle:bg-indigo-500/40 ${isResizing ? 'bg-indigo-500/40' : 'bg-transparent'}`} />
            <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 opacity-0 group-hover/handle:opacity-100 transition-all duration-300 pointer-events-none z-50">
              <div className="bg-[#1a1715] border border-white/20 rounded-lg px-1.5 py-2 shadow-xl flex flex-col gap-0.5 items-center scale-90 group-hover/handle:scale-100">
                <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="3" cy="2" r="1.2" fill="#6366f1"/><circle cx="7" cy="2" r="1.2" fill="#6366f1"/>
                  <circle cx="3" cy="7" r="1.2" fill="#6366f1"/><circle cx="7" cy="7" r="1.2" fill="#6366f1"/>
                  <circle cx="3" cy="12" r="1.2" fill="#6366f1"/><circle cx="7" cy="12" r="1.2" fill="#6366f1"/>
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3">
        <div
          className="rounded-2xl relative"
          style={{
            background: 'rgba(38, 34, 33, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {mobileLogsOpen && (
            <div className="absolute bottom-20 left-0 right-0 mx-4 bg-[#262221] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-slideUp">
              {logSubItems.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => handleTabClick(sub.id)}
                  className={`w-full flex items-center gap-3 p-4 text-[14px] font-medium transition-colors ${
                    internalActiveTab === sub.id ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  {sub.icon}
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-around px-2 py-2">
            {menuItems.slice(0, 3).map(item => {
              const isActive = internalActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setMobileLogsOpen(false); handleTabClick(item.id); }}
                  className="flex flex-col items-center justify-center px-2 py-1.5 min-w-[44px] outline-none cursor-pointer"
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${isActive ? 'bg-white shadow-md' : 'bg-transparent'}`}>
                    <span className={`transition-colors duration-300 ${isActive ? 'text-[#262221]' : 'text-gray-400'}`} style={{ display: 'flex' }}>
                      {React.cloneElement(item.icon, { size: 22 })}
                    </span>
                  </div>
                  {isActive && <span className="mt-1 w-1 h-1 rounded-full bg-white block animate-scaleIn" />}
                </button>
              );
            })}

            <button
              onClick={() => setMobileLogsOpen(!mobileLogsOpen)}
              className="flex flex-col items-center justify-center px-2 py-1.5 min-w-[44px] outline-none cursor-pointer"
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${isLogsActive ? 'bg-white shadow-md' : 'bg-transparent'}`}>
                <span className={`transition-colors duration-300 ${isLogsActive ? 'text-[#262221]' : 'text-gray-400'}`} style={{ display: 'flex' }}>
                  <HiOutlineShieldCheck size={22} />
                </span>
              </div>
              {isLogsActive && <span className="mt-1 w-1 h-1 rounded-full bg-white block animate-scaleIn" />}
            </button>

            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center px-2 py-1.5 min-w-[44px] cursor-pointer outline-none"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-transparent">
                <HiOutlineLogout size={22} className="text-gray-400" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        ${isResizing ? 'body { cursor: col-resize !important; user-select: none; }' : ''}
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
        .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </>
  );
};

export default FinanceSidebar;