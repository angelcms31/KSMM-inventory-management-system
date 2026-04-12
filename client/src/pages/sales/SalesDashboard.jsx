import React, { useState, useEffect } from "react";
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
} from "chart.js";
import {
  AlertTriangle,
  Package,
  DollarSign,
  ShoppingCart,
  Truck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { HiPhoto } from "react-icons/hi2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const COURIERS_ICON = {
  "J&T Express": "🟥",
  "Ninja Van": "🟪",
  "LBC": "🟦",
  "GoGo Xpress": "🟩",
  "Grab Express": "🟨",
  "Lalamove": "🟧",
  "Self Pick-up": "⬜",
};

const getStatusStyle = (status) => {
  switch (status) {
    case "Delivered": return "bg-emerald-500";
    case "Shipped": return "bg-blue-600";
    case "Pending": return "bg-amber-500";
    default: return "bg-slate-400";
  }
};

const SalesDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [deliveryPage, setDeliveryPage] = useState(0);
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
    .sort((a, b) => Number(b.current_stock) - Number(a.current_stock))
    .slice(0, 5);

  const monthlySales = Array(12).fill(0);
  orders
    .filter(o => o.status === "Delivered")
    .forEach(o => {
      const month = new Date(o.order_date).getMonth();
      monthlySales[month] += Number(o.total_amount || 0);
    });

  const salesData = {
    labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    datasets: [
      {
        label: "Revenue (₱)",
        data: monthlySales,
        borderColor: "#1d4ed8",
        backgroundColor: "#1d4ed8",
        tension: 0.35,
        pointRadius: 0,
      },
    ],
  };

  const stats = [
    {
      label: "Total Products",
      value: products.length.toLocaleString(),
      sub: "Finished goods in inventory",
      icon: <Package className="w-3.5 h-3.5 text-gray-500 shrink-0" />,
    },
    {
      label: "Total Revenue",
      value: `₱${totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      sub: "From delivered orders",
      icon: <DollarSign className="w-3.5 h-3.5 text-gray-500 shrink-0" />,
    },
    {
      label: "Total Orders",
      value: totalOrders.toLocaleString(),
      sub: "All time sales orders",
      icon: <ShoppingCart className="w-3.5 h-3.5 text-gray-500 shrink-0" />,
    },
    {
      label: "In Transit",
      value: inTransitOrders.length.toLocaleString(),
      sub: "Orders currently shipped",
      icon: <Truck className="w-3.5 h-3.5 text-blue-500 shrink-0" />,
    },
    {
      label: "Low Stock",
      value: lowStockProducts.length.toLocaleString(),
      sub: "Items need restocking",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />,
    },
  ];

  return (
    <div className="w-full overflow-x-hidden bg-[#fafafa] font-sans">
      <div className="px-4 py-6 pb-28 lg:pb-6 max-w-full">

        <div className="mb-6 mt-2">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Here's your comprehensive business overview.</p>
        </div>

        <div
          className="flex gap-3 mb-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:overflow-x-visible"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col justify-between flex-shrink-0 w-[140px] lg:w-auto min-w-0 overflow-hidden"
            >
              <span className="text-[11px] text-gray-500 font-medium truncate mb-1">{s.label}</span>
              <h2 className="text-lg font-bold text-gray-900 truncate">{s.value}</h2>
              <p className="text-[10px] text-gray-400 truncate mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col min-w-0">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Monthly Revenue</h3>
              <p className="text-[10px] text-gray-400">Based on delivered orders</p>
            </div>
            <div className="h-[250px]">
              <Line
                data={salesData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      grid: { display: false },
                      ticks: { callback: v => `₱${(v / 1000).toFixed(0)}K` },
                    },
                    x: { grid: { display: false } },
                  },
                }}
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Products by Stock</h3>
            <div className="space-y-2 text-[10px]">
              {topProducts.length === 0 ? (
                <p className="text-gray-300 text-center py-10 font-black uppercase text-[10px]">No products yet</p>
              ) : topProducts.map((p, i) => (
                <div
                  key={p.sku}
                  className="flex justify-between items-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {p.product_image
                        ? <img src={p.product_image} className="w-full h-full object-cover" alt="" />
                        : <HiPhoto size={16} className="text-gray-300" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-gray-900 truncate uppercase">{p.name}</p>
                      <p className="text-[9px] text-gray-400">{p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold text-gray-900">{p.current_stock} units</p>
                    <p className="text-[9px] text-emerald-600">
                      ₱{Number(p.selling_price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
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
                <p className="text-gray-300 text-center py-10 font-black uppercase text-[10px] tracking-widest">
                  All stocks are healthy
                </p>
              ) : lowStockProducts.slice(0, 7).map((item, idx) => {
                const stock = Number(item.current_stock);
                const min = Number(item.min_stocks);
                const isNone = stock <= 0;
                const statusLabel = isNone ? "No Stock" : "Low Stock";
                const barColor = isNone ? "bg-red-600" : "bg-amber-500";
                return (
                  <div key={item.sku} className="flex items-center gap-3 border-b border-gray-50 pb-3 last:border-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {item.product_image
                        ? <img src={item.product_image} className="w-full h-full object-cover" alt="" />
                        : <Package size={18} className="text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="truncate pr-2">
                          <p className="text-[10px] font-bold text-gray-800 uppercase truncate">{item.name}</p>
                          <p className="text-[9px] text-gray-400">{item.category || item.sku}</p>
                        </div>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full text-white font-bold shrink-0 ${barColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="w-full bg-gray-100 h-1 rounded-full mr-2">
                          <div
                            className={`${barColor} h-1 rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min((stock / (min || 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-gray-400 whitespace-nowrap">
                          <span className="font-bold text-gray-700">{stock}/{min}</span>
                        </p>
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
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  Shipped Orders
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDeliveryPage(p => Math.max(p - 1, 0))}
                  disabled={deliveryPage === 0}
                  className="p-1.5 rounded-full border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setDeliveryPage(p => p + 1)}
                  disabled={deliveryPage >= totalDeliveryPages - 1}
                  className="p-1.5 rounded-full border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {inTransitOrders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                <Truck size={36} className="text-gray-200 mb-2" />
                <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">
                  No orders in transit
                </p>
              </div>
            ) : (
              <div className="space-y-3 flex-1">
                {currentDeliveryOrders.map(order => (
                  <div
                    key={order.order_id}
                    className="border border-gray-100 rounded-2xl p-4 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-gray-900 uppercase truncate">
                          {order.client_name}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold mt-0.5">
                          SO-{order.order_id} · {order.order_date ? new Date(order.order_date).toLocaleDateString("en-PH", { month: "short", day: "numeric" }) : "—"}
                        </p>
                      </div>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full text-white font-black shrink-0 ml-2 ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-gray-500 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{COURIERS_ICON[order.courier] || "📦"}</span>
                        <span className="uppercase">{order.courier}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="uppercase text-[8px] font-black text-gray-400">{order.platform}</span>
                        <span className="text-gray-300">·</span>
                        <span className="font-black text-gray-700">
                          {order.quantity}x {order.product_name || order.sku}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;