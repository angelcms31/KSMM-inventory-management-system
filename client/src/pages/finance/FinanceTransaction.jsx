import React, { useState, useRef, useEffect } from "react";
import {
  Search, Download, ChevronDown,
  CreditCard, Package, Truck, CheckCircle, XCircle,
  FileText, FileSpreadsheet, Inbox
} from "lucide-react";

const FinanceTransactions = () => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedYears, setSelectedYears] = useState([new Date().getFullYear()]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const dayRef = useRef(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 0, label: "January" }, { value: 1, label: "February" },
    { value: 2, label: "March" }, { value: 3, label: "April" },
    { value: 4, label: "May" }, { value: 5, label: "June" },
    { value: 6, label: "July" }, { value: 7, label: "August" },
    { value: 8, label: "September" }, { value: 9, label: "October" },
    { value: 10, label: "November" }, { value: 11, label: "December" }
  ];

  const stats = [
    { title: "Waiting Payment", count: "0", trend: "0%", color: "text-gray-400", icon: <CreditCard className="w-5 h-5" /> },
    { title: "On Process", count: "0", trend: "0%", color: "text-gray-400", icon: <Package className="w-5 h-5" /> },
    { title: "On Delivery", count: "0", trend: "0%", color: "text-gray-400", icon: <Truck className="w-5 h-5" /> },
    { title: "Completed", count: "0", trend: "0%", color: "text-gray-400", icon: <CheckCircle className="w-5 h-5" /> },
    { title: "Canceled", count: "0", trend: "0%", color: "text-gray-400", icon: <XCircle className="w-5 h-5" /> },
  ];

  const transactions = []; 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) setIsYearOpen(false);
      if (monthRef.current && !monthRef.current.contains(event.target)) setIsMonthOpen(false);
      if (dayRef.current && !dayRef.current.contains(event.target)) setIsDayOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-[#FBFBFB] font-sans antialiased overflow-hidden">
      <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Transactions</h1>
            <p className="text-gray-500 text-sm">Monitor and manage all incoming and outgoing payments.</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 border border-gray-50">{stat.icon}</div>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Global</span>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-gray-900">{stat.count}</h3>
                  <span className={`text-[10px] font-bold ${stat.color}`}>{stat.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 bg-[#FCFCFC]">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 pb-8 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Transaction Overview</h2>
                <p className="text-gray-400 text-sm font-medium">Detailed list of all user payments and orders.</p>
              </div>
              <div className="flex gap-10">
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Pending</p>
                  <p className="text-2xl font-black text-red-500 tracking-tighter">$0.00</p>
                </div>
                <div className="text-right border-l border-gray-100 pl-10">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Received</p>
                  <p className="text-2xl font-black text-green-500 tracking-tighter">$0.00</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-100 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setShowDownloadModal(true)}
                  className="bg-black text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                {[ 
                  { ref: yearRef, label: 'Year', open: isYearOpen, set: setIsYearOpen, data: years },
                  { ref: monthRef, label: 'Month', open: isMonthOpen, set: setIsMonthOpen, data: months.map(m => m.label) }
                ].map((filter, fIdx) => (
                  <div key={fIdx} ref={filter.ref} className="relative">
                    <button
                      onClick={() => filter.set(!filter.open)}
                      className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-3 hover:bg-gray-50 transition-all"
                    >
                      {filter.label} <ChevronDown className={`w-3 h-3 transition-transform ${filter.open ? 'rotate-180' : ''}`} />
                    </button>
                    {filter.open && (
                      <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in duration-200">
                        {filter.data.map((item, i) => (
                          <div key={i} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-black rounded-lg cursor-pointer transition-colors">
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
                  <th className="px-8 py-5">Product Details</th>
                  <th className="px-6 py-5">Category</th>
                  <th className="px-6 py-5">Date Ordered</th>
                  <th className="px-6 py-5">Price</th>
                  <th className="px-6 py-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((t, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-[#FBFBFB] transition-colors">
                      {/* Tr would go here */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 opacity-20">
                        <Inbox className="w-12 h-12 text-gray-400" />
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">No Transaction Records Yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Download */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDownloadModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 relative animate-in zoom-in duration-300">
            <button className="absolute top-6 right-8 text-gray-300 hover:text-black transition-colors" onClick={() => setShowDownloadModal(false)}>
              <XCircle className="w-6 h-6" />
            </button>
            <div className="text-center mb-10">
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Export Data</h3>
              <p className="text-gray-400 text-sm">Choose your preferred format for the report.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="group border-2 border-gray-50 rounded-3xl p-6 flex flex-col items-center gap-4 hover:border-black hover:bg-black transition-all duration-300">
                <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-white/10 transition-colors">
                  <FileText className="w-8 h-8 text-black group-hover:text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest group-hover:text-white">PDF Document</span>
              </button>
              <button className="group border-2 border-gray-100 rounded-3xl p-6 flex flex-col items-center gap-4 hover:border-black hover:bg-black transition-all duration-300">
                <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-white/10 transition-colors">
                  <FileSpreadsheet className="w-8 h-8 text-black group-hover:text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest group-hover:text-white">Excel Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceTransactions;