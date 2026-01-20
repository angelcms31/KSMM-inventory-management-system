import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { HiOutlineClock, HiOutlineUser, HiOutlineShieldCheck, HiOutlineSearch, HiOutlineClipboardList } from "react-icons/hi";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/audit_logs");
      setLogs(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.merged_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="h-screen flex items-center justify-center font-bold text-gray-400 animate-pulse">Loading System Logs...</div>;
  }

  return (
    <div className="h-screen bg-[#F8F9FA] flex flex-col font-sans overflow-hidden">
      <div className="flex-1 overflow-y-auto px-10 pt-6 pb-10 custom-scrollbar">
        
        <div className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Audit Logs</h1>
            <p className="text-gray-400 text-sm">Monitor system activities and user sessions</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <HiOutlineClock className="text-stone-400" size={20} />
              <div>
                <p className="text-[9px] font-black text-gray-300 uppercase leading-none">Last Update</p>
                <p className="text-xs font-bold text-gray-700">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mb-6 max-w-md">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, role, or action..." 
            className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 outline-none text-sm shadow-sm focus:ring-2 ring-gray-100 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-[#FCFCFC]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Activity Stream</h3>
            <span className="bg-stone-100 text-stone-500 text-[10px] font-black px-3 py-1 rounded-full uppercase">
              {filteredLogs.length} Entries Found
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                  <th className="px-8 py-6">User Details</th>
                  <th className="py-6">System Role</th>
                  <th className="py-6">Action</th>
                  <th className="px-8 py-6 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="text-[13px] font-bold text-gray-700">
                {filteredLogs.map((log, i) => (
                  <tr key={i} className="group border-b border-gray-50 last:border-none hover:bg-[#FBFBFB] transition-colors">
                    <td className="px-8 py-6 flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-white transition-all">
                        <HiOutlineUser size={20} />
                      </div>
                      <div>
                        <p className="font-black text-gray-800 uppercase tracking-tighter">{log.merged_name || 'Unknown User'}</p>
                        <p className="text-[10px] text-gray-400 font-medium">UID: {log.user_id || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center gap-2">
                        <HiOutlineShieldCheck className="text-gray-200" />
                        <span className="uppercase tracking-widest text-[11px] font-black text-gray-400">{log.role}</span>
                      </div>
                    </td>
                    <td className="py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                        log.action === 'Login' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                   <td className="px-8 py-6 text-right font-medium text-gray-400 tabular-nums">
                        {log.timestamp ? (
                          <>
                            {new Date(log.timestamp).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                            <span className="mx-2 text-gray-200">|</span>
                            {new Date(log.timestamp).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })}
                          </>
                        ) : (
                          "No Date"
                        )}
                      </td>
                  </tr>
                ))}
                
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <HiOutlineClipboardList size={48} />
                        <p className="text-xs font-black uppercase tracking-widest">No activity logs found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;