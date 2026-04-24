import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, Download, ChevronDown, TrendingUp, TrendingDown,
  CheckCircle, XCircle, FileText, FileSpreadsheet,
  Inbox, ArrowUpRight, ArrowDownRight, Activity,
  ChevronLeft, ChevronRight, Eye, User, Clock, Filter, RefreshCw
} from "lucide-react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const API = "http://localhost:5000";

const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" }, { value: 4, label: "April" },
  { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" },
  { value: 9, label: "September" }, { value: 10, label: "October" },
  { value: 11, label: "November" }, { value: 12, label: "December" }
];

const TYPE_OPTIONS = ["All", "Revenue", "Expense", "Adjustment"];

const STATUS_META = {
  Pending: { color: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400" },
  Completed: { color: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-400" },
  Cancelled: { color: "bg-red-50 text-red-600 border border-red-200", dot: "bg-red-400" }
};

const TYPE_META = {
  Revenue: { color: "text-emerald-600", bg: "bg-emerald-50", icon: <ArrowUpRight className="w-3 h-3" /> },
  Expense: { color: "text-red-500", bg: "bg-red-50", icon: <ArrowDownRight className="w-3 h-3" /> },
  Adjustment: { color: "text-blue-500", bg: "bg-blue-50", icon: <Activity className="w-3 h-3" /> }
};

const fmt = (n) =>
  Number(n).toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
};

const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
};

const PAGE_LIMIT = 10;
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-gray-900 text-white"
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 ${styles[type]}`}>
      {type === "success" && <CheckCircle className="w-4 h-4" />}
      {type === "error" && <XCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

function NotifModal({ title, message, type, onClose, actionLabel, onAction }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 relative animate-in zoom-in duration-200">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${type === "success" ? "bg-emerald-50" : "bg-red-50"}`}>
          {type === "success"
            ? <CheckCircle className="w-7 h-7 text-emerald-500" />
            : <XCircle className="w-7 h-7 text-red-500" />}
        </div>
        <h3 className="text-lg font-black text-gray-900 text-center mb-2">{title}</h3>
        <p className="text-sm text-gray-400 text-center mb-7">{message}</p>
        <div className="flex flex-col gap-2">
          {onAction && (
            <button onClick={onAction} className="w-full py-3 bg-black text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" /> {actionLabel}
            </button>
          )}
          <button onClick={onClose} className="w-full py-3 text-gray-400 text-sm font-bold hover:text-black transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DropdownFilter({ label, options, selected, onSelect, dropRef, open, setOpen, valueKey = null }) {
  return (
    <div ref={dropRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2 hover:bg-gray-50 transition-all min-w-[90px]"
      >
        <span className="flex-1 text-left truncate max-w-[80px]">
          {valueKey
            ? (options.find(o => o[valueKey] === selected)?.label ?? label)
            : (selected ?? label)}
        </span>
        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in duration-150">
          {options.map((item, i) => {
            const val = valueKey ? item[valueKey] : item;
            const lbl = valueKey ? item.label : item;
            const isActive = selected === val;
            return (
              <div
                key={i}
                onClick={() => { onSelect(val === selected ? null : val); setOpen(false); }}
                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${isActive ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50 hover:text-black"}`}
              >
                {lbl}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FinanceTransactions({ socket }) {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState(null);
  const [filterType, setFilterType] = useState(null);

  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);
  const [notifModal, setNotifModal] = useState(null);

  const [currentUser, setCurrentUser] = useState(localStorage.getItem("firstName") || "System User");
  const [exportYear, setExportYear] = useState(currentYear);
  const [exportMonth, setExportMonth] = useState(null);
  const [exportType, setExportType] = useState("All");
  const [exportYearOpen, setExportYearOpen] = useState(false);
  const [exportMonthOpen, setExportMonthOpen] = useState(false);
  const [exportTypeOpen, setExportTypeOpen] = useState(false);

  const [lastDownloadedBlob, setLastDownloadedBlob] = useState(null);

  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const typeRef = useRef(null);
  const exportYearRef = useRef(null);
  const exportMonthRef = useRef(null);
  const exportTypeRef = useRef(null);

  const showToast = (message, type = "info") => setToast({ message, type });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, limit: PAGE_LIMIT,
        search,
        year: filterYear,
        month: filterMonth,
        type: filterType !== "All" ? filterType : null
      };
      const res = await axios.get(`${API}/api/finance/transactions`, { params });
      setTransactions(res.data.transactions || []);
      setTotal(res.data.total || 0);
      setStats(res.data.stats);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterYear, filterMonth, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!socket) return;
    socket.on("transactions:updated", fetchData);
    return () => socket.off("transactions:updated", fetchData);
  }, [socket, fetchData]);

  useEffect(() => {
    const h = (e) => {
      if (yearRef.current && !yearRef.current.contains(e.target)) setYearOpen(false);
      if (monthRef.current && !monthRef.current.contains(e.target)) setMonthOpen(false);
      if (typeRef.current && !typeRef.current.contains(e.target)) setTypeOpen(false);
      if (exportYearRef.current && !exportYearRef.current.contains(e.target)) setExportYearOpen(false);
      if (exportMonthRef.current && !exportMonthRef.current.contains(e.target)) setExportMonthOpen(false);
      if (exportTypeRef.current && !exportTypeRef.current.contains(e.target)) setExportTypeOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fetchExportData = async () => {
    const res = await axios.get(`${API}/api/finance/transactions`, {
      params: {
        page: 1,
        limit: 99999,
        year: exportYear,
        month: exportMonth,
        type: exportType !== "All" ? exportType : null
      }
    });
    return res.data.transactions || [];
  };

  const buildFileLabel = () => {
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const monthLabel = exportMonth ? MONTHS.find(m => m.value === exportMonth)?.label : "All-Months";
    const typeLabel = exportType !== "All" ? exportType : "All-Types";
    return { ts, monthLabel, typeLabel };
  };

  const viewDownloaded = () => {
    if (!lastDownloadedBlob) return;
    const url = URL.createObjectURL(lastDownloadedBlob);
    window.open(url, "_blank");
  };

  const exportPDF = async () => {
    try {
      const data = await fetchExportData();
      const { ts, monthLabel, typeLabel } = buildFileLabel();
      const filename = `ledger_${exportYear}_${monthLabel}_${typeLabel}_by-${currentUser.replace(/\s+/g, "-")}_${ts}.pdf`;

      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Finance Transactions Ledger", 14, 14);

      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.text(`Exported by: ${currentUser}`, 14, 21);
      doc.text(`Downloaded: ${fmtDateTime(new Date())}`, 14, 26);
      doc.text(`Filter: Year ${exportYear} | Month: ${monthLabel} | Type: ${typeLabel}`, 14, 31);

      autoTable(doc, {
        startY: 37,
        head: [["Ref #", "Category", "Details", "Date", "Type", "Amount", "Status"]],
        body: data.map(t => [
          t.reference_no,
          t.category,
          t.description || "—",
          fmtDate(t.transaction_date),
          t.transaction_type,
          fmt(t.amount),
          t.status
        ]),
        headStyles: { fillColor: [0, 0, 0] },
        styles: { fontSize: 8 }
      });

      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      setLastDownloadedBlob(pdfBlob);
      setShowExport(false);
      setNotifModal({
        title: "Export Successful",
        message: `PDF saved as "${filename}"`,
        type: "success",
        actionLabel: "View Downloaded File",
        onAction: () => { window.open(URL.createObjectURL(pdfBlob), "_blank"); setNotifModal(null); }
      });
    } catch {
      showToast("Failed to export PDF.", "error");
    }
  };

  const exportExcel = async () => {
    try {
      const data = await fetchExportData();
      const { ts, monthLabel, typeLabel } = buildFileLabel();
      const filename = `ledger_${exportYear}_${monthLabel}_${typeLabel}_by-${currentUser.replace(/\s+/g, "-")}_${ts}.xlsx`;

      const meta = [
        ["Finance Transactions Ledger"],
        [`Exported by: ${currentUser}`],
        [`Downloaded: ${fmtDateTime(new Date())}`],
        [`Filter: Year ${exportYear} | Month: ${monthLabel} | Type: ${typeLabel}`],
        []
      ];

      const rows = data.map(t => ({
        "Reference": t.reference_no,
        "Category": t.category,
        "Details": t.description || "—",
        "Date": fmtDate(t.transaction_date),
        "Type": t.transaction_type,
        "Amount": t.amount,
        "Status": t.status
      }));

      const ws = XLSX.utils.aoa_to_sheet(meta);
      XLSX.utils.sheet_add_json(ws, rows, { origin: "A6" });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      setLastDownloadedBlob(blob);
      setShowExport(false);
      setNotifModal({
        title: "Export Successful",
        message: `Excel saved as "${filename}"`,
        type: "success",
        actionLabel: "View Downloaded File",
        onAction: () => { window.open(URL.createObjectURL(blob), "_blank"); setNotifModal(null); }
      });
    } catch {
      showToast("Failed to export Excel.", "error");
    }
  };

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      await axios.patch(`${API}/api/transactions/${id}/status`, { 
        status,
        adminId: localStorage.getItem("user_id") 
      });
      setStatusModal(null);
      fetchData();
      showToast(`Transaction marked as ${status}.`, "success");
    } catch (e) {
      setNotifModal({
        title: "Update Failed",
        message: e?.response?.data?.message || "Could not update the transaction status.",
        type: "error",
        actionLabel: null,
        onAction: null
      });
    } finally {
      setUpdating(false);
    }
  };

  const revenue = Number(stats?.total_revenue || 0);
  const expense = Number(stats?.total_expense || 0);
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  return (
    <div className="flex flex-col h-screen w-full bg-[#FBFBFB] font-sans antialiased overflow-hidden text-left">
      <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">

        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Financial Ledger</h1>
            <p className="text-gray-500 text-sm font-bold">Automated tracking of material procurement and sales revenue.</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-black uppercase tracking-widest">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-emerald-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><TrendingUp /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Revenue</p>
              <p className="text-2xl font-black text-emerald-600">{fmt(revenue)}</p>
            </div>
          </div>
          <div className="bg-white border border-red-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl"><TrendingDown /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Expenses</p>
              <p className="text-2xl font-black text-red-600">{fmt(expense)}</p>
            </div>
          </div>
          <div className="bg-white border border-blue-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-5">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><FileText /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Profit</p>
              <p className="text-2xl font-black text-blue-600">{fmt(revenue - expense)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  placeholder="Search reference #..."
                  className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-black w-64 outline-none focus:ring-2 ring-gray-100"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button onClick={() => setShowExport(true)} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-stone-800 active:scale-95 transition-all">
                <Download size={16} /> Export
              </button>
              {lastDownloadedBlob && (
                <button onClick={viewDownloaded} className="flex items-center gap-2 border-2 border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
                  <Eye size={16} /> View Last Export
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <DropdownFilter label="Type" options={TYPE_OPTIONS} selected={filterType} onSelect={setFilterType} dropRef={typeRef} open={typeOpen} setOpen={setTypeOpen} />
              <DropdownFilter label="Year" options={YEARS} selected={filterYear} onSelect={setFilterYear} dropRef={yearRef} open={yearOpen} setOpen={setYearOpen} />
              <DropdownFilter label="Month" options={MONTHS} selected={filterMonth} onSelect={setFilterMonth} dropRef={monthRef} open={monthOpen} setOpen={setMonthOpen} valueKey="value" />
            </div>
          </div>

          <div className="overflow-x-auto text-left">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F9FAFB] text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <th className="px-8 py-5 text-left">Reference No.</th>
                  <th className="px-6 py-5 text-left">Category & Details</th>
                  <th className="px-6 py-5 text-left">Date</th>
                  <th className="px-6 py-5 text-left">Amount</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-gray-600">
                {transactions.length > 0 ? (
                  transactions.map((t) => {
                    const isExpense = t.transaction_type === "Expense";
                    return (
                      <tr key={t.transaction_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5 font-mono text-xs font-black text-gray-900">{t.reference_no}</td>
                        <td className="px-6 py-5">
                          <p className="text-gray-900 uppercase font-black">{t.category}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold truncate max-w-[200px]">{t.description}</p>
                        </td>
                        <td className="px-6 py-5 text-xs font-bold text-gray-500">{fmtDate(t.transaction_date)}</td>
                        <td className={`px-6 py-5 font-black ${isExpense ? "text-red-500" : "text-emerald-600"}`}>
                          {isExpense ? "- " : "+ "}{fmt(t.amount)}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_META[t.status]?.color}`}>
                            {t.status}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {t.status === 'Pending' ? (
                            <button onClick={() => setStatusModal(t)} className="text-[10px] uppercase font-black text-blue-500 hover:text-blue-700 hover:underline">Verify</button>
                          ) : <span className="text-gray-300 font-black">—</span>}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-32 text-center opacity-20">
                      <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-xs font-black uppercase tracking-widest text-gray-500">No Records Found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-8 py-4 border-t border-gray-50 bg-[#FCFCFC]">
              <p className="text-xs text-gray-400 font-black uppercase tracking-widest">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-white hover:border-black disabled:opacity-30 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-white hover:border-black disabled:opacity-30 transition-all"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showExport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-left">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 relative animate-in zoom-in duration-200">
            <button className="absolute top-6 right-8 text-gray-300 hover:text-black transition-all" onClick={() => setShowExport(false)}><XCircle /></button>
            <div className="mb-7 text-center">
              <h3 className="text-xl font-black text-gray-900 mb-1 uppercase tracking-tight">Export Ledger</h3>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Generating for: <span className="text-black font-black underline">{currentUser}</span></p>
            </div>
            <div className="space-y-6 mb-8">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 flex items-center gap-1.5"><Filter className="w-3 h-3" /> Ledger Filters</label>
                <div className="flex gap-2 flex-wrap">
                  <DropdownFilter label="Type" options={TYPE_OPTIONS} selected={exportType} onSelect={(v) => setExportType(v ?? "All")} dropRef={exportTypeRef} open={exportTypeOpen} setOpen={setExportTypeOpen} />
                  <DropdownFilter label="Year" options={YEARS} selected={exportYear} onSelect={(v) => setExportYear(v ?? currentYear)} dropRef={exportYearRef} open={exportYearOpen} setOpen={setExportYearOpen} />
                  <DropdownFilter label="Month" options={MONTHS} selected={exportMonth} onSelect={setExportMonth} dropRef={exportMonthRef} open={exportMonthOpen} setOpen={setExportMonthOpen} valueKey="value" />
                </div>
              </div>
              <div className="p-5 bg-gray-50 rounded-2xl space-y-3 border border-gray-100">
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 tracking-wider"><span>Verified Operator</span> <span className="text-black font-black uppercase">{currentUser}</span></div>
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 tracking-wider"><span>System Time</span> <span className="text-black font-mono">{fmtDateTime(new Date())}</span></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={exportPDF} className="border-2 border-gray-100 rounded-3xl p-6 flex flex-col items-center gap-4 hover:border-black hover:bg-black hover:text-white transition-all group active:scale-95 shadow-sm"><FileText className="w-8 h-8" /><span className="text-xs font-black uppercase tracking-widest">Export PDF</span></button>
              <button onClick={exportExcel} className="border-2 border-gray-100 rounded-3xl p-6 flex flex-col items-center gap-4 hover:border-black hover:bg-black hover:text-white transition-all group active:scale-95 shadow-sm"><FileSpreadsheet className="w-8 h-8" /><span className="text-xs font-black uppercase tracking-widest">Export Excel</span></button>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-left">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 relative animate-in zoom-in duration-200">
            <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Verify Transaction</h3>
            <div className="p-4 bg-gray-50 rounded-2xl mb-6 border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reference Number</p>
              <p className="font-mono text-sm font-black text-gray-900 mb-3">{statusModal.reference_no}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Transaction Value</p>
              <p className={`font-black text-lg ${statusModal.transaction_type === "Expense" ? "text-red-500" : "text-emerald-600"}`}>{fmt(statusModal.amount)}</p>
            </div>
            <div className="space-y-2">
              <button disabled={updating} onClick={() => updateStatus(statusModal.transaction_id, "Completed")} className="w-full py-4 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-emerald-200/50">
                {updating ? "Processing..." : "Verify & Complete"}
              </button>
              <button disabled={updating} onClick={() => updateStatus(statusModal.transaction_id, "Cancelled")} className="w-full py-4 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-60">
                Cancel Transaction
              </button>
              <button onClick={() => setStatusModal(null)} className="w-full py-3 text-gray-400 text-xs font-black uppercase tracking-widest hover:text-black transition-colors">
                Back to Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {notifModal && <NotifModal {...notifModal} onClose={() => setNotifModal(null)} />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}