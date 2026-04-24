import React, { useState, useEffect, useCallback } from "react";
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
  AlertTriangle,
  Package,
  DollarSign,
  ShoppingCart,
  Truck,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  TrendingUp,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  Eye,
  User,
  Clock,
} from "lucide-react";
import { HiPhoto } from "react-icons/hi2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
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

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-gray-900 text-white",
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 ${styles[type]}`}
      style={{ animation: "slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}>
      {type === "success" && <CheckCircle className="w-4 h-4" />}
      {type === "error" && <XCircle className="w-4 h-4" />}
      {message}
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

function NotifModal({ title, message, type, onClose, actionLabel, onAction }) {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 relative"
        style={{ animation: "popIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards" }}>
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
        <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.9) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
      </div>
    </div>
  );
}

const fmtDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
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
              <p className="text-sm font-bold text-gray-700 leading-snug">{fromAddress || "Warehouse / Origin"}</p>
            </div>
            <div className="flex items-center gap-1 pt-3 flex-shrink-0 px-1">
              {[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-px bg-gray-300" />)}
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-gray-400 text-xs font-semibold mb-1">To</p>
              <p className="text-sm font-bold text-gray-700 leading-snug">{toAddress || order.client_name || "Customer"}</p>
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
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.9) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
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

  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportFilterYear, setExportFilterYear] = useState("");
  const [exportFilterMonth, setExportFilterMonth] = useState("");
  const [exportFilterDay, setExportFilterDay] = useState("");
  const [exportFilterCourier, setExportFilterCourier] = useState("");
  const [exportFilterPlatform, setExportFilterPlatform] = useState("");
  const [exporterName, setExporterName] = useState("");
  const [lastDownloadBlob, setLastDownloadBlob] = useState(null);
  const [lastDownloadName, setLastDownloadName] = useState("");

  const [toast, setToast] = useState(null);
  const [notifModal, setNotifModal] = useState(null);

  const showToast = (message, type = "info") => setToast({ message, type });

  const daysInSelected = selectedYear && selectedMonth !== ""
    ? DAYS_IN_MONTH(Number(selectedYear), Number(selectedMonth))
    : 31;

  const exportDaysInSelected = exportFilterYear && exportFilterMonth !== ""
    ? DAYS_IN_MONTH(Number(exportFilterYear), Number(exportFilterMonth))
    : 31;

  const allCouriers = [...new Set(orders.map(o => o.courier).filter(Boolean))];
  const allPlatforms = [...new Set(orders.map(o => o.platform).filter(Boolean))];

  const filterOrdersByYear = (year) =>
    orders.filter(o => o.order_date && new Date(o.order_date).getFullYear() === year);

  const buildMonthly = (filteredOrders) => {
    const arr = Array(12).fill(0);
    filteredOrders.filter(o => o.status === "Delivered").forEach(o => {
      arr[new Date(o.order_date).getMonth()] += Number(o.total_amount || 0);
    });
    return arr;
  };

  const buildDaily = (filteredOrders, year, month) => {
    const days = DAYS_IN_MONTH(year, month);
    const arr = Array(days).fill(0);
    filteredOrders.filter(o => o.status === "Delivered").forEach(o => {
      const d = new Date(o.order_date);
      if (d.getMonth() === month) arr[d.getDate() - 1] += Number(o.total_amount || 0);
    });
    return arr;
  };

  const getDayOrders = (year, month, day) =>
    orders.filter(o => {
      if (!o.order_date) return false;
      const d = new Date(o.order_date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

  const getChartData = () => {
    const yr = selectedYear ? Number(selectedYear) : currentYear;
    if (selectedYear && selectedMonth !== "") {
      const mo = Number(selectedMonth);
      return {
        labels: Array.from({ length: DAYS_IN_MONTH(yr, mo) }, (_, i) => `${i + 1}`),
        thisData: buildDaily(filterOrdersByYear(yr), yr, mo),
        lastData: buildDaily(filterOrdersByYear(yr - 1), yr - 1, mo),
      };
    }
    return {
      labels: MONTHS,
      thisData: buildMonthly(filterOrdersByYear(yr)),
      lastData: buildMonthly(filterOrdersByYear(yr - 1)),
    };
  };

  const isSingleDay = selectedYear && selectedMonth !== "" && selectedDay !== "";
  const singleDayOrders = isSingleDay
    ? getDayOrders(Number(selectedYear), Number(selectedMonth), Number(selectedDay))
    : [];
  const singleDayDelivered = singleDayOrders.filter(o => o.status === "Delivered");
  const singleDayRevenue = singleDayDelivered.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const singleDayLastYearRevenue = isSingleDay
    ? getDayOrders(Number(selectedYear) - 1, Number(selectedMonth), Number(selectedDay))
        .filter(o => o.status === "Delivered")
        .reduce((s, o) => s + Number(o.total_amount || 0), 0)
    : 0;

  const { labels, thisData, lastData } = getChartData();
  const thisTotal = isSingleDay ? singleDayRevenue : thisData.reduce((a, b) => a + b, 0);
  const lastTotal = isSingleDay ? singleDayLastYearRevenue : lastData.reduce((a, b) => a + b, 0);
  const pctChange = lastTotal > 0 ? (((thisTotal - lastTotal) / lastTotal) * 100).toFixed(1) : null;

  const chartData = {
    labels,
    datasets: [
      {
        label: "Running Year",
        data: thisData,
        borderColor: "#2563eb",
        backgroundColor: "transparent",
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 2.5,
        fill: false,
      },
      {
        label: "Last Year",
        data: lastData,
        borderColor: "#22c55e",
        backgroundColor: "transparent",
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderWidth: 2.5,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "end",
        labels: {
          boxWidth: 32,
          boxHeight: 10,
          borderRadius: 4,
          useBorderRadius: true,
          font: { size: 11, weight: "bold" },
          color: "#64748b",
          padding: 16,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#0f172a",
        titleColor: "#94a3b8",
        bodyColor: "#f1f5f9",
        padding: 12,
        cornerRadius: 10,
        titleFont: { size: 10, weight: "bold" },
        bodyFont: { size: 12, weight: "bold" },
        displayColors: true,
        callbacks: {
          label: (item) => ` ₱${Number(item.raw).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          callback: (v) => formatPeso(v),
          font: { size: 10 },
          color: "#94a3b8",
        },
        border: { display: false },
      },
      x: {
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: { font: { size: 10 }, color: "#94a3b8" },
        border: { display: false },
      },
    },
  };

  const getExportRows = () => {
    let filtered = orders.filter(o => o.status === "Delivered" && o.order_date);
    if (exportFilterYear) filtered = filtered.filter(o => new Date(o.order_date).getFullYear() === Number(exportFilterYear));
    if (exportFilterMonth !== "") filtered = filtered.filter(o => new Date(o.order_date).getMonth() === Number(exportFilterMonth));
    if (exportFilterDay !== "") filtered = filtered.filter(o => new Date(o.order_date).getDate() === Number(exportFilterDay));
    if (exportFilterCourier) filtered = filtered.filter(o => o.courier === exportFilterCourier);
    if (exportFilterPlatform) filtered = filtered.filter(o => o.platform === exportFilterPlatform);
    return filtered;
  };

  const buildExportLabel = () => {
    const parts = [];
    if (exportFilterYear) parts.push(exportFilterYear);
    if (exportFilterMonth !== "") parts.push(MONTHS[Number(exportFilterMonth)]);
    if (exportFilterDay !== "") parts.push(`Day${exportFilterDay}`);
    if (exportFilterCourier) parts.push(exportFilterCourier);
    if (exportFilterPlatform) parts.push(exportFilterPlatform);
    return parts.length ? parts.join("_") : "All";
  };

  const handleExport = () => {
    if (!exporterName.trim()) {
      showToast("Please enter your name before exporting.", "error");
      return;
    }
    const rows = getExportRows();
    if (rows.length === 0) {
      showToast("No records matched the selected filters.", "error");
      return;
    }

    const filterLabel = buildExportLabel().replace(/_/g, " ");
    const downloadTimestamp = fmtDateTime(new Date());
    const safeExporterName = exporterName.trim().replace(/\s+/g, "-");
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `sales_trend_${buildExportLabel()}_by-${safeExporterName}_${ts}`;

    if (exportFormat === "csv") {
      const header = ["Order ID", "Date", "Client", "Product", "Quantity", "Courier", "Platform", "Total Amount (₱)"];
      const meta = [
        [`Downloaded by: ${exporterName.trim()}`],
        [`Downloaded at: ${downloadTimestamp}`],
        [`Filter: ${filterLabel}`],
        [],
        header,
      ];
      const data = rows.map(o => [
        `SO-${o.order_id}`,
        o.order_date ? new Date(o.order_date).toLocaleDateString("en-PH") : "",
        o.client_name || "",
        o.product_name || o.sku || "",
        o.quantity || 0,
        o.courier || "",
        o.platform || "",
        Number(o.total_amount || 0).toFixed(2),
      ]);
      const csv = [...meta, ...data].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();

      setLastDownloadBlob(blob);
      setLastDownloadName(`${filename}.csv`);
      setNotifModal({
        title: "Export Successful",
        message: `CSV saved as "${filename}.csv"`,
        type: "success",
        actionLabel: "View Downloaded File",
        onAction: () => {
          const u = URL.createObjectURL(blob);
          window.open(u, "_blank");
          setNotifModal(null);
        },
      });

    } else {
      import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js").then(() => {
        import("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js").then(() => {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ orientation: "landscape" });
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Sales & Profit Trend Report", 14, 16);
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100);
          doc.text(`Filter: ${filterLabel}`, 14, 23);
          doc.text(`Downloaded by: ${exporterName.trim()}   |   ${downloadTimestamp}`, 14, 28);
          doc.setTextColor(0);

          const total = rows.reduce((s, o) => s + Number(o.total_amount || 0), 0);

          doc.autoTable({
            startY: 34,
            head: [["Order ID", "Date", "Client", "Product", "Qty", "Courier", "Platform", "Amount (₱)"]],
            body: rows.map(o => [
              `SO-${o.order_id}`,
              o.order_date ? new Date(o.order_date).toLocaleDateString("en-PH") : "",
              o.client_name || "",
              o.product_name || o.sku || "",
              o.quantity || 0,
              o.courier || "",
              o.platform || "",
              `₱${Number(o.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            ]),
            foot: [["", "", "", "", "", "", "Total", `₱${total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`]],
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" },
            footStyles: { fillColor: [240, 245, 255], textColor: [30, 64, 175], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [248, 250, 252] },
          });

          const pdfBlob = doc.output("blob");
          const url = URL.createObjectURL(pdfBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${filename}.pdf`;
          a.click();

          setLastDownloadBlob(pdfBlob);
          setLastDownloadName(`${filename}.pdf`);
          setNotifModal({
            title: "Export Successful",
            message: `PDF saved as "${filename}.pdf"`,
            type: "success",
            actionLabel: "View Downloaded File",
            onAction: () => {
              const u = URL.createObjectURL(pdfBlob);
              window.open(u, "_blank");
              setNotifModal(null);
            },
          });
        });
      });
    }
  };

  const viewLastDownload = () => {
    if (!lastDownloadBlob) return;
    const url = URL.createObjectURL(lastDownloadBlob);
    window.open(url, "_blank");
  };

  const selectClass = "appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all pr-8";

  const Chevron = () => (
    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(14px)", backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-2xl relative overflow-hidden max-h-[95vh] flex flex-col"
        style={{ animation: "popIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">Sales & Profit Trend</h2>
              <p className="text-xs text-gray-400 mt-0.5">Monthly sales revenue and profit margins</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExportPanel(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all ${showExportPanel ? "bg-gray-900 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
              >
                <Download size={12} />
                Export
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1"><X size={20} /></button>
            </div>
          </div>

          {showExportPanel && (
            <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
              <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Export Options</p>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3" /> Exported By
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 ring-blue-100 focus:border-blue-300 transition-all"
                  value={exporterName}
                  onChange={e => setExporterName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Download Timestamp
                </label>
                <p className="text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl">{fmtDateTime(new Date())}</p>
              </div>

              <div className="flex gap-2">
                {["csv", "pdf"].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all ${exportFormat === fmt ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <select value={exportFilterYear} onChange={e => { setExportFilterYear(e.target.value); setExportFilterMonth(""); setExportFilterDay(""); }} className={selectClass + " w-full text-xs py-2"}>
                    <option value="">All Years</option>
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <Chevron />
                </div>
                <div className="relative">
                  <select value={exportFilterMonth} onChange={e => { setExportFilterMonth(e.target.value); setExportFilterDay(""); }} disabled={!exportFilterYear} className={selectClass + " w-full text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"}>
                    <option value="">All Months</option>
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <Chevron />
                </div>
                <div className="relative">
                  <select value={exportFilterDay} onChange={e => setExportFilterDay(e.target.value)} disabled={!exportFilterYear || exportFilterMonth === ""} className={selectClass + " w-full text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"}>
                    <option value="">All Days</option>
                    {Array.from({ length: exportDaysInSelected }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <Chevron />
                </div>
                <div className="relative">
                  <select value={exportFilterCourier} onChange={e => setExportFilterCourier(e.target.value)} className={selectClass + " w-full text-xs py-2"}>
                    <option value="">All Couriers</option>
                    {allCouriers.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Chevron />
                </div>
                <div className="relative col-span-2">
                  <select value={exportFilterPlatform} onChange={e => setExportFilterPlatform(e.target.value)} className={selectClass + " w-full text-xs py-2"}>
                    <option value="">All Platforms</option>
                    {allPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <Chevron />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                <p className="text-[10px] text-gray-400 font-semibold">
                  {getExportRows().length} order{getExportRows().length !== 1 ? "s" : ""} matched
                </p>
                <div className="flex items-center gap-2">
                  {lastDownloadBlob && (
                    <button
                      onClick={viewLastDownload}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all"
                    >
                      <Eye size={11} />
                      View Last Download
                    </button>
                  )}
                  <button
                    onClick={handleExport}
                    disabled={getExportRows().length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-wide transition-all"
                  >
                    <Download size={11} />
                    Download {exportFormat.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pt-4 pb-1 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-800">
              {isSingleDay
                ? `${MONTHS[Number(selectedMonth)]} ${selectedDay}, ${selectedYear}`
                : "Overall Sales"}
            </span>
            {pctChange !== null && (
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} className={Number(pctChange) >= 0 ? "text-emerald-500" : "text-rose-500"} />
                <span className={`text-xs font-black ${Number(pctChange) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {Number(pctChange) >= 0 ? "" : ""}{pctChange}%
                </span>
                <span className="text-[10px] text-gray-400 font-semibold">vs last year</span>
              </div>
            )}
          </div>

          {isSingleDay ? (
            <div className="h-[200px] flex flex-col justify-center gap-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-2xl p-4 flex flex-col justify-between">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Revenue</p>
                  <p className="text-xl font-black text-blue-700 leading-tight">{formatPeso(singleDayRevenue)}</p>
                  <p className="text-[9px] text-blue-400 mt-1">{singleDayDelivered.length} delivered</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col justify-between">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
                  <p className="text-xl font-black text-gray-800 leading-tight">{singleDayOrders.length}</p>
                  <p className="text-[9px] text-gray-400 mt-1">{singleDayOrders.filter(o => o.status === "Shipped").length} in transit</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 flex flex-col justify-between">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Year</p>
                  <p className="text-xl font-black text-gray-800 leading-tight">{formatPeso(singleDayLastYearRevenue)}</p>
                  <p className="text-[9px] text-gray-400 mt-1">{selectedYear - 1} same day</p>
                </div>
              </div>
              {singleDayOrders.length > 0 ? (
                <div className="space-y-1.5 max-h-[80px] overflow-y-auto pr-1">
                  {singleDayOrders.map(o => (
                    <div key={o.order_id} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusStyle(o.status)}`} />
                        <p className="text-[10px] font-bold text-gray-700 truncate">{o.client_name || `SO-${o.order_id}`}</p>
                      </div>
                      <p className="text-[10px] font-black text-gray-900 flex-shrink-0 ml-2">
                        ₱{Number(o.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest py-2">No orders on this day</p>
              )}
            </div>
          ) : (
            <div className="h-[200px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-gray-100 mt-2 flex-shrink-0">
          <p className="text-base font-black text-gray-900 mb-3">Select Date</p>
          <div className="flex gap-3">
            {[
              {
                value: selectedYear,
                onChange: e => { setSelectedYear(e.target.value); setSelectedMonth(""); setSelectedDay(""); },
                disabled: false,
                placeholder: "Year",
                options: availableYears.map(y => ({ value: y, label: y })),
              },
              {
                value: selectedMonth,
                onChange: e => { setSelectedMonth(e.target.value); setSelectedDay(""); },
                disabled: !selectedYear,
                placeholder: "Month",
                options: MONTHS.map((m, i) => ({ value: i, label: m })),
              },
              {
                value: selectedDay,
                onChange: e => setSelectedDay(e.target.value),
                disabled: !selectedYear || selectedMonth === "",
                placeholder: "Day",
                options: Array.from({ length: daysInSelected }, (_, i) => ({ value: i + 1, label: i + 1 })),
              },
            ].map((sel, idx) => (
              <div key={idx} className="relative flex-1">
                <select
                  value={sel.value}
                  onChange={sel.onChange}
                  disabled={sel.disabled}
                  className={selectClass + " w-full disabled:opacity-40 disabled:cursor-not-allowed"}
                >
                  <option value="">{sel.placeholder}</option>
                  {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {notifModal && (
        <NotifModal
          title={notifModal.title}
          message={notifModal.message}
          type={notifModal.type}
          actionLabel={notifModal.actionLabel}
          onAction={notifModal.onAction}
          onClose={() => setNotifModal(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
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
        console.error(err);
      }
    };
    fetchAll();
  }, []);

  const totalRevenue = orders
    .filter(o => o.status === "Delivered")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const totalOrders = orders.length;
  const lowStockProducts = products.filter(p => Number(p.current_stock) <= Number(p.min_stocks));
  const inTransitOrders = orders.filter(o => o.status === "Shipped");
  const totalDeliveryPages = Math.ceil(inTransitOrders.length / deliveryPerPage);
  const currentDeliveryOrders = inTransitOrders.slice(deliveryPage * deliveryPerPage, (deliveryPage + 1) * deliveryPerPage);

  const topProducts = [...products]
    .map(p => {
      const sold = orders
        .filter(o => o.status === "Delivered" && (o.product_name === p.name || o.sku === p.sku))
        .reduce((sum, o) => sum + Number(o.quantity || 0), 0);
      const revenue = orders
        .filter(o => o.status === "Delivered" && (o.product_name === p.name || o.sku === p.sku))
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      return { ...p, sold, revenue };
    })
    .filter(p => p.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const currentYear = new Date().getFullYear();
  const monthlySales = Array(12).fill(0);
  orders
    .filter(o => o.status === "Delivered" && o.order_date && new Date(o.order_date).getFullYear() === currentYear)
    .forEach(o => {
      const month = new Date(o.order_date).getMonth();
      monthlySales[month] += Number(o.total_amount || 0);
    });

  const salesData = {
    labels: MONTHS,
    datasets: [
      {
        label: "Revenue (₱)",
        data: monthlySales,
        borderColor: "#1d4ed8",
        backgroundColor: "rgba(29,78,216,0.07)",
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: true,
        borderWidth: 2,
      },
    ],
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
          label: (item) => `₱${Number(item.raw).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      y: {
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: {
          callback: (v) => formatPeso(v),
          font: { size: 10 },
          color: "#94a3b8",
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: "#94a3b8" },
        border: { display: false },
      },
    },
  };

  const stats = [
    { label: "Total Products", value: products.length.toLocaleString(), sub: "Finished goods in inventory", icon: <Package className="w-3.5 h-3.5 text-gray-500 shrink-0" /> },
    { label: "Total Revenue", value: `₱${totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`, sub: "From delivered orders", icon: <DollarSign className="w-3.5 h-3.5 text-gray-500 shrink-0" /> },
    { label: "Total Orders", value: totalOrders.toLocaleString(), sub: "All time sales orders", icon: <ShoppingCart className="w-3.5 h-3.5 text-gray-500 shrink-0" /> },
    { label: "In Transit", value: inTransitOrders.length.toLocaleString(), sub: "Orders currently shipped", icon: <Truck className="w-3.5 h-3.5 text-blue-500 shrink-0" /> },
    { label: "Low Stock", value: lowStockProducts.length.toLocaleString(), sub: "Items need restocking", icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" /> },
  ];

  return (
    <div className="w-full overflow-x-hidden bg-[#fafafa] font-sans">
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

      <div className="px-4 py-6 pb-28 lg:pb-6 max-w-full">
        <div className="mb-6 mt-2">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Here's your comprehensive business overview.</p>
        </div>

        <div className="flex gap-3 mb-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-x-visible" style={{ WebkitOverflowScrolling: "touch" }}>
          {stats.map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col justify-between flex-shrink-0 w-[140px] lg:w-auto min-w-0 overflow-hidden">
              <span className="text-[11px] text-gray-500 font-medium truncate mb-1">{s.label}</span>
              <h2 className="text-lg font-bold text-gray-900 truncate">{s.value}</h2>
              <p className="text-[10px] text-gray-400 truncate mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Monthly Revenue</h3>
                <p className="text-[10px] text-gray-400">Based on delivered orders · hover to inspect</p>
              </div>
              <button
                onClick={() => setShowTrendModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all flex-shrink-0"
              >
                <Search size={12} />
                View
              </button>
            </div>
            <div className="h-[250px]">
              <Line data={salesData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Selling Products</h3>
            <div className="space-y-2 text-[10px]">
              {topProducts.length === 0 ? (
                <p className="text-gray-300 text-center py-10 font-black uppercase text-[10px]">No sales data yet</p>
              ) : topProducts.map((p) => (
                <div key={p.sku} className="flex justify-between items-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {p.product_image ? <img src={p.product_image} className="w-full h-full object-cover" alt="" /> : <HiPhoto size={16} className="text-gray-300" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-900 truncate uppercase">{p.name}</p>
                      <p className="text-[9px] text-gray-400">{p.sold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold text-gray-900">₱{Number(p.revenue).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                    <p className="text-[9px] text-emerald-600">₱{Math.round(p.revenue * 0.2).toLocaleString()} profit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
            <h3 className="text-md font-bold text-gray-800 mb-1">Stock Restocking Alarms</h3>
            <div className="space-y-4 mt-4">
              {lowStockProducts.length === 0 ? (
                <p className="text-gray-300 text-center py-10 font-black uppercase text-[10px] tracking-widest">All stocks are healthy</p>
              ) : lowStockProducts.slice(0, 7).map((item) => {
                const stock = Number(item.current_stock);
                const min = Number(item.min_stocks);
                const isNone = stock <= 0;
                const statusLabel = isNone ? "No Stock" : "Low Stock";
                const barColor = isNone ? "bg-red-600" : "bg-amber-500";
                return (
                  <div key={item.sku} className="flex items-center gap-3 border-b border-gray-50 pb-3 last:border-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {item.product_image ? <img src={item.product_image} className="w-full h-full object-cover" alt="" /> : <Package size={18} className="text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="truncate pr-2">
                          <p className="text-[10px] font-bold text-gray-800 uppercase truncate">{item.name}</p>
                          <p className="text-[9px] text-gray-400">{item.category || item.sku}</p>
                        </div>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full text-white font-bold shrink-0 ${barColor}`}>{statusLabel}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="w-full bg-gray-100 h-1 rounded-full mr-2">
                          <div className={`${barColor} h-1 rounded-full transition-all duration-500`} style={{ width: `${Math.min((stock / (min || 1)) * 100, 100)}%` }} />
                        </div>
                        <p className="text-[9px] text-gray-400 whitespace-nowrap"><span className="font-bold text-gray-700">{stock}/{min}</span></p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-md font-black text-gray-800">Delivery Tracking</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Shipped Orders · click for details</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setDeliveryPage(p => Math.max(p - 1, 0))} disabled={deliveryPage === 0} className="p-1.5 rounded-full border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all"><ChevronLeft size={14} /></button>
                <button onClick={() => setDeliveryPage(p => p + 1)} disabled={deliveryPage >= totalDeliveryPages - 1} className="p-1.5 rounded-full border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all"><ChevronRight size={14} /></button>
              </div>
            </div>

            {inTransitOrders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                <Truck size={36} className="text-gray-200 mb-2" />
                <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">No orders in transit</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {currentDeliveryOrders.map(order => (
                  <button
                    key={order.order_id}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full text-left border border-gray-100 rounded-2xl p-4 hover:bg-blue-50 hover:border-blue-100 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-gray-900 uppercase truncate group-hover:text-blue-700 transition-colors">{order.client_name}</p>
                        <p className="text-[9px] text-gray-400 font-bold mt-0.5">SO-{order.order_id} · {order.order_date ? new Date(order.order_date).toLocaleDateString("en-PH", { month: "short", day: "numeric" }) : "—"}</p>
                      </div>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full text-white font-black shrink-0 ml-2 ${getStatusStyle(order.status)}`}>{order.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-gray-500 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{COURIERS_ICON[order.courier] || "📦"}</span>
                        <span className="uppercase">{order.courier}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="uppercase text-[8px] font-black text-gray-400">{order.platform}</span>
                        <span className="text-gray-300">·</span>
                        <span className="font-black text-gray-700">{order.quantity}x {order.product_name || order.sku}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;