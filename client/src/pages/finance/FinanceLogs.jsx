import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  HiOutlineClock, HiOutlineUser, HiOutlineShieldCheck,
  HiOutlineSearch, HiOutlineClipboardList, HiChevronDown, HiX, HiChevronLeft, HiChevronRight,
  HiOutlineDownload
} from "react-icons/hi";
import { FaRegFilePdf, FaRegFileExcel } from "react-icons/fa";

const FinanceLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [logType, setLogType] = useState("audit");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sortModalOpen, setSortModalOpen] = useState(false);

  const logsPerPage = 15;

  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDay, setFilterDay] = useState("");

  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterUser, setFilterUser] = useState("");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportStartTime, setExportStartTime] = useState("");
  const [exportEndTime, setExportEndTime] = useState("");

  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const dayRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isDayOpen, setIsDayOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = logType === "audit"
        ? "http://localhost:5000/api/audit_logs"
        : "http://localhost:5000/api/variance_logs";
      const res = await axios.get(url, { params: { limit: 99999 } });
      const data = res.data;
      setLogs(Array.isArray(data) ? data : (data.logs || data.data || []));
    } catch (err) {
      console.error("Error fetching logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [logType]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterYear, filterMonth, filterDay]);
  useEffect(() => { setFilterYear(""); setFilterMonth(""); setFilterDay(""); }, [logType]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) setIsYearOpen(false);
      if (monthRef.current && !monthRef.current.contains(event.target)) setIsMonthOpen(false);
      if (dayRef.current && !dayRef.current.contains(event.target)) setIsDayOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.trim().toLowerCase();
    const nameMatch = !term || (log.merged_name || '').toLowerCase().startsWith(term);
    const roleMatch = !term || (log.role || '').toLowerCase().startsWith(term);
    const actionMatch = !term || (log.action || '').toLowerCase().startsWith(term);

    let dateMatch = true;
    if (log.timestamp) {
      const date = new Date(log.timestamp);
      if (filterYear) dateMatch = dateMatch && date.getFullYear() === parseInt(filterYear);
      if (filterMonth) dateMatch = dateMatch && (date.getMonth() + 1) === parseInt(filterMonth);
      if (filterDay) dateMatch = dateMatch && date.getDate() === parseInt(filterDay);
    }

    return (nameMatch || roleMatch || actionMatch) && dateMatch;
  });

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const uniqueUsers = [...new Set(logs.map(log => log.merged_name).filter(Boolean))];

  const getSortedLogsForExport = () => {
    let logsToExport = [...filteredLogs];

    if (filterUser) {
      logsToExport = logsToExport.filter(log => log.merged_name === filterUser);
    }

    if (exportStartDate || exportEndDate) {
      logsToExport = logsToExport.filter(log => {
        if (!log.timestamp) return false;
        const logDate = new Date(log.timestamp);

        if (exportStartDate && exportEndDate) {
          const startStr = exportStartDate + (exportStartTime ? `T${exportStartTime}:00` : 'T00:00:00');
          const endStr = exportEndDate + (exportEndTime ? `T${exportEndTime}:59` : 'T23:59:59');
          return logDate >= new Date(startStr) && logDate <= new Date(endStr);
        } else if (exportStartDate) {
          const startStr = exportStartDate + (exportStartTime ? `T${exportStartTime}:00` : 'T00:00:00');
          return logDate >= new Date(startStr);
        } else if (exportEndDate) {
          const endStr = exportEndDate + (exportEndTime ? `T${exportEndTime}:59` : 'T23:59:59');
          return logDate <= new Date(endStr);
        }
        return true;
      });
    }

    logsToExport.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.timestamp || 0);
        const dateB = new Date(b.timestamp || 0);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortBy === "user") {
        const nameA = (a.merged_name || "").toLowerCase();
        const nameB = (b.merged_name || "").toLowerCase();
        return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return 0;
    });

    return logsToExport;
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const sortedLogs = getSortedLogsForExport();
      const worksheet = XLSX.utils.json_to_sheet(sortedLogs.map(log => ({
        User: log.merged_name || "Unknown",
        Role: log.role || "N/A",
        Action: log.action || "N/A",
        Timestamp: log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");
      const logTypeName = logType === "audit" ? "Audit" : "Variance";
      const year = filterYear || currentYear;
      const month = filterMonth ? months[parseInt(filterMonth) - 1] : months[new Date().getMonth()];
      XLSX.writeFile(workbook, `${logTypeName}_Logs_${year}_${month}.xlsx`);
      setSortModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape' });
      const sortedLogs = getSortedLogsForExport();
      const tableRows = sortedLogs.map(log => [
        log.merged_name || "Unknown",
        log.role || "N/A",
        log.action || "N/A",
        log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"
      ]);
      doc.text(`${logType === "audit" ? "Audit Logs" : "Variance Logs"}`, 14, 12);
      autoTable(doc, {
        head: [["User", "Role", "Action", "Timestamp"]],
        body: tableRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        theme: 'grid',
        startY: 20,
      });
      const logTypeName = logType === "audit" ? "Audit" : "Variance";
      const year = filterYear || currentYear;
      const month = filterMonth ? months[parseInt(filterMonth) - 1] : months[new Date().getMonth()];
      doc.save(`${logTypeName}_Logs_${year}_${month}.pdf`);
      setSortModalOpen(false);
    } catch (err) { console.error(err); alert("PDF export failed."); }
  };

  const handleExportClick = (format) => {
    if (format === "pdf") exportToPDF();
    else exportToExcel();
  };

  if (loading) return <div className="h-full flex items-center justify-center font-black text-gray-400 animate-pulse tracking-widest uppercase">Loading...</div>;

  return (
    <div className="h-screen bg-[#F8F9FA] flex flex-col font-sans overflow-hidden">
      <div className="flex-1 overflow-y-auto px-10 pt-6 pb-10 custom-scrollbar">

        <div className="flex justify-between items-center mb-4">
          <div ref={dropdownRef} className="relative">
            <div
              className="flex items-center gap-1 cursor-pointer font-black text-3xl text-gray-900 select-none"
              onClick={() => setDropdownOpen(prev => !prev)}
            >
              {logType === "audit" ? "Audit Logs" : "Variance Logs"}
              <HiChevronDown className={`transition-transform text-gray-600 ${dropdownOpen ? 'rotate-180' : ''}`} size={24} />
            </div>
            {dropdownOpen && (
              <div className="absolute bg-white border border-gray-100 rounded-xl shadow-md mt-2 w-44 z-20">
                <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm font-bold rounded-t-xl" onClick={() => { setLogType("audit"); setDropdownOpen(false); }}>Audit Logs</div>
                <div className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm font-bold rounded-b-xl" onClick={() => { setLogType("variance"); setDropdownOpen(false); }}>Variance Logs</div>
              </div>
            )}
          </div>

          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <HiOutlineClock className="text-stone-400" size={20} />
            <div>
              <p className="text-[9px] font-black text-gray-300 uppercase leading-none">Last Update</p>
              <p className="text-xs font-bold text-gray-700">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-4 flex gap-3 items-center">
          <div className="relative flex-1 min-w-0">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-[#F8F9FA] border-none rounded-xl py-2.5 pl-11 pr-4 outline-none font-bold text-slate-700 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div ref={yearRef} className="relative flex-shrink-0">
            <button onClick={() => setIsYearOpen(!isYearOpen)} className="px-4 py-2.5 bg-[#F8F9FA] rounded-xl text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2 hover:bg-gray-100 transition-all whitespace-nowrap">
              {filterYear || "Year"}
              <HiChevronDown className={`w-3 h-3 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
            </button>
            {isYearOpen && (
              <div className="absolute mt-2 w-32 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2 right-0">
                <div className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => { setFilterYear(""); setIsYearOpen(false); }}>Clear</div>
                {years.map(y => (
                  <div key={y} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-black rounded-lg cursor-pointer" onClick={() => { setFilterYear(y); setIsYearOpen(false); }}>{y}</div>
                ))}
              </div>
            )}
          </div>

          <div ref={monthRef} className="relative flex-shrink-0">
            <button onClick={() => setIsMonthOpen(!isMonthOpen)} className="px-4 py-2.5 bg-[#F8F9FA] rounded-xl text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2 hover:bg-gray-100 transition-all whitespace-nowrap">
              {filterMonth ? months[filterMonth - 1] : "Month"}
              <HiChevronDown className={`w-3 h-3 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMonthOpen && (
              <div className="absolute mt-2 w-36 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2 max-h-52 overflow-y-auto right-0">
                <div className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => { setFilterMonth(""); setIsMonthOpen(false); }}>Clear</div>
                {months.map((m, i) => (
                  <div key={i} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-black rounded-lg cursor-pointer" onClick={() => { setFilterMonth(i + 1); setIsMonthOpen(false); }}>{m}</div>
                ))}
              </div>
            )}
          </div>

          <div ref={dayRef} className="relative flex-shrink-0">
            <button onClick={() => setIsDayOpen(!isDayOpen)} className="px-4 py-2.5 bg-[#F8F9FA] rounded-xl text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2 hover:bg-gray-100 transition-all whitespace-nowrap">
              {filterDay || "Day"}
              <HiChevronDown className={`w-3 h-3 transition-transform ${isDayOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDayOpen && (
              <div className="absolute mt-2 w-24 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2 max-h-52 overflow-y-auto right-0">
                <div className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => { setFilterDay(""); setIsDayOpen(false); }}>Clear</div>
                {days.map(d => (
                  <div key={d} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-black rounded-lg cursor-pointer" onClick={() => { setFilterDay(d); setIsDayOpen(false); }}>{d}</div>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200 flex-shrink-0" />

          <button
            className="bg-black text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg hover:scale-105 transition-all tracking-widest flex items-center gap-2 flex-shrink-0"
            onClick={() => setSortModalOpen(true)}
          >
            <HiOutlineDownload size={14} />
            Export
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-[#FCFCFC]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Activity Stream</h3>
            <div className="flex items-center gap-3">
              <span className="bg-stone-100 text-stone-500 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                {filteredLogs.length} Entries
              </span>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-full border disabled:opacity-30 hover:bg-slate-100"><HiChevronLeft size={16}/></button>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage >= totalPages} className="p-1.5 rounded-full border disabled:opacity-30 hover:bg-slate-100"><HiChevronRight size={16}/></button>
              </div>
            </div>
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
                {currentLogs.length > 0 ? currentLogs.map((log, i) => (
                  <tr key={i} className="group border-b border-gray-50 last:border-none hover:bg-[#FBFBFB] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-white transition-all flex-shrink-0">
                          <HiOutlineUser size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 uppercase tracking-tighter text-sm">{log.merged_name || 'Unknown User'}</p>
                          <p className="text-[10px] text-gray-400 font-medium">UID: {log.user_id || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-2">
                        <HiOutlineShieldCheck className="text-gray-200" />
                        <span className="uppercase tracking-widest text-[11px] font-bold text-gray-400">{log.role || "N/A"}</span>
                      </div>
                    </td>
                    <td className="py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter ${
                        log.action === 'Login' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {log.action || "N/A"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-medium text-gray-400 tabular-nums text-xs">
                      {log.timestamp ? (
                        <>
                          {new Date(log.timestamp).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric'})}
                          <span className="mx-2 text-gray-200">|</span>
                          {new Date(log.timestamp).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true})}
                        </>
                      ) : "No Date"}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <HiOutlineClipboardList size={48} />
                        <p className="text-xs font-black uppercase tracking-widest">No logs found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {sortModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50">
            <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-xl relative shadow-2xl">
              <button className="absolute top-8 right-8 text-slate-300 hover:text-black transition-all" onClick={() => setSortModalOpen(false)}>
                <HiX size={24}/>
              </button>
              <h2 className="text-2xl font-black text-slate-900 uppercase mb-6 tracking-tighter">Export Settings</h2>

              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Date & Time Range (Optional)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] text-slate-500 ml-2 font-bold">From</label>
                      <input type="date" className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} />
                      <input type="time" className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm disabled:opacity-40" value={exportStartTime} onChange={(e) => setExportStartTime(e.target.value)} disabled={!exportStartDate} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-slate-500 ml-2 font-bold">To</label>
                      <input type="date" className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} />
                      <input type="time" className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm disabled:opacity-40" value={exportEndTime} onChange={(e) => setExportEndTime(e.target.value)} disabled={!exportEndDate} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Sort By</label>
                  <div className="flex gap-2">
                    <button onClick={() => setSortBy("date")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${sortBy === "date" ? "bg-black text-white" : "bg-[#F3F4F6] text-slate-600"}`}>Date/Time</button>
                    <button onClick={() => setSortBy("user")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${sortBy === "user" ? "bg-black text-white" : "bg-[#F3F4F6] text-slate-600"}`}>User Name</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Order</label>
                  <div className="flex gap-2">
                    <button onClick={() => setSortOrder("asc")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${sortOrder === "asc" ? "bg-black text-white" : "bg-[#F3F4F6] text-slate-600"}`}>Ascending</button>
                    <button onClick={() => setSortOrder("desc")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${sortOrder === "desc" ? "bg-black text-white" : "bg-[#F3F4F6] text-slate-600"}`}>Descending</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Filter by User (Optional)</label>
                  <select className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                    <option value="">All Users</option>
                    {uniqueUsers.map((user, idx) => (
                      <option key={idx} value={user}>{user}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 justify-center pt-4 border-t">
                <div className="flex-1 border-2 border-black rounded-xl p-4 flex flex-col items-center text-center cursor-pointer hover:bg-gray-100 hover:scale-105 transition-all" onClick={() => handleExportClick("pdf")}>
                  <FaRegFilePdf size={32} className="text-black mb-2" />
                  <p className="font-bold text-black text-sm">PDF</p>
                  <p className="text-xs text-slate-500 mt-1">Print-ready version</p>
                </div>
                <div className="flex-1 border-2 border-black rounded-xl p-4 flex flex-col items-center text-center cursor-pointer hover:bg-gray-100 hover:scale-105 transition-all" onClick={() => handleExportClick("excel")}>
                  <FaRegFileExcel size={32} className="text-black mb-2" />
                  <p className="font-bold text-black text-sm">EXCEL</p>
                  <p className="text-xs text-slate-500 mt-1">Editable spreadsheet</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FinanceLogs;