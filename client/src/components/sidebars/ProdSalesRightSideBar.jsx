import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HiOutlineMenuAlt3, HiOutlineX } from "react-icons/hi";

const ProdSalesRightSidebar = () => {
  const [lowStockLogs, setLowStockLogs] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "Production";
  const loggedInUserId = localStorage.getItem("user_id");

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/low_stock_logs");
      const logs = Array.isArray(res.data) ? res.data : [];
      setLowStockLogs(logs.slice(0, 7));
    } catch (err) {
      console.error("Error fetching low stock logs:", err);
      setLowStockLogs([]);
    }
  };

  const fetchUserProfile = async () => {
    if (!loggedInUserId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/user/${loggedInUserId}`);
      setProfilePic(res.data.profile_image);
    } catch (err) {
      console.error("Error Fetching Profile:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUserProfile();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStockBadgeStyle = (item) => {
    if (Number(item.stock_quantity) <= 0) return "bg-red-600";
    return "bg-amber-500";
  };

  const getStockLabel = (item) => {
    if (Number(item.stock_quantity) <= 0) return "NO STOCK";
    return "LOW";
  };

  const getStockBarWidth = (current, threshold) => {
    const c = Number(current) || 0;
    const t = Number(threshold) || 1;
    const pct = Math.min((c / (t * 2)) * 100, 100);
    return `${pct}%`;
  };

  const getStockBarColor = (current, threshold) => {
    const c = Number(current) || 0;
    const t = Number(threshold) || 1;
    if (c <= 0) return "bg-red-500";
    if (c <= t) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const SidebarContent = () => (
    <div className="relative w-full h-full bg-[#262221] text-white flex flex-col font-sans border-l border-white/5 overflow-y-auto">
      <div className="p-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden border border-white/10 flex items-center justify-center flex-shrink-0">
            <img
              src={
                profilePic
                  ? (profilePic.startsWith('data:') || profilePic.startsWith('http')
                    ? profilePic
                    : `http://localhost:5000${profilePic}`)
                  : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`
              }
              alt="User"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`; }}
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-[13px] font-bold leading-none truncate w-32" title={userName}>{userName}</h4>
            <p className="text-[10px] text-gray-500 mt-1 tracking-tighter">{userRole}</p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 flex-shrink-0">
        <div className="bg-[#1e1b1a] rounded-xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Alerts</h5>
            {lowStockLogs.length > 0 && (
              <span className="bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                {lowStockLogs.length} Alert{lowStockLogs.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {lowStockLogs.length > 0 ? lowStockLogs.map((item, i) => (
              <div key={i} className="bg-[#262221] rounded-xl p-3 border border-white/5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-gray-200 truncate uppercase leading-tight">
                      {item.material_name}
                    </p>
                    <p className="text-[9px] text-gray-500 mt-0.5 uppercase tracking-wider font-bold">
                      {item.item_type === 'finished_good' ? 'Finished Good' : 'Raw Material'} · {item.unique_code}
                    </p>
                  </div>
                  <span className={`${getStockBadgeStyle(item)} text-[7px] px-2 py-0.5 rounded font-black uppercase tracking-tighter text-white flex-shrink-0`}>
                    {getStockLabel(item)}
                  </span>
                </div>

                <div className="w-full bg-white/5 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full transition-all ${getStockBarColor(item.stock_quantity, item.reorder_threshold)}`}
                    style={{ width: getStockBarWidth(item.stock_quantity, item.reorder_threshold) }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-gray-500 font-bold">
                    Stock: <span className="text-amber-400">{item.stock_quantity}</span>
                  </span>
                  <span className="text-[9px] text-gray-600 font-bold">
                    Min: {item.reorder_threshold}
                  </span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center mb-3">
                  <span className="text-emerald-500 text-lg">✓</span>
                </div>
                <p className="text-[11px] text-gray-600 font-black uppercase tracking-wider">All stocks healthy</p>
                <p className="text-[9px] text-gray-700 mt-1">No alerts at this time</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block w-[280px] h-screen sticky top-0 right-0 shrink-0">
        <SidebarContent />
      </div>

      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-40 w-11 h-11 rounded-2xl bg-[#262221] border border-white/10 flex items-center justify-center"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
      >
        <div className="relative">
          <HiOutlineMenuAlt3 size={20} className="text-gray-300" />
          {lowStockLogs.length > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border border-[#262221]"></span>
          )}
        </div>
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setMobileOpen(false)}>
          <div className="flex-1 bg-black/50" />
          <div
            className="w-[280px] h-full"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideInRight 0.25s ease-out' }}
          >
            <div className="relative h-full">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              >
                <HiOutlineX size={14} className="text-gray-300" />
              </button>
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default ProdSalesRightSidebar;