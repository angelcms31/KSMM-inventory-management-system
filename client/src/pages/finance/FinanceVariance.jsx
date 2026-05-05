import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  HiOutlineClock, HiOutlineUser,
  HiOutlineSearch, HiChevronDown, HiX, HiChevronLeft, HiChevronRight,
  HiOutlineDownload, HiOutlineEye, HiCheckCircle, HiXCircle
} from "react-icons/hi";
import { FaRegFilePdf, FaRegFileExcel } from "react-icons/fa";

const AlertDialog = ({ alert, onClose }) => {
  if (!alert) return null;
  const isSuccess = alert.type === 'success';

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.25)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 flex flex-col items-center text-center relative overflow-hidden"
        style={{ animation: 'popIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards' }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center mb-6 ${isSuccess ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          {isSuccess
            ? <HiCheckCircle size={44} className="text-emerald-500" />
            : <HiXCircle size={44} className="text-rose-500" />
          }
        </div>

        <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isSuccess ? 'Success' : 'Error'}
        </p>

        <p className="text-slate-800 font-black text-lg leading-snug tracking-tight mb-8">
          {alert.message}
        </p>

        <div className="flex flex-col gap-2 w-full">
          {isSuccess && alert.fileUrl && (
            <button
              onClick={() => { window.open(alert.fileUrl, '_blank'); onClose(); }}
              className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all bg-black hover:bg-stone-800 shadow-xl shadow-stone-200"
            >
              View Document
            </button>
          )}
          <button
            onClick={onClose}
            className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]
              ${isSuccess ? 'text-emerald-600 bg-emerald-50' : 'bg-rose-500 text-white shadow-lg shadow-rose-200'}`}
          >
            {isSuccess ? 'Close' : 'Try Again'}
          </button>
        </div>

        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-[0.06] ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      </div>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)     translateY(0);    }
        }
      `}</style>
    </div>
  );
};

const FinanceVariance = ({ userId }) => {
  const [varianceLogs, setVarianceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportedByName, setExportedByName] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [alert, setAlert] = useState(null);

  const logsPerPage = 15;

  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportStartTime, setExportStartTime] = useState("");
  const [exportEndTime, setExportEndTime] = useState("");

  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const dayRef = useRef(null);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isDayOpen, setIsDayOpen] = useState(false);

  const today = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const showAlert = (message, type = 'success', fileUrl = null) => setAlert({ message, type, fileUrl });
  const closeAlert = () => setAlert(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/variance_logs");
      setVarianceLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setVarianceLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExporterInfo = useCallback(async () => {
    const fName = localStorage.getItem("firstName");
    const lName = localStorage.getItem("lastName");
    const sId = localStorage.getItem("user_id");

    if (fName && lName && fName !== "null" && lName !== "null") {
      setExportedByName(`${fName} ${lName}`);
    } else if (userId || sId) {
      try {
        const res = await axios.get(`http://localhost:5000/api/user/name/${userId || sId}`);
        if (res.data?.name) setExportedByName(res.data.name);
      } catch (err) {
        setExportedByName("Angel Camus");
      }
    }
    if (sId) setCurrentUserId(sId);
  }, [userId]);

  useEffect(() => {
    fetchLogs();
    fetchExporterInfo();
  }, [fetchExporterInfo]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterYear, filterMonth, filterDay]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) setIsYearOpen(false);
      if (monthRef.current && !monthRef.current.contains(event.target)) setIsMonthOpen(false);
      if (dayRef.current && !dayRef.current.contains(event.target)) setIsDayOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportTimestamp = new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const filteredLogs = varianceLogs.filter(log => {
    const term = searchTerm.trim().toLowerCase();
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
  });

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const getSortedLogsForExport = () => {
    let logsToExport = [...filteredLogs];
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
      if (sortBy === "date") return sortOrder === "asc"
        ? new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
        : new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
      if (sortBy === "user") {
        const nameA = (a.merged_name || a.material_name || "").toLowerCase();
        const nameB = (b.merged_name || b.material_name || "").toLowerCase();
        return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return 0;
    });
    return logsToExport;
  };

  const getExportRows = () =>
    getSortedLogsForExport().map(log => ({
      "Work Order ID": log.work_order_id || "N/A",
      Material: log.material_name || "N/A",
      Artisan: log.merged_name || "N/A",
      "Expected Qty": log.expected_qty ?? "N/A",
      "Actual Qty": log.actual_qty ?? "N/A",
      Variance: log.variance ?? "N/A",
      Timestamp: log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A",
    }));

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const dataRows = getExportRows();
      const metaRows = [
        { "Work Order ID": "Report:", Material: "Variance Logs", Artisan: "", "Expected Qty": "", "Actual Qty": "", Variance: "", Timestamp: "" },
        { "Work Order ID": "Exported By:", Material: `${exportedByName} (ID: ${currentUserId || 'N/A'})`, Artisan: "", "Expected Qty": "", "Actual Qty": "", Variance: "", Timestamp: "" },
        { "Work Order ID": "Timestamp:", Material: exportTimestamp, Artisan: "", "Expected Qty": "", "Actual Qty": "", Variance: "", Timestamp: "" },
        { "Work Order ID": "", Material: "", Artisan: "", "Expected Qty": "", "Actual Qty": "", Variance: "", Timestamp: "" },
      ];
      const ws = XLSX.utils.json_to_sheet([...metaRows, ...dataRows]);
      XLSX.utils.book_append_sheet(wb, ws, "Variance Logs");
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Variance_Logs_${new Date().getTime()}.xlsx`;
      a.click();
      setSortModalOpen(false);
      showAlert("Excel report generated successfully!", "success");
    } catch (err) {
      showAlert("Failed to export Excel.", "error");
    }
  };

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16).setFont(undefined, 'bold').text("Variance Logs Report", 14, 15);
      doc.setFontSize(9).setFont(undefined, 'normal').setTextColor(100);
      doc.text(`Exported By: ${exportedByName} (ID: ${currentUserId || 'N/A'})`, 14, 22);
      doc.text(`Generated On: ${exportTimestamp}`, 14, 27);
      const rows = getExportRows();
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      const body = rows.map(r => headers.map(h => r[h] ?? "N/A"));
      autoTable(doc, {
        head: [headers],
        body,
        styles: { fontSize: 7, cellPadding: 3 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        theme: 'grid',
        startY: 35,
      });
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Variance_Logs_${new Date().getTime()}.pdf`;
      a.click();
      setSortModalOpen(false);
      showAlert("PDF report generated successfully!", "success", url);
    } catch (err) {
      showAlert("Failed to export PDF.", "error");
    }
  };

  const previewRows = getExportRows();

  const getVarianceBadge = (val) => {
    if (val == null) return null;
    const n = Number(val);
    if (n === 0) return <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-gray-100 text-gray-500">Exact</span>;
    if (n > 0) return <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-orange-100 text-orange-600">+{n} Over</span>;
    return <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-600">{n} Under</span>;
  };

  return (
    <div className="h-screen bg-[#F8F9FA] flex flex-col font-sans overflow-hidden">
      <AlertDialog alert={alert} onClose={closeAlert} />
      <div className="flex-1 overflow-y-auto px-4 sm:px-10 pt-6 pb-10 custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-black text-2xl sm:text-3xl text-gray-900 select-none">VARIANCE LOGS</h1>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <HiOutlineClock className="text-stone-400" size={20} />
            <div>
              <p className="text-[9px] font-black text-gray-300 uppercase leading-none">Last Update</p>
              <p className="text-xs font-bold text-gray-700">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-4 flex gap-2 items-center">
          <div className="relative flex-1 min-w-[140px]">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search material, artisan, WO..."
              className="w-full bg-[#F8F9FA] border-none rounded-xl py-2.5 pl-11 pr-4 outline-none font-bold text-slate-700 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div ref={yearRef} className="relative flex-shrink-0">
            <button
              onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); setIsDayOpen(false); }}
              className="px-4 py-2.5 bg-[#F8F9FA] rounded-xl text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2 hover:bg-gray-100 transition-all whitespace-nowrap"
            >
              {filterYear || "Year"}
              <HiChevronDown className={`w-3 h-3 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
            </button>
            {isYearOpen && (
              <div className="absolute top-full mt-2 w-32 bg-white border border-gray-100 rounded-xl shadow-2xl p-2 right-0" style={{ zIndex: 9999 }}>
                <div className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => { setFilterYear(""); setIsYearOpen(false); }}>Clear</div>
                {years.map(y => (
                  <div key={y} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => { setFilterYear(y); setIsYearOpen(false); }}>{y}</div>
                ))}
              </div>
            )}
          </div>

          <div ref={monthRef} className="relative flex-shrink-0">
            <button
              onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); setIsDayOpen(false); }}
              className="px-4 py-2.5 bg-[#F8F9FA] rounded-xl text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2 hover:bg-gray-100 transition-all whitespace-nowrap"
            >
              {filterMonth ? months[filterMonth - 1] : "Month"}
              <HiChevronDown className={`w-3 h-3 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMonthOpen && (
              <div className="absolute top-full mt-2 w-36 bg-white border border-gray-100 rounded-xl shadow-2xl p-2 max-h-52 overflow-y-auto right-0" style={{ zIndex: 9999 }}>
                <div className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => { setFilterMonth(""); setIsMonthOpen(false); }}>Clear</div>
                {months.map((m, i) => (
                  <div key={i} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => { setFilterMonth(i + 1); setIsMonthOpen(false); }}>{m}</div>
                ))}
              </div>
            )}
          </div>

          <div ref={dayRef} className="relative flex-shrink-0">
            <button
              onClick={() => { setIsDayOpen(!isDayOpen); setIsYearOpen(false); setIsMonthOpen(false); }}
              className="px-4 py-2.5 bg-[#F8F9FA] rounded-xl text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2 hover:bg-gray-100 transition-all whitespace-nowrap"
            >
              {filterDay || "Day"}
              <HiChevronDown className={`w-3 h-3 transition-transform ${isDayOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDayOpen && (
              <div className="absolute top-full mt-2 w-24 bg-white border border-gray-100 rounded-xl shadow-2xl p-2 max-h-52 overflow-y-auto right-0" style={{ zIndex: 9999 }}>
                <div className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => { setFilterDay(""); setIsDayOpen(false); }}>Clear</div>
                {days.map(d => (
                  <div key={d} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => { setFilterDay(d); setIsDayOpen(false); }}>{d}</div>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200 flex-shrink-0 hidden sm:block" />
          <button
            className="bg-black text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-stone-800 transition-all tracking-widest flex items-center gap-2 flex-shrink-0"
            onClick={() => setSortModalOpen(true)}
          >
            <HiOutlineDownload size={14} />
            Export
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6 border-b border-gray-50 flex justify-between items-center bg-[#FCFCFC]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Material Variance Records</h3>
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
          </div>
        </div>

        {sortModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[150] p-4">
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 w-full max-w-xl relative shadow-2xl max-h-[90vh] overflow-y-auto">
              <button className="absolute top-6 right-6 sm:top-8 sm:right-8 text-slate-300 hover:text-black transition-all" onClick={() => setSortModalOpen(false)}><HiX size={24}/></button>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase mb-4 tracking-tighter">Export</h2>

              <div className="mb-6 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black mb-1">Operator Signature</p>
                <p className="text-sm font-black text-gray-800">{exportedByName} (ID: {currentUserId || 'N/A'})</p>
                <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase">{exportTimestamp}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Date & Time Range (Optional)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] text-slate-500 ml-2 font-bold">From</label>
                      <input
                        type="date"
                        className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm"
                        value={exportStartDate}
                        max={today}
                        onChange={(e) => {
                          setExportStartDate(e.target.value);
                          if (exportEndDate && e.target.value > exportEndDate) {
                            setExportEndDate("");
                            setExportEndTime("");
                          }
                        }}
                      />
                      <input
                        type="time"
                        className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        value={exportStartTime}
                        onChange={(e) => setExportStartTime(e.target.value)}
                        disabled={!exportStartDate}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-slate-500 ml-2 font-bold">To</label>
                      <input
                        type="date"
                        className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        value={exportEndDate}
                        min={exportStartDate || undefined}
                        max={today}
                        disabled={!exportStartDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                      />
                      <input
                        type="time"
                        className="w-full bg-[#F3F4F6] rounded-xl p-3 outline-none border border-transparent font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        value={exportEndTime}
                        onChange={(e) => setExportEndTime(e.target.value)}
                        disabled={!exportEndDate}
                      />
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
              </div>

              <button className="w-full py-4 rounded-xl bg-black text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-stone-800 transition-all active:scale-95 mb-4" onClick={() => { setSortModalOpen(false); setPreviewOpen(true); }}>
                <HiOutlineEye size={16} /> Preview Report
              </button>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="border-2 border-gray-100 rounded-2xl p-4 flex flex-col items-center cursor-pointer hover:border-black transition-all group" onClick={exportToPDF}>
                  <FaRegFilePdf size={28} className="text-gray-300 group-hover:text-red-500 mb-2" />
                  <p className="font-black text-gray-400 group-hover:text-black text-[10px] uppercase tracking-widest">Generate PDF</p>
                </div>
                <div className="border-2 border-gray-100 rounded-2xl p-4 flex flex-col items-center cursor-pointer hover:border-black transition-all group" onClick={exportToExcel}>
                  <FaRegFileExcel size={28} className="text-gray-300 group-hover:text-emerald-500 mb-2" />
                  <p className="font-black text-gray-400 group-hover:text-black text-[10px] uppercase tracking-widest">Generate Excel</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {previewOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[200] p-4">
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-4xl relative shadow-2xl max-h-[90vh] flex flex-col">
              <button className="absolute top-8 right-8 text-slate-300 hover:text-black transition-all" onClick={() => setPreviewOpen(false)}><HiX size={24} /></button>
              <h2 className="text-xl font-black text-slate-900 uppercase mb-2 tracking-tighter">Document Preview</h2>
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex flex-col"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Prepared By</span><span className="text-xs font-black text-gray-800">{exportedByName}</span></div>
                <div className="flex flex-col"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</span><span className="text-xs font-black text-gray-800">{exportTimestamp}</span></div>
                <div className="flex flex-col"><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Records</span><span className="text-xs font-black text-emerald-600">{previewRows.length} Entries</span></div>
              </div>
              <div className="overflow-auto flex-1 rounded-2xl border border-gray-100 shadow-inner">
                <table className="w-full text-left min-w-[640px]">
                  <thead className="sticky top-0 bg-black text-white">
                    <tr>
                      {["Work Order ID", "Material", "Artisan", "Expected Qty", "Actual Qty", "Variance", "Timestamp"].map(h => (
                        <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {previewRows.length > 0 ? previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-black text-gray-800">{row["Work Order ID"]}</td>
                        <td className="px-6 py-4 text-[10px] font-bold text-gray-700">{row.Material}</td>
                        <td className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">{row.Artisan}</td>
                        <td className="px-6 py-4 text-[10px] font-bold text-gray-500 text-center">{row["Expected Qty"]}</td>
                        <td className="px-6 py-4 text-[10px] font-bold text-gray-800 text-center">{row["Actual Qty"]}</td>
                        <td className="px-6 py-4 text-[10px] font-bold text-gray-500 text-center">{row.Variance}</td>
                        <td className="px-6 py-4 text-[10px] font-medium text-gray-400 tabular-nums">{row.Timestamp}</td>
                      </tr>
                    )) : (<tr><td colSpan="7" className="py-20 text-center text-gray-300 font-black uppercase text-xs">No data available</td></tr>)}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-4 mt-6">
                <button className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-stone-800 transition-all active:scale-95" onClick={() => { setPreviewOpen(false); exportToPDF(); }}><FaRegFilePdf size={18} /> Download Document (PDF)</button>
                <button className="flex-1 bg-white border-2 border-black text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95" onClick={() => { setPreviewOpen(false); exportToExcel(); }}><FaRegFileExcel size={18} /> Download Sheet (Excel)</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceVariance;