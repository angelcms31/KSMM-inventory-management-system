import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  HiOutlineClock, HiOutlineUser, HiOutlineShieldCheck,
  HiOutlineSearch, HiChevronDown, HiX, HiChevronLeft, HiChevronRight,
  HiOutlineDownload
} from "react-icons/hi";
import { FaRegFilePdf, FaRegFileExcel } from "react-icons/fa";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [varianceLogs, setVarianceLogs] = useState([]);
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
      if (logType === "audit") {
        const res = await axios.get("http://localhost:5000/api/audit_logs", { params: { limit: 99999 } });
        const data = res.data;
        setLogs(Array.isArray(data) ? data : (data.logs || data.data || []));
      } else {
        const res = await axios.get("http://localhost:5000/api/variance_logs");
        setVarianceLogs(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setLogs([]);
      setVarianceLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [logType]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterYear, filterMonth, filterDay]);
  useEffect(() => { setFilterYear(""); setFilterMonth(""); setFilterDay(""); setSearchTerm(""); }, [logType]);

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

  const getActiveLogs = () => logType === "audit" ? logs : varianceLogs;

  const filteredLogs = getActiveLogs().filter(log => {
    const term = searchTerm.trim().toLowerCase();

    if (logType === "variance") {
      const nameMatch = !term ||
        (log.material_name || '').toLowerCase().includes(term) ||
        (log.merged_name || '').toLowerCase().includes(term) ||
        String(log.work_order_id || '').includes(term);
      let dateMatch = true;
      if (log.timestamp) {
        const date = new Date(log.timestamp);
        if (filterYear) dateMatch = dateMatch && date.getFullYear() === parseInt(filterYear);
        if (filterMonth) dateMatch = dateMatch && (date.getMonth() + 1) === parseInt(filterMonth);
        if (filterDay) dateMatch = dateMatch && date.getDate() === parseInt(filterDay);
      }
      return nameMatch && dateMatch;
    }

    const nameMatch = !term ||
      (log.merged_name || '').toLowerCase().startsWith(term) ||
      (log.role || '').toLowerCase().startsWith(term) ||
      (log.action || '').toLowerCase().startsWith(term);
    let dateMatch = true;
    if (log.timestamp) {
      const date = new Date(log.timestamp);
      if (filterYear) dateMatch = dateMatch && date.getFullYear() === parseInt(filterYear);
      if (filterMonth) dateMatch = dateMatch && (date.getMonth() + 1) === parseInt(filterMonth);
      if (filterDay) dateMatch = dateMatch && date.getDate() === parseInt(filterDay);
    }
    return nameMatch && dateMatch;
  });

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const uniqueUsers = [...new Set(logs.map(log => log.merged_name).filter(Boolean))];

  const getSortedLogsForExport = () => {
    let logsToExport = [...filteredLogs];
    if (filterUser) logsToExport = logsToExport.filter(log => log.merged_name === filterUser);
    if (exportStartDate || exportEndDate) {
      logsToExport = logsToExport.filter(log => {
        if (!log.timestamp) return false;
        const logDate = new Date(log.timestamp);
        const startStr = exportStartDate + (exportStartTime ? `T${exportStartTime}:00` : 'T00:00:00');
        const endStr = exportEndDate + (exportEndTime ? `T${exportEndTime}:59` : 'T23:59:59');
        if (exportStartDate && exportEndDate) return logDate >= new Date(startStr) && logDate <= new Date(endStr);
        if (exportStartDate) return logDate >= new Date(startStr);
        if (exportEndDate) return logDate <= new Date(endStr);
        return true;
      });
    }
    logsToExport.sort((a, b) => {
      if (sortBy === "date") return sortOrder === "asc" ? new Date(a.timestamp || 0) - new Date(b.timestamp || 0) : new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
      if (sortBy === "user") {
        const nameA = (a.merged_name || a.material_name || "").toLowerCase();
        const nameB = (b.merged_name || b.material_name || "").toLowerCase();
        return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return 0;
    });
    return logsToExport;
  };

  const getExportRows = () => {
    const sorted = getSortedLogsForExport();
    if (logType === "audit") {
      return sorted.map(log => ({
        User: log.merged_name || "Unknown",
        Role: log.role || "N/A",
        Action: log.action || "N/A",
        Timestamp: log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A",
      }));
    }
    return sorted.map(log => ({
      "Work Order ID": log.work_order_id || "N/A",
      Material: log.material_name || "N/A",
      Artisan: log.merged_name || "N/A",
      "Expected Qty": log.expected_qty ?? "N/A",
      "Actual Qty": log.actual_qty ?? "N/A",
      Variance: log.variance ?? "N/A",
      Timestamp: log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A",
    }));
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(getExportRows());
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");
      const label = logType === "audit" ? "Audit" : "Variance";
      const year = filterYear || currentYear;
      const month = filterMonth ? months[parseInt(filterMonth) - 1] : months[new Date().getMonth()];
      XLSX.writeFile(workbook, `${label}_Logs_${year}_${month}.xlsx`);
      setSortModalOpen(false);
    } catch (err) {}
  };

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape' });
      const rows = getExportRows();
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      const body = rows.map(r => headers.map(h => r[h] ?? "N/A"));
      const label = logType === "audit" ? "Audit Logs" : "Variance Logs";
      doc.text(label, 14, 12);
      autoTable(doc, {
        head: [headers],
        body,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        theme: 'grid',
        startY: 20,
      });
      const labelFile = logType === "audit" ? "Audit" : "Variance";
      const year = filterYear || currentYear;
      const month = filterMonth ? months[parseInt(filterMonth) - 1] : months[new Date().getMonth()];
      doc.save(`${labelFile}_Logs_${year}_${month}.pdf`);
      setSortModalOpen(false);
    } catch (err) { alert("PDF export failed."); }
  };

  const handleExportClick = (format) => {
    if (format === "pdf") exportToPDF();
    else exportToExcel();
  };

  const getActionBadge = (action) => {
    const base = "inline-block px-3 py-1 rounded-full text-[9px] font-bold uppercase max-w-[110px] truncate";
    if (!action) return <span className={`${base} bg-gray-100 text-gray-500`}>N/A</span>;
    const a = action.toLowerCase();
    if (a === 'login') return <span className={`${base} bg-emerald-100 text-emerald-700`}>{action}</span>;
    if (a === 'logout') return <span className={`${base} bg-slate-100 text-slate-500`}>{action}</span>;
    if (a.includes('password')) return <span className={`${base} bg-amber-100 text-amber-700`}>{action}</span>;
    if (a.includes('deactivat') || a.includes('locked') || a.includes('reject')) return <span className={`${base} bg-red-100 text-red-600`}>{action}</span>;
    if (a.includes('unlock') || a.includes('activ') || a.includes('approv')) return <span className={`${base} bg-blue-100 text-blue-600`}>{action}</span>;
    return <span className={`${base} bg-gray-100 text-gray-600`}>{action}</span>;
  };

  const getVarianceBadge = (val) => {
    if (val == null) return null;
    const n = Number(val);
    if (n === 0) return <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-gray-100 text-gray-500">Exact</span>;
    if (n > 0) return <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-orange-100 text-orange-600">+{n} Over</span>;
    return <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-600">{n} Under</span>;
  };

  return (
    <div className="h-screen bg-[#F8F9FA] flex flex-col font-sans overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 sm:px-10 pt-6 pb-10 custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <div ref={dropdownRef} className="relative">
            <div
              className="flex items-center gap-1 cursor-pointer font-black text-2xl sm:text-3xl text-gray-900 select-none"
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

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-4 flex gap-2 items-center overflow-x-auto">
          <div className="relative flex-1 min-w-[140px]">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={logType === "audit" ? "Search name, role, action..." : "Search material, artisan, WO..."}
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
                  <div key={y} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => { setFilterYear(y); setIsYearOpen(false); }}>{y}</div>
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
                  <div key={i} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => { setFilterMonth(i + 1); setIsMonthOpen(false); }}>{m}</div>
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
                  <div key={d} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => { setFilterDay(d); setIsDayOpen(false); }}>{d}</div>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200 flex-shrink-0 hidden sm:block" />
          <button
            className="bg-black text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg hover:scale-105 transition-all tracking-widest flex items-center gap-2 flex-shrink-0"
            onClick={() => setSortModalOpen(true)}
          >
            <HiOutlineDownload size={14} />
            Export
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6 border-b border-gray-50 flex justify-between items-center bg-[#FCFCFC]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
              {logType === "audit" ? "Activity Stream" : "Material Variance Records"}
            </h3>
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
            {logType === "audit" ? (
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="text-[11px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                    <th className="px-4 sm:px-8 py-6">User Details</th>
                    <th className="py-6">System Role</th>
                    <th className="py-6">Action</th>
                    <th className="px-4 sm:px-8 py-6 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-bold text-gray-700">
                  {currentLogs.length > 0 ? currentLogs.map((log, i) => (
                    <tr key={i} className="group border-b border-gray-50 last:border-none hover:bg-[#FBFBFB] transition-colors">
                      <td className="px-4 sm:px-8 py-5">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-white transition-all flex-shrink-0">
                            <HiOutlineUser size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 uppercase tracking-tighter text-xs sm:text-sm truncate">{log.merged_name || 'Unknown User'}</p>
                            <p className="text-[10px] text-gray-400 font-medium">UID: {log.user_id || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5">
                        <div className="flex items-center gap-2">
                          <HiOutlineShieldCheck className="text-gray-200 flex-shrink-0" />
                          <span className="uppercase tracking-widest text-[11px] font-bold text-gray-400 truncate">{log.role || "N/A"}</span>
                        </div>
                      </td>
                      <td className="py-5">{getActionBadge(log.action)}</td>
                      <td className="px-4 sm:px-8 py-5 text-right font-medium text-gray-400 tabular-nums text-xs whitespace-nowrap">
                        {log.timestamp ? (
                          <>
                            {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            <span className="mx-1 sm:mx-2 text-gray-200">|</span>
                            {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </>
                        ) : "No Date"}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="py-20 text-center opacity-20 font-black uppercase tracking-widest">No logs found</td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr className="text-[11px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                    <th className="px-4 sm:px-8 py-6">Work Order</th>
                    <th className="py-6">Material</th>
                    <th className="py-6">Artisan</th>
                    <th className="py-6 text-center">Expected</th>
                    <th className="py-6 text-center">Actual</th>
                    <th className="py-6 text-center">Variance</th>
                    <th className="px-4 sm:px-8 py-6 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] font-bold text-gray-700">
                  {currentLogs.length > 0 ? currentLogs.map((log, i) => (
                    <tr key={i} className="group border-b border-gray-50 last:border-none hover:bg-[#FBFBFB] transition-colors">
                      <td className="px-4 sm:px-8 py-5"><span className="text-xs font-black text-gray-400 tracking-wider">WO-{log.work_order_id || 'N/A'}</span></td>
                      <td className="py-5 min-w-0">
                        <div>
                          <p className="font-bold text-gray-800 text-sm truncate max-w-[120px]">{log.material_name || 'N/A'}</p>
                          <p className="text-[10px] text-gray-400 font-medium">MID: {log.material_id || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-black group-hover:text-white transition-all flex-shrink-0">
                            <HiOutlineUser size={14} />
                          </div>
                          <span className="text-xs font-bold text-gray-600 uppercase truncate max-w-[80px]">{log.merged_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-5 text-center"><span className="text-sm font-black text-gray-500">{log.expected_qty ?? 'N/A'}</span></td>
                      <td className="py-5 text-center"><span className="text-sm font-black text-gray-800">{log.actual_qty ?? 'N/A'}</span></td>
                      <td className="py-5 text-center">{getVarianceBadge(log.variance)}</td>
                      <td className="px-4 sm:px-8 py-5 text-right font-medium text-gray-400 tabular-nums text-xs whitespace-nowrap">
                        {log.timestamp ? (
                          <>
                            {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            <span className="mx-1 sm:mx-2 text-gray-200">|</span>
                            {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </>
                        ) : "No Date"}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="py-20 text-center opacity-20 font-black uppercase tracking-widest">No variance records yet</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {sortModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-4">
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 w-full max-w-xl relative shadow-2xl max-h-[90vh] overflow-y-auto">
              <button className="absolute top-6 right-6 sm:top-8 sm:right-8 text-slate-300 hover:text-black transition-all" onClick={() => setSortModalOpen(false)}><HiX size={24}/></button>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase mb-6 tracking-tighter">Export Settings</h2>
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
                    <button onClick={() => setSortBy("user")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${sortBy === "user" ? "bg-black text-white" : "bg-[#F3F4F6] text-slate-600"}`}>Name</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Order</label>
                  <div className="flex gap-2">
                    <button onClick={() => setSortOrder("asc")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${sortOrder === "asc" ? "bg-black text-white" : "bg-[#F3F4F6] text-slate-600"}`}>Ascending</button>
                    <button onClick={() => setSortOrder("desc")} className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${sortOrder === "desc" ? "bg-black text-white" : "bg-[#F3F4F6] text-slate-600"}`}>Descending</button>
                  </div>
                </div>
                {logType === "audit" && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Filter by User (Optional)</label>
                    <select className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                      <option value="">All Users</option>
                      {uniqueUsers.map((user, idx) => (<option key={idx} value={user}>{user}</option>))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-4 justify-center pt-4 border-t">
                <div className="flex-1 border-2 border-black rounded-xl p-4 flex flex-col items-center text-center cursor-pointer hover:bg-gray-100 hover:scale-105 transition-all" onClick={() => handleExportClick("pdf")}>
                  <FaRegFilePdf size={32} className="text-black mb-2" />
                  <p className="font-bold text-black text-sm">PDF</p>
                </div>
                <div className="flex-1 border-2 border-black rounded-xl p-4 flex flex-col items-center text-center cursor-pointer hover:bg-gray-100 hover:scale-105 transition-all" onClick={() => handleExportClick("excel")}>
                  <FaRegFileExcel size={32} className="text-black mb-2" />
                  <p className="font-bold text-black text-sm">EXCEL</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;