import React, { useState } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  AlertTriangle,
  Package,
  DollarSign,
  ShoppingCart,
  Users,
  Search,
  ArrowUp,
  Truck,
  ShoppingBag,
  Gem
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

const FinanceDashboard = () => {
  const [modalSales, setModalSales] = useState(false);
  const [modalCustomer, setModalCustomer] = useState(false);

  const stats = [
    { label: "Total Products", value: "1,234", sub: "+12% from last month", icon: <Package className="w-3.5 h-3.5 text-gray-500 shrink-0" /> },
    { label: "Inventory Value", value: "$752,431", sub: "Current inventory value", icon: <DollarSign className="w-3.5 h-3.5 text-gray-500 shrink-0" /> },
    { label: "Monthly Sales", value: "$145,230", sub: "+22% from last month", icon: <ShoppingCart className="w-3.5 h-3.5 text-gray-500 shrink-0" /> },
    { label: "Active Customers", value: "1,734", sub: "+156 new this month", icon: <Users className="w-3.5 h-3.5 text-gray-500 shrink-0" /> },
    { label: "Low Stock", value: "10", sub: "Items need restocking", icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" /> },
  ];

  const topProducts = [
    { icon: <ShoppingBag size={18} className="text-blue-500" />, name: "AVICE (Apple Green / Light Pink)", units: 145, revenue: 145000, profit: 29000 },
    { icon: <ShoppingBag size={18} className="text-purple-500" />, name: "AVICE (Multicolor / Apple Green)", units: 89, revenue: 89000, profit: 22250 },
    { icon: <Gem size={18} className="text-amber-500" />, name: "KAJIKA PETITE (Mother of Pearl)", units: 76, revenue: 76000, profit: 19000 },
    { icon: <Gem size={18} className="text-emerald-500" />, name: "AMARANTE (Bottle Green)", units: 65, revenue: 65000, profit: 16250 },
    { icon: <Gem size={18} className="text-pink-500" />, name: "AMARANTE (Multicolor / Light Pink)", units: 54, revenue: 32400, profit: 8100 },
  ];

  const stockAlarms = [
    { name: "AMARANTE (Dark Brown)", type: "Necklace", current: 4, min: 50, status: "Critical", color: "bg-red-600" },
    { name: "AVICE (Multicolor)", type: "Bag", current: 5, min: 30, status: "Critical", color: "bg-red-600" },
    { name: "AVICE (Cobalt Blue)", type: "Bag", current: 23, min: 50, status: "Low", color: "bg-gray-400" },
    { name: "SEAVER (Black Lip)", type: "Earring", current: 12, min: 25, status: "Medium", color: "bg-yellow-500" },
    { name: "OURSIN (Red)", type: "Type", current: 2, min: 20, status: "Critical", color: "bg-red-600" },
    { name: "KAJIKA (Gold Leaf)", type: "Necklace", current: 3, min: 40, status: "Critical", color: "bg-red-600" },
    { name: "SEAVER (Black Lip)", type: "Earring", current: 12, min: 25, status: "Medium", color: "bg-yellow-500" },
  ];

  const customerSatisfaction = {
    labels: ["Satisfied", "Neutral", "Dissatisfied"],
    datasets: [
      {
        data: [75, 15, 10],
        backgroundColor: ["#15803d", "#eab308", "#dc2626"],
        borderWidth: 0,
      },
    ],
  };

  const deliverySteps = [
    { title: "Order Delivered", desc: "45 Mabini Street...", date: "11 June 2025", status: "completed" },
    { title: "Delivery", desc: "NLEX Cargo Terminal...", date: "10 June 2025", status: "current" },
    { title: "In Transit", desc: "NCR Central...", date: "09 June 2025", status: "pending" },
    { title: "Order Placed", desc: "An order has been placed", date: "08 June 2025", status: "pending" },
  ];

  const salesData = {
    labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    datasets: [
      {
        label: "Last Year",
        data: [12,15,14,18,20,16,17,22,19,23,21,18],
        borderColor: "#22c55e",
        backgroundColor: "#22c55e",
        tension: 0.35,
        pointRadius: 0
      },
      {
        label: "Running Year",
        data: [14,16,13,19,24,20,18,23,21,24,22,20],
        borderColor: "#1d4ed8",
        backgroundColor: "#1d4ed8",
        tension: 0.35,
        pointRadius: 0
      },
    ],
  };

  const overallSalesChange = { increased: true, percent: 1.1 };

  return (
    <div className="w-full overflow-x-hidden bg-[#fafafa] font-sans">
      <div className="px-4 py-6 pb-28 lg:pb-6 max-w-full">

        <div className="mb-6 mt-2">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Here's your comprehensive business overview.</p>
        </div>

        <div
          className="flex gap-3 mb-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-x-visible"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {stats.map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col justify-between flex-shrink-0 w-[140px] lg:w-auto min-w-0 overflow-hidden">
              <span className="text-[11px] text-gray-500 font-medium truncate mb-1">{s.label}</span>
              <h2 className="text-lg font-bold text-gray-900 truncate">{s.value}</h2>
              <p className="text-[10px] text-gray-400 truncate mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col min-w-0">
            <div className="flex justify-between items-center mb-1">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Sales & Profit Trend</h3>
                <p className="text-[10px] text-gray-400">Monthly sales revenue and profit margins</p>
              </div>
              <button
                className="flex items-center gap-2 bg-blue-100 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-200 font-medium text-[11px] flex-shrink-0 ml-2"
                onClick={() => setModalSales(true)}
              >
                <Search className="w-4 h-4" /> View
              </button>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded mb-2">
              <span className="text-[11px] font-medium">Overall Sales</span>
              <div className="flex items-center gap-1 text-[10px] font-medium">
                <ArrowUp className="w-3 h-3 text-green-500" />
                <span className="text-green-500 font-bold">{overallSalesChange.percent}%</span>
                <span className="text-gray-400 ml-1">vs last year</span>
              </div>
            </div>
            <div className="h-[250px]">
              <Line data={salesData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Top Selling Products</h3>
            <div className="space-y-2 text-[10px]">
              {topProducts.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {p.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-[9px] text-gray-400">{p.units} units sold</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold text-gray-900">${p.revenue.toLocaleString()}</p>
                    <p className="text-[9px] text-green-600">+${p.profit.toLocaleString()} profit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
            <h3 className="text-md font-bold text-gray-800 mb-1">Stock Restocking Alarms</h3>
            <div className="space-y-4 mt-4">
              {stockAlarms.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 border-b border-gray-50 pb-3 last:border-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <Package size={18} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="truncate pr-2">
                        <p className="text-[10px] font-bold text-gray-800 uppercase truncate">{item.name}</p>
                        <p className="text-[9px] text-gray-400">{item.type}</p>
                      </div>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full text-white font-bold shrink-0 ${item.color}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="w-full bg-gray-100 h-1 rounded-full mr-2">
                        <div
                          className={`${item.color} h-1 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min((item.current / item.min) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-[9px] text-gray-400 whitespace-nowrap">
                        <span className="font-bold text-gray-700">{item.current}/{item.min}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-bold text-gray-800">Customer Satisfaction</h3>
              <button
                onClick={() => setModalCustomer(true)}
                className="text-[11px] font-bold bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200 flex items-center gap-1 transition-colors"
              >
                <Search size={14} className="text-gray-600" /> View
              </button>
            </div>

            <div className="relative w-full h-[260px]">
              <Doughnut
                data={customerSatisfaction}
                options={{
                  maintainAspectRatio: false,
                  cutout: "75%",
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      enabled: true,
                      callbacks: {
                        label: function(context) {
                          let label = context.label || '';
                          if (label) label += ': ';
                          if (context.parsed !== null) label += context.parsed + '%';
                          return label;
                        }
                      }
                    }
                  },
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold text-gray-800 leading-none">745</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Reviews</span>
              </div>
            </div>
            <div className="w-full space-y-4 px-1 mt-4">
              {[
                { label: "Satisfied", val: "75%", c: "bg-green-700", sub: "EXCELLENT" },
                { label: "Neutral", val: "15%", c: "bg-yellow-500", sub: "AVERAGE" },
                { label: "Dissatisfied", val: "10%", c: "bg-red-600", sub: "CRITICAL" },
              ].map((s, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.c} shrink-0`} />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-gray-700 leading-none">{s.label}</span>
                      <span className="text-[8px] text-gray-400 mt-1 font-bold tracking-widest">{s.sub}</span>
                    </div>
                  </div>
                  <span className="text-[14px] font-black text-gray-900 tracking-tight">{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-col">
            <h3 className="text-md font-black text-gray-800 mb-4">Real-time Delivery Tracking</h3>

            <div className="flex items-center gap-3 border-2 border-green-700 rounded-xl py-2 px-3 mb-5 bg-white">
              <div className="bg-green-700 rounded-full p-1.5 text-white shrink-0">
                <Truck size={14} fill="currentColor" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-tight text-green-700 leading-none">
                  Estimated Delivery Date
                </span>
                <span className="text-[10px] font-black text-green-700 mt-1 leading-none">
                  11 June, 2025
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6 relative px-1">
              <div className="absolute top-3 left-[30%] right-[30%] border-t border-dashed border-gray-200"></div>
              <div>
                <p className="text-2xl font-black text-gray-900 leading-none tracking-tighter">From</p>
                <p className="text-[8px] text-gray-400 mt-2 leading-tight font-bold uppercase max-w-[100px]">
                  123 Aurora Blvd, Mariana<br />Quezon City, Metro Manila
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-gray-900 leading-none tracking-tighter">To</p>
                <p className="text-[8px] text-gray-400 mt-2 leading-tight font-bold uppercase max-w-[100px] ml-auto">
                  45 Mabini Street, San Roque<br />Marikina City, Metro Manila
                </p>
              </div>
            </div>

            <div className="border border-gray-100 rounded-full p-1.5 flex items-center gap-3 mb-6 shadow-sm bg-white">
              <div className="bg-green-700 p-2 rounded-full text-white shrink-0">
                <Truck size={14} />
              </div>
              <div className="flex flex-col">
                <p className="text-[11px] font-black text-gray-900 leading-none uppercase italic tracking-tighter">Ninja Van</p>
                <p className="text-[8px] text-gray-400 mt-0.5 font-black tracking-widest uppercase">Truck - 4FRG652</p>
              </div>
            </div>

            <div className="px-4 pt-2">
              {deliverySteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`relative flex gap-8 pb-8 last:pb-0 border-l-2 ml-[7px] ${
                    idx === deliverySteps.length - 1 ? "border-transparent" : "border-gray-100"
                  }`}
                >
                  <div className={`absolute -left-[9.5px] top-[2px] z-10 w-4 h-4 rounded-full border-4 border-white shadow-sm ${
                    step.status === 'completed' ? 'bg-green-700' : 'bg-gray-400'
                  }`}></div>

                  <div className="flex-1 flex justify-between items-start pl-2">
                    <div className="min-w-0 pr-2">
                      <p className={`text-[10px] font-black leading-none uppercase tracking-wide ${
                        step.status === 'completed' ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-[9px] text-gray-400 mt-2 leading-snug font-bold">
                        {step.desc}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[9px] font-black text-gray-500 leading-none">{step.date}</p>
                      <p className="text-[7px] text-gray-300 mt-1.5 font-black uppercase tracking-widest">8:00 AM</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modalSales && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 font-bold text-xl"
              onClick={() => setModalSales(false)}
            >
              ✕
            </button>
            <h3 className="text-lg font-bold mb-2">Sales & Profit Trend</h3>
            <p className="text-[12px] text-gray-500 mb-3">Monthly sales revenue and profit margins</p>

            <div className="flex justify-between items-center bg-gray-50 p-3 rounded mb-3">
              <span className="text-[12px] font-medium">Overall Sales</span>
              <div className="flex items-center gap-1 text-[12px] font-medium">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-bold">{overallSalesChange.percent}%</span>
                <span className="text-gray-400 ml-1">vs last year</span>
              </div>
            </div>

            <div className="h-[250px]">
              <Line
                data={salesData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      align: 'end',
                      labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        usePointStyle: true,
                        pointStyle: 'rect',
                        padding: 15,
                        font: { size: 10, weight: '500' }
                      }
                    },
                    tooltip: { mode: 'index', intersect: false }
                  },
                  scales: {
                    y: { display: true, grid: { display: false } },
                    x: { grid: { display: false } }
                  }
                }}
              />
            </div>

            <div className="flex flex-col mt-4 mb-4">
              <span className="font-semibold text-lg mb-3">Select Date</span>
              <div className="flex gap-3 flex-wrap">
                <select className="border border-gray-300 rounded px-4 py-2 text-base">
                  <option>Year</option>
                  <option>2025</option>
                  <option>2024</option>
                  <option>2023</option>
                </select>
                <select className="border border-gray-300 rounded px-4 py-2 text-base">
                  <option>Month</option>
                  <option>Jan</option><option>Feb</option><option>Mar</option><option>Apr</option>
                  <option>May</option><option>Jun</option><option>Jul</option><option>Aug</option>
                  <option>Sep</option><option>Oct</option><option>Nov</option><option>Dec</option>
                </select>
                <select className="border border-gray-300 rounded px-4 py-2 text-base">
                  <option>Day</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i}>{String(i + 1).padStart(2, "0")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-5 right-6 text-gray-400 hover:text-gray-900 font-bold text-2xl"
              onClick={() => setModalCustomer(false)}
            >✕</button>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900">Customer Satisfaction Overview</h3>
              <p className="text-sm text-gray-500 mt-1">Percentage breakdown for 745 total reviews.</p>
            </div>

            <div className="relative w-full h-[320px] mb-8">
              <Doughnut
                data={customerSatisfaction}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'bottom',
                      labels: { padding: 20, font: { size: 12, weight: 'bold' } }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => ` ${context.label}: ${context.raw}%`
                      }
                    }
                  }
                }}
              />
              <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <span className="text-4xl font-black text-gray-800">745</span>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Reviews</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Satisfied", count: "559", color: "text-green-700", bg: "bg-green-50" },
                { label: "Neutral", count: "112", color: "text-yellow-600", bg: "bg-yellow-50" },
                { label: "Unhappy", count: "74", color: "text-red-600", bg: "bg-red-50" },
              ].map((item, idx) => (
                <div key={idx} className={`${item.bg} p-3 rounded-2xl text-center`}>
                  <p className={`text-[10px] font-bold uppercase ${item.color}`}>{item.label}</p>
                  <p className="text-lg font-black text-gray-800">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;