import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { HiOutlineBell } from "react-icons/hi";

const AdminFinanceRightSidebar = () => {
  const [activities, setActivities] = useState([]);
  const navigate = useNavigate(); 
  const userName = localStorage.getItem("userName") || "John Doe";
  const userRole = localStorage.getItem("userRole") || "Admin";

  const formatTime = (timestamp) => {
    if (!timestamp) return "Just now";
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMs = now - past;
    const diffInMins = Math.floor(diffInMs / 60000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins} mins ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return past.toLocaleDateString();
  };

  const getStatusStyle = (action) => {
    const act = action?.toLowerCase() || '';
    if (act.includes('login') || act.includes('create')) return "bg-green-600";
    if (act.includes('update') || act.includes('edit')) return "bg-blue-600";
    if (act.includes('logout') || act.includes('delete')) return "bg-red-600";
    return "bg-yellow-600";
  };

  const fetchActivities = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/audit_logs");
      const latestLogs = (res.data || []).slice(0, 4);
      setActivities(latestLogs);
    } catch (err) {
      console.error("Error fetching logs for sidebar:", err);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-[280px] h-screen bg-[#262221] text-white flex flex-col sticky top-0 right-0 font-sans border-l border-white/5">
      
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden border border-white/10">
            <img src="https://i.pravatar.cc/100?u=admin" alt="User" />
          </div>
          <div>
            <h4 className="text-[14px] font-bold leading-none">{userName}</h4>
            <p className="text-[11px] text-gray-500 mt-1">{userRole}</p>
          </div>
        </div>
        
        <div className="relative cursor-pointer group p-1.5 rounded-full hover:bg-white/5 transition-all duration-200 active:scale-90">
          <HiOutlineBell 
            size={22} 
            className="text-gray-400 group-hover:text-white transition-colors duration-200" 
          />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#262221]"></span>
        </div>
      </div>

      <div className="px-6 mb-4">
        <div className="bg-[#1e1b1a] rounded-xl p-4 border border-white/5">
          <h5 className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-5">Recent Activities</h5>
          
          <div className="space-y-6">
            {activities.length > 0 ? activities.map((log, i) => (
              <div key={i} className="flex justify-between items-start animate-fadeIn">
                <div className="flex-grow pr-2 min-w-0">
                  <p className="text-[12px] font-bold leading-tight text-gray-200 truncate">
                    {log.action}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate italic">By {log.merged_name}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{formatTime(log.timestamp)}</p>
                </div>
                <span className={`${getStatusStyle(log.action)} text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-tighter`}>
                  {log.action?.split(' ')[0] || 'LOG'}
                </span>
              </div>
            )) : (
              <p className="text-[11px] text-gray-600 text-center py-4 italic">No activity yet</p>
            )}
          </div>

          <button 
            onClick={() => navigate('/admin/audit-logs')} 
            className="text-[10px] text-gray-500 mt-6 hover:text-white font-bold transition-colors uppercase tracking-widest"
          >
            VIEW ALL
          </button>
        </div>
      </div>

      <div className="px-6 flex-grow pb-6 overflow-hidden">
        <div className="bg-[#1e1b1a] h-full rounded-xl p-4 border border-white/5 flex flex-col">
          <h5 className="text-[16px] font-bold mb-5">Inbox</h5>
          <div className="text-gray-600 text-xs italic text-center mt-10">
            No new messages
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinanceRightSidebar;