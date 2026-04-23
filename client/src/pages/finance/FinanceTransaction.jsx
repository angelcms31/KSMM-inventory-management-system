import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, Download, ChevronDown, TrendingUp, TrendingDown,
  CreditCard, CheckCircle, XCircle, FileText, FileSpreadsheet,
  Inbox, RefreshCw, ArrowUpRight, ArrowDownRight, Activity,
  ChevronLeft, ChevronRight
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
                className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${isActive ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50 hover:text-black"
                  }`}
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

const PAGE_LIMIT = 10;
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

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

  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const typeRef = useRef(null);

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
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      await axios.patch(`${API}/api/transactions/${id}/status`, { status });
      setStatusModal(null);
      fetchData();
    } catch (e) {
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Finance Transactions Ledger", 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [["Ref #", "Category", "Date", "Type", "Amount", "Status"]],
      body: transactions.map(t => [
        t.reference_no, t.category, fmtDate(t.transaction_date),
        t.transaction_type, fmt(t.amount), t.status
      ]),
      headStyles: { fillColor: [0, 0, 0] }
    });
    doc.save("ledger.pdf");
    setShowExport(false);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
      "Reference": t.reference_no,
      "Category": t.category,
      "Date": fmtDate(t.transaction_date),
      "Type": t.transaction_type,
      "Amount": t.amount,
      "Status": t.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "ledger.xlsx");
    setShowExport(false);
  };

  const totalPages = Math.ceil(total / PAGE_LIMIT);
  const revenue = Number(stats?.total_revenue || 0);
  const expense = Number(stats?.total_expense || 0);

  return (
    <div className="flex flex-col h-screen w-full bg-[#FBFBFB] font-sans antialiased overflow-hidden">
      <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">

        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financial Ledger</h1>
            <p className="text-gray-500 text-sm">Automated tracking of material procurement and sales revenue.</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black">
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
                  className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold w-64 outline-none focus:ring-2 ring-gray-100"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button onClick={() => setShowExport(true)} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
                <Download size={16} /> Export
              </button>
            </div>

            <div className="flex gap-2">
              <DropdownFilter label="Type" options={TYPE_OPTIONS} selected={filterType} onSelect={setFilterType} dropRef={typeRef} open={typeOpen} setOpen={setTypeOpen} />
              <DropdownFilter label="Year" options={YEARS} selected={filterYear} onSelect={setFilterYear} dropRef={yearRef} open={yearOpen} setOpen={setYearOpen} />
              <DropdownFilter label="Month" options={MONTHS} selected={filterMonth} onSelect={setFilterMonth} dropRef={monthRef} open={monthOpen} setOpen={setMonthOpen} valueKey="value" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F9FAFB] text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Reference No.</th>
                  <th className="px-6 py-5">Category & Details</th>
                  <th className="px-6 py-5">Date</th>
                  <th className="px-6 py-5">Amount</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-gray-600">
                {transactions.length > 0 ? (
                  transactions.map((t) => {
                    const tm = TYPE_META[t.transaction_type] || TYPE_META.Adjustment;
                    return (
                      <tr key={t.transaction_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5 font-mono text-xs">{t.reference_no}</td>
                        <td className="px-6 py-5">
                          <p className="text-gray-900">{t.category}</p>
                          <p className="text-[10px] text-gray-400 uppercase">{t.description}</p>
                        </td>
                        <td className="px-6 py-5 text-xs">{fmtDate(t.transaction_date)}</td>
                        <td className={`px-6 py-5 ${t.transaction_type === 'Revenue' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {t.transaction_type === 'Revenue' ? '+' : '-'} {fmt(t.amount)}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_META[t.status]?.color}`}>
                            {t.status}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {t.status === 'Pending' ? (
                            <button onClick={() => setStatusModal(t)} className="text-[10px] uppercase font-black text-blue-500 hover:underline">Verify</button>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-32 text-center opacity-20">
                      <Inbox className="w-12 h-12 mx-auto mb-3" />
                      <p className="text-xs font-black uppercase tracking-widest">No Records Found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showExport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 relative animate-in zoom-in duration-200">
            <button className="absolute top-6 right-8 text-gray-300 hover:text-black" onClick={() => setShowExport(false)}><XCircle /></button>
            <div className="text-center mb-8">
              <h3 className="text-xl font-black text-gray-900 mb-1">Export Ledger</h3>
              <p className="text-gray-400 text-sm">Download financial records for auditing.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={exportPDF} className="border-2 border-gray-100 rounded-3xl p-6 flex flex-col items-center gap-4 hover:bg-black hover:text-white transition-all">
                <FileText className="w-8 h-8" /> <span className="text-xs font-black uppercase">PDF</span>
              </button>
              <button onClick={exportExcel} className="border-2 border-gray-100 rounded-3xl p-6 flex flex-col items-center gap-4 hover:bg-black hover:text-white transition-all">
                <FileSpreadsheet className="w-8 h-8" /> <span className="text-xs font-black uppercase">Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 relative animate-in zoom-in duration-200">
            <h3 className="text-lg font-black text-gray-900 mb-6">Verify Transaction</h3>
            <div className="space-y-2">
              <button disabled={updating} onClick={() => updateStatus(statusModal.transaction_id, "Completed")} className="w-full py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold">Mark as Completed</button>
              <button disabled={updating} onClick={() => updateStatus(statusModal.transaction_id, "Cancelled")} className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold">Cancel Transaction</button>
              <button onClick={() => setStatusModal(null)} className="w-full py-3 text-gray-400 text-sm font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}