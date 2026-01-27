import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
 HiOutlineClock, HiOutlineUser, HiOutlineShieldCheck,
 HiOutlineSearch, HiOutlineClipboardList, HiChevronDown, HiPlus, HiX
} from "react-icons/hi";
import { FaRegFilePdf, FaRegFileExcel } from "react-icons/fa";


const FinanceLogs = () => {
 const [logs, setLogs] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState("");
 const [currentPage, setCurrentPage] = useState(1);
 const [logType, setLogType] = useState("audit");
 const [dropdownOpen, setDropdownOpen] = useState(false);
 const [exportModalOpen, setExportModalOpen] = useState(false);


 const logsPerPage = 8;


 const [filterYear, setFilterYear] = useState("");
 const [filterMonth, setFilterMonth] = useState("");
 const [filterDay, setFilterDay] = useState("");


 // Refs & dropdown states
 const yearRef = useRef(null);
 const monthRef = useRef(null);
 const dayRef = useRef(null);
 const [isYearOpen, setIsYearOpen] = useState(false);
 const [isMonthOpen, setIsMonthOpen] = useState(false);
 const [isDayOpen, setIsDayOpen] = useState(false);


 const currentYear = new Date().getFullYear();
 const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
 const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
 const days = Array.from({ length: 31 }, (_, i) => i + 1);


 /* ================= FETCH LOGS ================= */
 const fetchLogs = async () => {
   setLoading(true);
   try {
     const url = logType === "audit"
       ? "http://localhost:5000/api/audit_logs"
       : "http://localhost:5000/api/variance_logs";
     const res = await axios.get(url);
     setLogs(res.data || []);
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


 /* ================= CLICK OUTSIDE ================= */
 useEffect(() => {
   const handleClickOutside = (event) => {
     if (yearRef.current && !yearRef.current.contains(event.target)) setIsYearOpen(false);
     if (monthRef.current && !monthRef.current.contains(event.target)) setIsMonthOpen(false);
     if (dayRef.current && !dayRef.current.contains(event.target)) setIsDayOpen(false);
   };
   document.addEventListener('mousedown', handleClickOutside);
   return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);


 /* ================= FILTER LOGS ================= */
 const filteredLogs = logs.filter(log => {
   const nameMatch = log.merged_name?.toLowerCase().includes(searchTerm.toLowerCase());
   const roleMatch = log.role?.toLowerCase().includes(searchTerm.toLowerCase());
   const actionMatch = log.action?.toLowerCase().includes(searchTerm.toLowerCase());


   let dateMatch = true;
   if (log.timestamp) {
     const date = new Date(log.timestamp);
     if (filterYear) dateMatch = dateMatch && date.getFullYear() === parseInt(filterYear);
     if (filterMonth) dateMatch = dateMatch && (date.getMonth() + 1) === parseInt(filterMonth);
     if (filterDay) dateMatch = dateMatch && date.getDate() === parseInt(filterDay);
   }


   return (nameMatch || roleMatch || actionMatch) && dateMatch;
 });


 /* ================= PAGINATION ================= */
 const indexOfLastLog = currentPage * logsPerPage;
 const indexOfFirstLog = indexOfLastLog - logsPerPage;
 const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
 const totalPages = Math.ceil(filteredLogs.length / logsPerPage);


 const getCompactPageNumbers = () => {
   const delta = 1;
   const range = [];
   for (let i = 1; i <= totalPages; i++) {
     if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
       range.push(i);
     } else if (range[range.length - 1] !== '...') {
       range.push('...');
     }
   }
   return range;
 };


 /* ================= EXPORT FUNCTIONS ================= */
 const exportToExcel = async () => {
   try {
     const XLSX = await import('xlsx');
     const worksheet = XLSX.utils.json_to_sheet(filteredLogs);
     const workbook = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");
     const logTypeName = logType === "audit" ? "Audit" : "Variance";
     const year = filterYear || currentYear;
     const month = filterMonth ? months[parseInt(filterMonth) - 1] : months[new Date().getMonth()];
     const filename = `Finance_${logTypeName}_Logs_${year}_${month}.xlsx`;
     XLSX.writeFile(workbook, filename);
     setExportModalOpen(false);
   } catch (err) { console.error(err); }
 };


 const exportToPDF = async () => {
   try {
     const { default: jsPDF } = await import('jspdf');
     const { default: autoTable } = await import('jspdf-autotable');


     const doc = new jsPDF({ orientation: 'landscape' });
     const tableColumn = ["User", "Role", "Action", "Timestamp"];
     const tableRows = filteredLogs.map(log => [
       log.merged_name || "Unknown",
       log.role || "N/A",
       log.action || "N/A",
       log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"
     ]);


     doc.text(`${logType === "audit" ? "Finance Audit Logs" : "Finance Variance Logs"}`, 14, 12);
     autoTable(doc, {
       head: [tableColumn],
       body: tableRows,
       styles: { fontSize: 8 },
       headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
       theme: 'grid',
       startY: 20,
     });


     const logTypeName = logType === "audit" ? "Audit" : "Variance";
     const year = filterYear || currentYear;
     const month = filterMonth ? months[parseInt(filterMonth) - 1] : months[new Date().getMonth()];
     const filename = `Finance_${logTypeName}_Logs_${year}_${month}.pdf`;
     doc.save(filename);
     setExportModalOpen(false);
   } catch (err) { console.error(err); alert("PDF export failed."); }
 };


 if (loading) return <div className="h-screen flex items-center justify-center font-bold text-gray-400 animate-pulse">Loading Logs...</div>;


 return (
   <div className="h-screen bg-[#F8F9FA] flex flex-col font-sans overflow-hidden">
     <div className="flex-1 overflow-y-auto px-10 pt-6 pb-20 custom-scrollbar">


       {/* Header */}
       <div className="flex justify-between items-center mb-8 pr-4">
         <div className="relative">
           <div
             className="flex items-center gap-1 cursor-pointer font-black text-3xl text-gray-900 select-none"
             onClick={() => setDropdownOpen(prev => !prev)}
           >
             {logType === "audit" ? "Audit Logs" : "Variance Logs"}
             <HiChevronDown className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
           </div>
           {dropdownOpen && (
             <div className="absolute bg-white border rounded shadow-md mt-2 w-40 z-10">
               <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setLogType("audit"); setDropdownOpen(false); }}>Audit Logs</div>
               <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setLogType("variance"); setDropdownOpen(false); }}>Variance Logs</div>
             </div>
           )}
         </div>


         {/* Filters */}
         <div className="flex items-center gap-4">


           {/* Year / Month / Day Dropdowns */}
           <div className="flex gap-2">
             {/* Year */}
             <div ref={yearRef} className="relative">
               <button
                 onClick={() => setIsYearOpen(!isYearOpen)}
                 className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2 hover:bg-gray-50 transition-all"
               >
                 {filterYear || "Year"}
                 <HiChevronDown className={`w-3 h-3 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
               </button>
               {isYearOpen && (
                 <div className="absolute mt-2 w-32 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2">
                   {years.map(y => (
                     <div
                       key={y}
                       className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-black rounded-lg cursor-pointer"
                       onClick={() => { setFilterYear(y); setIsYearOpen(false); }}
                     >{y}</div>
                   ))}
                 </div>
               )}
             </div>


             {/* Month */}
             <div ref={monthRef} className="relative">
               <button
                 onClick={() => setIsMonthOpen(!isMonthOpen)}
                 className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2 hover:bg-gray-50 transition-all"
               >
                 {filterMonth ? months[filterMonth - 1] : "Month"}
                 <HiChevronDown className={`w-3 h-3 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} />
               </button>
               {isMonthOpen && (
                 <div className="absolute mt-2 w-32 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2 max-h-52 overflow-y-auto">
                   {months.map((m, i) => (
                     <div
                       key={i}
                       className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-black rounded-lg cursor-pointer"
                       onClick={() => { setFilterMonth(i + 1); setIsMonthOpen(false); }}
                     >{m}</div>
                   ))}
                 </div>
               )}
             </div>


             {/* Day */}
             <div ref={dayRef} className="relative">
               <button
                 onClick={() => setIsDayOpen(!isDayOpen)}
                 className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2 hover:bg-gray-50 transition-all"
               >
                 {filterDay || "Day"}
                 <HiChevronDown className={`w-3 h-3 transition-transform ${isDayOpen ? 'rotate-180' : ''}`} />
               </button>
               {isDayOpen && (
                 <div className="absolute mt-2 w-24 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2 max-h-52 overflow-y-auto">
                   {days.map(d => (
                     <div
                       key={d}
                       className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-black rounded-lg cursor-pointer"
                       onClick={() => { setFilterDay(d); setIsDayOpen(false); }}
                     >{d}</div>
                   ))}
                 </div>
               )}
             </div>
           </div>


           {/* Last Update */}
           <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
             <HiOutlineClock className="text-stone-400" size={20} />
             <div>
               <p className="text-[9px] font-black text-gray-300 uppercase leading-none">Last Update</p>
               <p className="text-xs font-bold text-gray-700">{new Date().toLocaleTimeString()}</p>
             </div>
           </div>
         </div>
       </div>


       {/* Search */}
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


       {/* Table */}
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
               {currentLogs.length > 0 ? currentLogs.map((log, i) => (
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
                       <span className="uppercase tracking-widest text-[11px] font-black text-gray-400">{log.role || "N/A"}</span>
                     </div>
                   </td>
                   <td className="py-6">
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                       log.action === 'Login' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                     }`}>
                       {log.action || "N/A"}
                     </span>
                   </td>
                   <td className="px-8 py-6 text-right font-medium text-gray-400 tabular-nums">
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


         {/* Pagination */}
         {totalPages > 1 && (
           <div className="flex justify-end gap-1 p-4">
             <button className="px-2 py-1 border rounded text-sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>&lt;</button>
             {getCompactPageNumbers().map((num, idx) => (
               <button key={idx} className={`px-2 py-1 border rounded text-sm ${num === currentPage ? 'bg-gray-300' : ''}`} onClick={() => typeof num==='number' && setCurrentPage(num)} disabled={num==='...'}>{num}</button>
             ))}
             <button className="px-2 py-1 border rounded text-sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>&gt;</button>
           </div>
         )}
       </div>


       {/* Export Button */}
       <div className="mt-4 ml-8">
         <button
           className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition"
           onClick={() => setExportModalOpen(true)}
         >
           <HiPlus size={16} /> Export PDF / EXCEL
         </button>
       </div>


       {/* Export Modal */}
       {exportModalOpen && (
         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
           <div className="bg-white rounded-xl p-6 w-96 text-center relative">
             <button className="absolute top-3 right-3" onClick={() => setExportModalOpen(false)}>
               <HiX />
             </button>
             <p className="text-sm mb-4">How would you like to download the data?</p>
             <div className="flex gap-4 justify-center">
               <div
                 className="flex-1 border border-black rounded-lg p-4 flex flex-col items-center text-center cursor-pointer hover:bg-gray-100 hover:scale-105 transition-all"
                 onClick={exportToPDF}
               >
                 <FaRegFilePdf size={32} className="text-black mb-2" />
                 <p className="font-medium text-black">PDF</p>
                 <p className="text-xs text-black mt-1">Download a print-ready version of your data</p>
               </div>
               <div
                 className="flex-1 border border-black rounded-lg p-4 flex flex-col items-center text-center cursor-pointer hover:bg-gray-100 hover:scale-105 transition-all"
                 onClick={exportToExcel}
               >
                 <FaRegFileExcel size={32} className="text-black mb-2" />
                 <p className="font-medium text-black">EXCEL</p>
                 <p className="text-xs text-black mt-1">Download an editable spreadsheet of your data</p>
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

