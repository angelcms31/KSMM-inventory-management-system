import React, { 
  useState, 
  useEffect, 
  useCallback 
} from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  Package,
  Truck,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  TrendingUp,
} from "lucide-react";
import { HiPhoto } from "react-icons/hi2";
import {
  HiCheckCircle, 
  HiXCircle, 
  HiOutlineEye, 
  HiOutlineDownload, 
  HiX,
} from "react-icons/hi";
import { FaRegFilePdf, FaRegFileExcel } from "react-icons/fa";

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Tooltip, 
  Legend, 
  Filler
);

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const DAYS_IN_MONTH = (year, month) => new Date(year, month + 1, 0).getDate();

const COURIERS_ICON = {
  "J&T Express": "🟥",
  "Ninja Van": "🟪",
  "LBC": "🟦",
  "GoGo Xpress": "🟩",
  "Grab Express": "🟨",
  "Lalamove": "🟧",
  "Self Pick-up": "⬜",
};

const formatPeso = (v) => {
  if (v === 0) return "₱0";
  if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₱${(v / 1_000).toFixed(1)}K`;
  return `₱${v.toFixed(0)}`;
};

const getStatusStyle = (status) => {
  switch (status) {
    case "Delivered": return "bg-emerald-500";
    case "Shipped": return "bg-blue-600";
    case "Pending": return "bg-amber-500";
    default: return "bg-slate-400";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "Delivered": return "#10b981";
    case "Shipped": return "#2563eb";
    case "Pending": return "#f59e0b";
    default: return "#94a3b8";
  }
};

const TRACKING_STEPS = [
  { key: "Delivered", label: "Order Delivered", sub: "Package successfully delivered to recipient" },
  { key: "Shipped", label: "Out for Delivery", sub: "Package is on the way to destination" },
  { key: "Pending", label: "Order Placed", sub: "An order has been placed" },
];

const AlertDialog = ({ alert, onClose }) => {
  if (!alert) return null;
  const isSuccess = alert.type === 'success';
  
  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.25)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 flex flex-col items-center text-center relative overflow-hidden animate-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center mb-6 ${isSuccess ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          {isSuccess ? (
            <HiCheckCircle size={44} className="text-emerald-500" />
          ) : (
            <HiXCircle size={44} className="text-rose-500" />
          )}
        </div>
        
        <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isSuccess ? 'Success' : 'Error'}
        </p>
        
        <p className="text-slate-800 font-black text-lg leading-snug tracking-tight mb-8">
          {alert.message}
        </p>
        
        <div className="flex flex-col gap-2 w-full">
          {isSuccess && alert.fileUrl && !alert.isExcel && (
            <button
              onClick={() => { window.open(alert.fileUrl, '_blank'); onClose(); }}
              className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all bg-black hover:bg-stone-800 shadow-xl"
            >
              View Document
            </button>
          )}
          <button
            onClick={onClose}
            className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]
              ${isSuccess ? 'text-emerald-600 bg-emerald-50' : 'bg-rose-500 text-white shadow-lg shadow-rose-200'}`}
          >
            Close
          </button>
        </div>
        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-[0.06] ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      </div>
    </div>
  );
};

const OrderDetailModal = ({ order, onClose, products = [] }) => {
  if (!order) return null;
  const statusIndex = TRACKING_STEPS.findIndex(s => s.key === order.status);
  const activeStep = statusIndex === -1 ? 2 : statusIndex;
  const toAddress = order.address || order.delivery_address || order.client_address || null;
  const matchedProduct = products.find(p => p.sku === order.sku || p.name === order.product_name);
  const fromAddress = matchedProduct?.warehouse_location || order.warehouse_location || null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(14px)", backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[1.75rem] shadow-2xl w-full max-w-sm relative overflow-hidden"
        style={{ animation: "popIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-black text-gray-900 leading-tight">Real-time Delivery Tracking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors mt-0.5"><X size={18} /></button>
        </div>

        <div className="px-6 pb-4">
          <div className="flex items-start justify-between gap-4 py-4 border-t border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-xs font-semibold mb-1">From</p>
              <p className="text-sm font-bold text-gray-700 leading-snug truncate">{fromAddress || "Warehouse / Origin"}</p>
            </div>
            <div className="flex items-center gap-1 pt-3 flex-shrink-0 px-1">
              {[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-px bg-gray-300" />)}
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-gray-400 text-xs font-semibold mb-1">To</p>
              <p className="text-sm font-bold text-gray-700 leading-snug truncate">{toAddress || order.client_name || "Customer"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 px-3 bg-gray-50 rounded-2xl mt-3 border border-gray-100">
            <div className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
              {COURIERS_ICON[order.courier] || "📦"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-900">{order.courier || "Courier"}</p>
              <p className="text-[10px] text-gray-400 font-semibold">SO-{order.order_id} · {order.platform || "—"}</p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <span className={`text-[9px] px-2.5 py-1 rounded-full text-white font-black uppercase tracking-wide ${getStatusStyle(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-0">
            {TRACKING_STEPS.map((step, i) => {
              const isActive = i <= activeStep;
              const isLast = i === TRACKING_STEPS.length - 1;
              const dotColor = isActive ? getStatusColor(order.status) : "#d1d5db";
              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ borderColor: dotColor, backgroundColor: isActive ? dotColor : "white" }}
                    >
                      {isActive && i === activeStep && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    {!isLast && (
                      <div className="w-0.5 flex-1 mt-1 mb-1 min-h-[28px]"
                        style={{ backgroundColor: i < activeStep ? dotColor : "#e5e7eb" }} />
                    )}
                  </div>
                  <div className="pb-4 min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-bold leading-tight ${isActive ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{step.sub}</p>
                      </div>
                      {isActive && (
                        <p className="text-[10px] text-gray-400 font-semibold whitespace-nowrap flex-shrink-0">
                          {order.order_date ? new Date(order.order_date).toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-4 mt-1 grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-widest text-[9px]">Product</p>
              <p className="font-bold text-gray-800 mt-0.5 truncate">{order.product_name || order.sku || "—"}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-widest text-[9px]">Quantity</p>
              <p className="font-bold text-gray-800 mt-0.5">{order.quantity ? `${order.quantity} pcs` : "—"}</p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-widest text-[9px]">Total Amount</p>
              <p className="font-black text-gray-900 mt-0.5">
                {order.total_amount ? `₱${Number(order.total_amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-widest text-[9px]">Client</p>
              <p className="font-bold text-gray-800 mt-0.5 truncate">{order.client_name || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SalesTrendModal = ({ orders, onClose }) => {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const availableYears = [currentYear, lastYear, lastYear - 1];

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportedByName, setExportedByName] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [alert, setAlert] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);

  const [exportFilterYear, setExportFilterYear] = useState("");
  const [exportFilterMonth, setExportFilterMonth] = useState("");
  const [exportFilterDay, setExportFilterDay] = useState("");
  const [exportFilterCourier, setExportFilterCourier] = useState("");
  const [exportFilterPlatform, setExportFilterPlatform] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const showAlert = (message, type = 'success', fileUrl = null, isExcel = false) => setAlert({ message, type, fileUrl, isExcel });
  const closeAlert = () => setAlert(null);

  const exportTimestamp = new Date().toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const fetchExporterInfo = useCallback(async () => {
    const fName = localStorage.getItem("firstName");
    const lName = localStorage.getItem("lastName");
    const sId = localStorage.getItem("user_id");
    if (fName && lName && fName !== "null" && lName !== "null") {
      setExportedByName(`${fName} ${lName}`);
    } else if (sId) {
      try {
        const res = await axios.get(`http://localhost:5000/api/user/name/${sId}`);
        if (res.data?.name) setExportedByName(res.data.name);
      } catch {
        setExportedByName("Unknown User");
      }
    }
    if (sId) setCurrentUserId(sId);
  }, []);

  useEffect(() => { fetchExporterInfo(); }, [fetchExporterInfo]);

  const daysInSelected = (selectedYear && selectedMonth !== "")
    ? new Date(Number(selectedYear), Number(selectedMonth) + 1, 0).getDate()
    : 31;

  const exportDaysInSelected = exportFilterYear && exportFilterMonth !== ""
    ? new Date(Number(exportFilterYear), Number(exportFilterMonth) + 1, 0).getDate()
    : 31;

  const allCouriers = [...new Set(orders.map(o => o.courier).filter(Boolean))];
  const allPlatforms = [...new Set(orders.map(o => o.platform).filter(Boolean))];

  const getChartData = () => {
    const yr = selectedYear ? Number(selectedYear) : currentYear;
    const mo = selectedMonth !== "" ? Number(selectedMonth) : -1;

    if (selectedYear && selectedMonth !== "") {
      const dInM = DAYS_IN_MONTH(yr, mo);
      const arr = Array(dInM).fill(0);
      orders.filter(o => o.status === "Delivered" && new Date(o.order_date).getFullYear() === yr && new Date(o.order_date).getMonth() === mo).forEach(o => {
        arr[new Date(o.order_date).getDate() - 1] += Number(o.total_amount || 0);
      });
      const lastArr = Array(dInM).fill(0);
      orders.filter(o => o.status === "Delivered" && new Date(o.order_date).getFullYear() === (yr - 1) && new Date(o.order_date).getMonth() === mo).forEach(o => {
        const d = new Date(o.order_date).getDate();
        if (d <= dInM) lastArr[d - 1] += Number(o.total_amount || 0);
      });
      return { labels: Array.from({ length: dInM }, (_, i) => `${i + 1}`), thisData: arr, lastData: lastArr };
    }
    const buildM = (y) => {
      const arr = Array(12).fill(0);
      orders.filter(o => o.status === "Delivered" && new Date(o.order_date).getFullYear() === y).forEach(o => {
        arr[new Date(o.order_date).getMonth()] += Number(o.total_amount || 0);
      });
      return arr;
    };
    return { labels: MONTHS, thisData: buildM(yr), lastData: buildM(yr - 1) };
  };

  const { labels, thisData, lastData } = getChartData();
  
  const isSingleDay = selectedYear && selectedMonth !== "" && selectedDay !== "";

  const singleDayOrders = isSingleDay ? orders.filter(o => {
    const d = new Date(o.order_date);
    return d.getFullYear() === Number(selectedYear) && 
           d.getMonth() === Number(selectedMonth) && 
           d.getDate() === Number(selectedDay);
  }) : [];

  const singleDayDelivered = singleDayOrders.filter(o => o.status === "Delivered");

  const singleDayRevenue = singleDayDelivered.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  
  const singleDayLYRev = isSingleDay ? orders.filter(o => {
    const d = new Date(o.order_date);
    return d.getFullYear() === (Number(selectedYear) - 1) && 
           d.getMonth() === Number(selectedMonth) && 
           d.getDate() === Number(selectedDay) && 
           o.status === "Delivered";
  }).reduce((s, o) => s + Number(o.total_amount || 0), 0) : 0;

  const getExportRows = useCallback(() => {
    let filtered = orders.filter(o => o.status === "Delivered" && o.order_date);
    if (exportFilterYear) filtered = filtered.filter(o => new Date(o.order_date).getFullYear() === Number(exportFilterYear));
    if (exportFilterMonth !== "") filtered = filtered.filter(o => new Date(o.order_date).getMonth() === Number(exportFilterMonth));
    if (exportFilterDay !== "") filtered = filtered.filter(o => new Date(o.order_date).getDate() === Number(exportFilterDay));
    if (exportFilterCourier) filtered = filtered.filter(o => o.courier === exportFilterCourier);
    if (exportFilterPlatform) filtered = filtered.filter(o => o.platform === exportFilterPlatform);
    filtered.sort((a, b) => sortOrder === "asc" ? new Date(a.order_date) - new Date(b.order_date) : new Date(b.order_date) - new Date(a.order_date));
    return filtered.map(o => ({
      "Order ID": `SO-${o.order_id}`,
      Date: o.order_date ? new Date(o.order_date).toLocaleDateString("en-PH") : "N/A",
      Client: o.client_name || "N/A",
      Product: o.product_name || o.sku || "N/A",
      Quantity: o.quantity || 0,
      Courier: o.courier || "N/A",
      Platform: o.platform || "N/A",
      "Total Amount (₱)": Number(o.total_amount || 0).toFixed(2),
    }));
  }, [orders, exportFilterYear, exportFilterMonth, exportFilterDay, exportFilterCourier, exportFilterPlatform, sortOrder]);

  useEffect(() => {
    if (previewOpen || sortModalOpen) {
      setPreviewRows(getExportRows());
    }
  }, [previewOpen, sortModalOpen, getExportRows]);

  const thisTotal = isSingleDay ? singleDayRevenue : thisData.reduce((a, b) => a + b, 0);
  const lastTotal = isSingleDay ? singleDayLYRev : lastData.reduce((a, b) => a + b, 0);
  const pctChange = lastTotal > 0 ? (((thisTotal - lastTotal) / lastTotal) * 100).toFixed(1) : null;

  const chartData = {
    labels,
    datasets: [
      { label: "Running Year", data: thisData, borderColor: "#2563eb", backgroundColor: "transparent", tension: 0.4, pointRadius: 0, pointHoverRadius: 0, borderWidth: 2.5, fill: false },
      { label: "Last Year", data: lastData, borderColor: "#22c55e", backgroundColor: "transparent", tension: 0.4, pointRadius: 0, pointHoverRadius: 0, borderWidth: 2.5, fill: false },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: true, position: "top", align: "end", labels: { boxWidth: 32, boxHeight: 10, borderRadius: 4, useBorderRadius: true, font: { size: 11, weight: "bold" }, color: "#64748b", padding: 16 } },
      tooltip: { enabled: true, backgroundColor: "#0f172a", titleColor: "#94a3b8", bodyColor: "#f1f5f9", padding: 12, cornerRadius: 10, titleFont: { size: 10, weight: "bold" }, bodyFont: { size: 12, weight: "bold" }, displayColors: true, callbacks: { label: (item) => ` ₱${Number(item.raw).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` } },
    },
    scales: {
      y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { callback: (v) => formatPeso(v), font: { size: 10 }, color: "#94a3b8" }, border: { display: false } },
      x: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 10 }, color: "#94a3b8" }, border: { display: false } },
    },
  };

  const exportToExcel = async () => {
    const rows = getExportRows();
    if (rows.length === 0) { showAlert("No records matched the selected filters.", "error"); return; }
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const metaRows = [
        { "Order ID": "Report:", Date: "Sales & Profit Trend" },
        { "Order ID": "Exported By:", Date: `${exportedByName} (ID: ${currentUserId || 'N/A'})` },
        { "Order ID": "Timestamp:", Date: exportTimestamp },
        {}
      ];
      const ws = XLSX.utils.json_to_sheet([...metaRows, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, "Sales Trend");
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Sales_Trend_${new Date().getTime()}.xlsx`;
      a.click();
      showAlert("Excel report generated successfully!", "success", null, true);
    } catch { showAlert("Failed to export Excel.", "error"); }
  };

  const exportToPDF = async () => {
    const rows = getExportRows();
    if (rows.length === 0) { showAlert("No records matched the selected filters.", "error"); return; }
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16).setFont(undefined, 'bold').text("Sales & Profit Trend Report", 14, 15);
      doc.setFontSize(9).setFont(undefined, 'normal').setTextColor(100);
      doc.text(`Exported By: ${exportedByName} (ID: ${currentUserId || 'N/A'})`, 14, 22);
      doc.text(`Generated On: ${exportTimestamp}`, 14, 27);
      doc.setTextColor(0);
      const total = rows.reduce((s, r) => s + Number(r["Total Amount (₱)"] || 0), 0);
      const headers = Object.keys(rows[0]);
      const body = rows.map(r => headers.map(h => r[h]));
      autoTable(doc, {
        head: [headers],
        body,
        foot: [["", "", "", "", "", "", "Total", `₱${total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`]],
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        footStyles: { fillColor: [240, 245, 255], textColor: [30, 64, 175], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        theme: 'grid',
        startY: 35,
      });
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sales_Trend_${new Date().getTime()}.pdf`;
      a.click();
      showAlert("PDF report generated successfully!", "success", url);
    } catch { showAlert("Failed to export PDF.", "error"); }
  };

  const selectClass = "appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all pr-8";
  
  const Chevron = () => (
    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 text-left"
      style={{ backdropFilter: "blur(14px)", backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={onClose}
    >
      <AlertDialog alert={alert} onClose={closeAlert} />

      <div
        className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-2xl relative overflow-hidden max-h-[95vh] flex flex-col text-left"
        style={{ animation: "popIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">Sales & Profit Trend</h2>
              <p className="text-xs text-gray-400 mt-0.5 uppercase font-bold tracking-widest">Monthly sales revenue and profit margins</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortModalOpen(true)}
                className="bg-black text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-stone-800 transition-all tracking-widest flex items-center gap-2"
              >
                <HiOutlineDownload size={13} /> Export Data
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1"><X size={20} /></button>
            </div>
          </div>
        </div>

        <div className="px-6 pt-4 pb-1 flex-shrink-0">
          <div className="flex items-center justify-between mb-3 text-left">
            <span className="text-sm font-bold text-gray-800">
              {isSingleDay ? `${MONTHS[Number(selectedMonth)]} ${selectedDay}, ${selectedYear}` : "Overall Sales"}
            </span>
            {pctChange !== null && (
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} className={Number(pctChange) >= 0 ? "text-emerald-500" : "text-rose-500"} />
                <span className={`text-xs font-black ${Number(pctChange) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{pctChange}%</span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase">vs last year</span>
              </div>
            )}
          </div>

          <div className="h-[200px]">
            {isSingleDay ? (
              <div className="grid grid-cols-3 gap-3 h-full items-center text-left uppercase">
                <div className="bg-blue-50 rounded-2xl p-4 flex flex-col justify-center h-full">
                  <p className="text-[9px] font-black text-blue-400 tracking-widest mb-1">Revenue</p>
                  <p className="text-xl font-black text-blue-700 leading-tight">{formatPeso(singleDayRevenue)}</p>
                  <p className="text-[9px] text-blue-400 mt-1">{singleDayDelivered.length} delivered</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col justify-center h-full">
                  <p className="text-[9px] font-black text-gray-400 tracking-widest mb-1">Total Orders</p>
                  <p className="text-xl font-black text-gray-800 leading-tight">{singleDayOrders.length}</p>
                  <p className="text-[9px] text-gray-400 mt-1">{singleDayOrders.filter(o => o.status === "Shipped").length} in transit</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col justify-center h-full">
                  <p className="text-[9px] font-black text-gray-400 tracking-widest mb-1">Last Year</p>
                  <p className="text-xl font-black text-gray-800 leading-tight">{formatPeso(singleDayLYRev)}</p>
                  <p className="text-[9px] text-gray-400 mt-1">{selectedYear - 1} comparison</p>
                </div>
              </div>
            ) : (
              <div className="h-full relative">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-gray-100 mt-2 flex-shrink-0 text-left">
          <p className="text-base font-black text-gray-900 mb-3">Select Timeline</p>
          <div className="flex gap-3">
            {[
              { 
                value: selectedYear, 
                onChange: e => { setSelectedYear(e.target.value); setSelectedMonth(""); setSelectedDay(""); }, 
                disabled: false, 
                placeholder: "Year", 
                options: availableYears.map(y => ({ value: y, label: y })) 
              },
              { 
                value: selectedMonth, 
                onChange: e => { setSelectedMonth(e.target.value); setSelectedDay(""); }, 
                disabled: !selectedYear, 
                placeholder: "Month", 
                options: MONTHS.map((m, i) => ({ value: i, label: m })) 
              },
              { 
                value: selectedDay, 
                onChange: e => setSelectedDay(e.target.value), 
                disabled: !selectedYear || selectedMonth === "", 
                placeholder: "Day", 
                options: Array.from({ length: daysInSelected }, (_, i) => ({ value: i + 1, label: i + 1 })) 
              },
            ].map((sel, idx) => (
              <div key={idx} className="relative flex-1">
                <select 
                  value={sel.value} 
                  onChange={sel.onChange} 
                  disabled={sel.disabled} 
                  className={selectClass + " w-full disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-widest"}
                >
                  <option value="">{sel.placeholder}</option>
                  {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <Chevron />
              </div>
            ))}
          </div>
        </div>
      </div>

      {sortModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[300] p-4 text-left">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-xl relative shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button className="absolute top-8 right-8 text-slate-300 hover:text-black transition-all" onClick={() => setSortModalOpen(false)}><HiX size={24} /></button>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase mb-4 tracking-tighter">Export Configuration</h2>

            <div className="mb-6 p-5 bg-gray-50 rounded-2xl border border-gray-100 uppercase">
              <p className="text-[10px] tracking-[0.2em] text-gray-400 font-black mb-1">Operator Signature</p>
              <p className="text-sm font-black text-gray-800">{exportedByName} (ID: {currentUserId || 'N/A'})</p>
              <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase">{exportTimestamp}</p>
            </div>

            <div className="space-y-4 mb-6 uppercase font-black">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <select value={exportFilterYear} onChange={e => { setExportFilterYear(e.target.value); setExportFilterMonth(""); setExportFilterDay(""); }} className={selectClass + " w-full text-xs"}>
                    <option value="">All Years</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <Chevron />
                </div>
                <div className="relative">
                  <select value={exportFilterMonth} onChange={e => { setExportFilterMonth(e.target.value); setExportFilterDay(""); }} disabled={!exportFilterYear} className={selectClass + " w-full text-xs"}>
                    <option value="">All Months</option>
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <Chevron />
                </div>
                <div className="relative col-span-2">
                  <select value={exportFilterDay} onChange={e => setExportFilterDay(e.target.value)} disabled={!exportFilterYear || exportFilterMonth === ""} className={selectClass + " w-full text-xs"}>
                    <option value="">Select Specific Day (Optional)</option>
                    {Array.from({ length: exportDaysInSelected }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Chevron />
                </div>
                <div className="relative">
                  <select value={exportFilterCourier} onChange={e => setExportFilterCourier(e.target.value)} className={selectClass + " w-full text-xs"}>
                    <option value="">All Couriers</option>
                    {allCouriers.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Chevron />
                </div>
                <div className="relative">
                  <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className={selectClass + " w-full text-xs"}>
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                  <Chevron />
                </div>
              </div>
            </div>

            <button
              className="w-full py-4 rounded-xl bg-black text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-stone-800 transition-all active:scale-95 mb-4 shadow-xl shadow-stone-200"
              onClick={() => setPreviewOpen(true)}
            >
              <HiOutlineEye size={16} /> Preview Data Stream
            </button>

            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-gray-100 rounded-2xl p-4 flex flex-col items-center cursor-pointer hover:border-black transition-all group font-black uppercase text-left" onClick={exportToPDF}>
                <FaRegFilePdf size={28} className="text-gray-300 group-hover:text-red-500 mb-2" />
                <p className="text-[10px] text-gray-400 group-hover:text-black tracking-widest">Generate PDF</p>
              </div>
              <div className="border-2 border-gray-100 rounded-2xl p-4 flex flex-col items-center cursor-pointer hover:border-black transition-all group font-black uppercase text-left" onClick={exportToExcel}>
                <FaRegFileExcel size={28} className="text-gray-300 group-hover:text-emerald-500 mb-2" />
                <p className="text-[10px] text-gray-400 group-hover:text-black tracking-widest">Excel Sheet</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[400] p-4 text-left uppercase">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-4xl relative shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <button className="absolute top-8 right-8 text-slate-300 hover:text-black transition-all" onClick={() => setPreviewOpen(false)}><HiX size={24} /></button>
            <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tighter leading-none">Document Preview</h2>
            <div className="mb-6 grid grid-cols-3 gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 uppercase font-black text-slate-800">
              <div className="flex flex-col"><span className="text-[9px] text-gray-400 tracking-widest block mb-1">Operator</span><span className="text-xs">{exportedByName}</span></div>
              <div className="flex flex-col"><span className="text-[9px] text-gray-400 tracking-widest block mb-1">Timestamp</span><span className="text-xs">{exportTimestamp}</span></div>
              <div className="flex flex-col"><span className="text-[9px] text-gray-400 tracking-widest block mb-1">Volume</span><span className="text-xs text-emerald-600">{previewRows.length} RECORDS</span></div>
            </div>
            <div className="overflow-auto flex-1 rounded-2xl border border-gray-100 shadow-inner">
              <table className="w-full text-left min-w-[700px] uppercase">
                <thead className="sticky top-0 bg-black text-white text-[9px] font-black uppercase tracking-[0.2em]">
                  <tr>{["Order ID", "Date", "Client", "Product", "Quantity", "Courier", "Total"].map(h => <th key={h} className="px-5 py-4">{h}</th>)}</tr>
                </thead>
                <tbody className="bg-white text-[10px] font-bold text-gray-700">
                  {previewRows.length > 0 ? (
                    previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-4 font-black">{row["Order ID"]}</td>
                        <td className="px-5 py-4">{row.Date}</td>
                        <td className="px-5 py-4 truncate max-w-[120px]">{row.Client}</td>
                        <td className="px-5 py-4 truncate max-w-[150px]">{row.Product}</td>
                        <td className="px-5 py-4">{row.Quantity}</td>
                        <td className="px-5 py-4">{row.Courier}</td>
                        <td className="px-5 py-4 font-black text-gray-900">₱{row["Total Amount (₱)"]}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="7" className="px-5 py-10 text-center text-gray-400">No data available for the selected filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 mt-6">
              <button className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-black/10" onClick={exportToPDF}>
                <FaRegFilePdf size={18} /> Download PDF
              </button>
              <button className="flex-1 bg-white border-2 border-black text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all" onClick={exportToExcel}>
                <FaRegFileExcel size={18} /> Download Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MainDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [deliveryPage, setDeliveryPage] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTrendModal, setShowTrendModal] = useState(false);
  const deliveryPerPage = 4;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/sales_orders"),
          axios.get("http://localhost:5000/api/finished_goods"),
        ]);
        setOrders(ordersRes.data || []);
        setProducts(productsRes.data || []);
      } catch (err) {
        console.error("API Error:", err);
      }
    };
    fetchAll();
  }, []);

  const totalRevenue = orders
    .filter(o => o.status === "Delivered")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    
  const totalOrders = orders.length;
  
  const lowStockProducts = products.filter(
    p => Number(p.current_stock) <= Number(p.min_stocks)
  );
  
  const inTransitOrders = orders.filter(o => o.status === "Shipped");
  
  const totalDeliveryPages = Math.ceil(inTransitOrders.length / deliveryPerPage);
  
  const currentDeliveryOrders = inTransitOrders.slice(
    deliveryPage * deliveryPerPage, 
    (deliveryPage + 1) * deliveryPerPage
  );

  const topProducts = [...products]
    .map(p => ({
      ...p,
      sold: orders.filter(o => o.status === "Delivered" && (o.product_name === p.name || o.sku === p.sku)).reduce((sum, o) => sum + Number(o.quantity || 0), 0),
      revenue: orders.filter(o => o.status === "Delivered" && (o.product_name === p.name || o.sku === p.sku)).reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    }))
    .filter(p => p.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const currentYear = new Date().getFullYear();
  const monthlySales = Array(12).fill(0);
  orders
    .filter(o => o.status === "Delivered" && o.order_date && new Date(o.order_date).getFullYear() === currentYear)
    .forEach(o => { monthlySales[new Date(o.order_date).getMonth()] += Number(o.total_amount || 0); });

  const salesData = {
    labels: MONTHS,
    datasets: [{ 
      label: "Revenue (₱)", 
      data: monthlySales, 
      borderColor: "#1d4ed8", 
      backgroundColor: "rgba(29,78,216,0.07)", 
      tension: 0.4, 
      pointRadius: 0, 
      pointHoverRadius: 0, 
      fill: true, 
      borderWidth: 2 
    }],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { 
        enabled: true, 
        backgroundColor: "#0f172a", 
        titleColor: "#94a3b8", 
        bodyColor: "#f1f5f9", 
        padding: 12, 
        cornerRadius: 12, 
        titleFont: { size: 10, weight: "bold" }, 
        bodyFont: { size: 13, weight: "bold" }, 
        displayColors: false, 
        callbacks: { 
          title: (items) => items[0]?.label || "", 
          label: (item) => `₱${Number(item.raw).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` 
        } 
      },
    },
    scales: {
      y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { callback: (v) => formatPeso(v), font: { size: 10 }, color: "#94a3b8" }, border: { display: false } },
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: "#94a3b8" }, border: { display: false } },
    },
  };

  const stats = [
    { label: "Total Products", value: products.length.toLocaleString(), sub: "Finished goods in inventory" },
    { label: "Total Revenue", value: `₱${totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, sub: "From delivered orders" },
    { label: "Total Orders", value: totalOrders.toLocaleString(), sub: "All time sales orders" },
    { label: "In Transit", value: inTransitOrders.length.toLocaleString(), sub: "Orders currently shipped" },
    { label: "Low Stock", value: lowStockProducts.length.toLocaleString(), sub: "Items need restocking" },
  ];

  return (
    <div className="w-full overflow-x-hidden bg-[#fafafa] font-sans text-left min-h-screen">
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          products={products} 
        />
      )}
      
      {showTrendModal && (
        <SalesTrendModal 
          orders={orders} 
          onClose={() => setShowTrendModal(false)} 
        />
      )}

      <div className="px-4 py-6 pb-28 lg:pb-6 max-w-full text-left uppercase font-black">
        <div className="mb-6 mt-2 text-left leading-none uppercase tracking-tighter font-black">
          <h1 className="text-3xl text-gray-900 leading-none">Dashboard</h1>
          <p className="text-sm text-gray-400 font-bold mt-2 uppercase tracking-widest leading-none">Enterprise Analytics Overview</p>
        </div>

        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-x-visible no-scrollbar">
          {stats.map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-[1.75rem] p-4 shadow-sm flex flex-col justify-between flex-shrink-0 w-[150px] lg:w-auto h-[120px] text-left uppercase font-black">
              <span className="text-[9px] text-gray-400 font-black tracking-widest">{s.label}</span>
              <h2 className="text-xl font-black text-gray-900 tracking-tighter truncate leading-none uppercase">{s.value}</h2>
              <p className="text-[8px] text-gray-300 font-bold tracking-tight truncate leading-none">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 text-left uppercase font-black">
          <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col min-w-0 text-left">
            <div className="flex items-start justify-between mb-3 text-left leading-none">
              <div className="text-left leading-none">
                <h3 className="text-sm tracking-widest text-gray-900 leading-none">Monthly Revenue</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-2 leading-none uppercase">Running Year Performance</p>
              </div>
              <button
                onClick={() => setShowTrendModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Search size={12} /> Detail
              </button>
            </div>
            <div className="h-[250px] uppercase font-black">
              <Line data={salesData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col min-w-0 text-left uppercase font-black leading-none">
            <h3 className="text-sm text-gray-900 tracking-widest mb-4 text-left uppercase">Top Selling Products</h3>
            <div className="space-y-3 font-black">
              {topProducts.map((p) => (
                <div key={p.sku} className="flex justify-between items-center p-3 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-all text-left uppercase">
                  <div className="flex items-center gap-3 min-w-0 text-left uppercase leading-none font-black">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 leading-none">
                      {p.product_image ? (
                        <img src={p.product_image} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <HiPhoto size={20} className="text-gray-300" />
                      )}
                    </div>
                    <div className="min-w-0 text-left leading-none font-black">
                      <p className="text-[11px] font-black text-gray-900 truncate tracking-tight leading-none uppercase">{p.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold tracking-widest mt-1 uppercase leading-none">{p.sold} UNITS SOLD</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4 leading-none uppercase font-black">
                    <p className="text-sm font-black text-gray-900 leading-none mb-1 uppercase">₱{Number(p.revenue).toLocaleString()}</p>
                    <p className="text-[8px] text-emerald-600 tracking-widest uppercase font-black leading-none">TOP TIER</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-left uppercase font-black">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-left font-black uppercase leading-none">
            <h3 className="text-sm font-black text-gray-900 tracking-widest mb-6 uppercase leading-none text-left">Stock Restocking Alarms</h3>
            <div className="space-y-4 font-black leading-none uppercase">
              {lowStockProducts.length === 0 ? (
                <p className="text-gray-300 text-center py-10 font-black uppercase text-[10px] italic">Resources stabilized</p>
              ) : (
                lowStockProducts.slice(0, 5).map((item) => (
                  <div key={item.sku} className="flex items-center gap-4 text-left font-black uppercase leading-none">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                      {item.product_image ? (
                        <img src={item.product_image} className="w-full h-full object-cover rounded-xl" alt="" />
                      ) : (
                        <Package size={18} className="text-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left leading-none uppercase font-black">
                      <div className="flex justify-between items-center mb-1.5 text-left leading-none uppercase font-black">
                        <p className="text-[10px] text-gray-800 truncate tracking-tighter uppercase font-black leading-none">{item.name}</p>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full text-white uppercase font-black ${Number(item.current_stock) === 0 ? 'bg-red-500' : 'bg-amber-500'}`}>
                          {Number(item.current_stock) === 0 ? "Void" : "Low"}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden leading-none">
                        <div 
                          className={`h-full transition-all duration-700 ${Number(item.current_stock) === 0 ? 'bg-red-500' : 'bg-amber-500'}`} 
                          style={{ width: `${Math.max((item.current_stock / (item.min_stocks || 1)) * 100, 5)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm text-left uppercase font-black leading-none">
            <div className="flex justify-between items-center mb-6 text-left leading-none uppercase font-black">
              <h3 className="text-sm font-black text-gray-900 tracking-widest uppercase font-black">Delivery Tracking</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setDeliveryPage(p => Math.max(p - 1, 0))} 
                  disabled={deliveryPage === 0} 
                  className="p-1.5 rounded-full border border-gray-200 disabled:opacity-20 transition-all active:scale-90 leading-none"
                >
                  <ChevronLeft size={14}/>
                </button>
                <button 
                  onClick={() => setDeliveryPage(p => p + 1)} 
                  disabled={deliveryPage >= totalDeliveryPages - 1} 
                  className="p-1.5 rounded-full border border-gray-100 disabled:opacity-20 transition-all active:scale-90 leading-none"
                >
                  <ChevronRight size={14}/>
                </button>
              </div>
            </div>
            <div className="space-y-3 font-black uppercase text-left">
              {currentDeliveryOrders.length > 0 ? (
                currentDeliveryOrders.map(order => (
                  <button 
                    key={order.order_id} 
                    onClick={() => setSelectedOrder(order)} 
                    className="w-full p-4 border border-gray-50 rounded-[1.5rem] hover:bg-gray-50 text-left transition-all group flex items-center justify-between gap-4 uppercase font-black shadow-sm leading-none"
                  >
                    <div className="min-w-0 text-left leading-none uppercase font-black">
                      <p className="text-[11px] font-black text-gray-900 truncate tracking-tighter group-hover:text-blue-600 uppercase font-black leading-none">{order.client_name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2 uppercase font-black leading-none">SO-{order.order_id} · {order.courier}</p>
                    </div>
                    <span className="text-[8px] px-3 py-1 bg-blue-500 text-white rounded-full tracking-widest uppercase font-black shadow-sm leading-none">SHIPPED</span>
                  </button>
                ))
              ) : (
                <p className="text-gray-300 text-center py-10 font-black uppercase text-[10px] italic">No active deliveries</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes popIn { 
          from { opacity: 0; transform: scale(0.9) translateY(20px); } 
          to { opacity: 1; transform: scale(1) translateY(0); } 
        }
      `}</style>
    </div>
  );
};

export default MainDashboard;