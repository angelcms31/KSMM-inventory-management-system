import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  HiOutlineSearch, HiX, HiChevronLeft, HiChevronRight,
  HiOutlineCheck
} from "react-icons/hi";
import { HiPhoto } from "react-icons/hi2";

const PLATFORMS = ["Shopee", "Lazada", "TikTok Shop", "Walk-in", "Instagram", "Facebook"];
const COURIERS = ["J&T Express", "Ninja Van", "LBC", "GoGo Xpress", "Grab Express", "Lalamove", "Self Pick-up"];
const STATUS_FLOW = ["Pending", "Shipped", "Delivered"];

const getStatusStyle = (status) => {
  switch (status) {
    case "Delivered": return "bg-emerald-500";
    case "Shipped": return "bg-blue-600";
    case "Pending": return "bg-amber-500";
    default: return "bg-slate-400";
  }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [customCourier, setCustomCourier] = useState("");
  const [showCustomCourier, setShowCustomCourier] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState("");
  const [returnSuccess, setReturnSuccess] = useState(false);

  const itemsPerPage = 8;
  const userId = localStorage.getItem("user_id");

  const [form, setForm] = useState({
    client_name: "",
    platform: "",
    courier: "",
    sku: "",
    quantity: "",
    order_date: new Date().toISOString().split("T")[0],
  });

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/sales_orders");
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/finished_goods");
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const selectedProduct = products.find(p => p.sku === form.sku);

  const resetForm = () => {
    setForm({
      client_name: "",
      platform: "",
      courier: "",
      sku: "",
      quantity: "",
      order_date: new Date().toISOString().split("T")[0],
    });
    setErrorMsg("");
    setCustomCourier("");
    setShowCustomCourier(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);
    try {
      await axios.post("http://localhost:5000/api/sales_orders", { ...form, user_id: userId });
      setShowModal(false);
      resetForm();
      fetchOrders();
      fetchProducts();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (orderId, currentStatus) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[currentIndex + 1];
    setUpdatingId(orderId);
    try {
      await axios.patch(`http://localhost:5000/api/sales_orders/${orderId}/status`, { status: nextStatus });
      fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const openReturnModal = (order) => {
    setReturnOrder(order);
    setReturnReason("");
    setReturnError("");
    setReturnSuccess(false);
    setShowReturnModal(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setReturnError("");
    setSubmittingReturn(true);
    try {
      await axios.post("http://localhost:5000/api/sales_returns", {
        order_ref: `SO-${returnOrder.order_id}`,
        reason: returnReason,
        user_id: userId,
      });
      setReturnSuccess(true);
      setTimeout(() => {
        setShowReturnModal(false);
        setReturnOrder(null);
        setReturnReason("");
        setReturnSuccess(false);
      }, 1500);
    } catch (err) {
      setReturnError(err.response?.data?.message || "Failed to submit return.");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const s = searchTerm.toLowerCase();
    const matchSearch =
      (o.client_name || "").toLowerCase().includes(s) ||
      (o.platform || "").toLowerCase().includes(s) ||
      (o.courier || "").toLowerCase().includes(s) ||
      (o.product_name || "").toLowerCase().includes(s) ||
      `SO-${o.order_id}`.toLowerCase().includes(s);
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const currentOrders = filteredOrders.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const limitDigits = (max) => (e) => {
  if (e.target.value.length > max) {
    e.target.value = e.target.value.slice(0, max);
      }
    };

  return (
    <div className="w-full flex flex-col font-sans antialiased text-slate-900 text-left">
      <div className="bg-white p-4 lg:p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-4 lg:mb-8 flex gap-3 items-center">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            maxLength={30}
            placeholder="Search orders..."
            className="w-full bg-[#F8F9FA] border-none rounded-2xl py-3 pl-10 lg:pl-12 pr-4 outline-none font-bold text-slate-700 text-base"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }}
          />
        </div>
        <select
          className="bg-[#F8F9FA] border-none rounded-2xl py-3 px-3 lg:px-6 font-bold text-slate-600 outline-none cursor-pointer text-sm uppercase tracking-wider"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(0); }}
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 shadow-sm p-4 lg:p-8 flex flex-col mb-6 lg:mb-10">
        <div className="flex justify-between items-center mb-5 lg:mb-10 px-1 lg:px-2">
          <h1 className="text-2xl lg:text-4xl font-black uppercase text-slate-900 leading-none tracking-tighter">Sales Orders</h1>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
                disabled={currentPage === 0}
                className="p-1.5 rounded-full border disabled:opacity-30 hover:bg-slate-100 transition-all"
              >
                <HiChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 rounded-full border disabled:opacity-30 hover:bg-slate-100 transition-all"
              >
                <HiChevronRight size={18} />
              </button>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-black text-white px-4 lg:px-6 py-2.5 rounded-xl text-xs font-black uppercase shadow-lg hover:scale-105 transition-all tracking-widest whitespace-nowrap"
            >
              + New
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 lg:mx-0 px-4 lg:px-0">
          <table className="w-full text-center border-separate border-spacing-y-2 min-w-[560px]">
            <thead>
              <tr className="text-xs font-black text-slate-400 uppercase tracking-widest">
                <th className="pb-3 text-left">Order</th>
                <th className="pb-3 text-left hidden sm:table-cell">Client</th>
                <th className="pb-3 text-left">Product</th>
                <th className="pb-3 text-center w-10">Qty</th>
                <th className="pb-3 text-center hidden lg:table-cell">Platform</th>
                <th className="pb-3 text-center hidden lg:table-cell">Courier</th>
                <th className="pb-3 text-right">Total</th>
                <th className="pb-3 text-center hidden md:table-cell">Date</th>
                <th className="pb-3 text-left">Status</th>
                <th className="pb-3 pr-2"></th>
              </tr>
            </thead>
            <tbody className="font-bold text-slate-700">
              {currentOrders.length > 0 ? currentOrders.map(order => {
                const isDelivered = order.status === "Delivered";
                const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
                return (
                  <tr key={order.order_id} className="hover:bg-slate-50 transition-all group">
                    <td className="py-3 pl-3 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100 text-sm font-black text-slate-900 uppercase text-left whitespace-nowrap">
                      SO-{order.order_id}
                    </td>
                    <td className="py-3 border-y border-transparent group-hover:border-slate-100 text-sm text-left truncate max-w-[100px] hidden sm:table-cell">
                      {order.client_name}
                    </td>
                    <td className="py-3 border-y border-transparent group-hover:border-slate-100 text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
                          {order.product_image
                            ? <img src={order.product_image} className="w-full h-full object-cover" alt="" />
                            : <HiPhoto size={14} className="text-slate-300" />
                          }
                        </div>
                        <span className="text-xs uppercase truncate max-w-[80px] lg:max-w-[120px]">{order.product_name || order.sku}</span>
                      </div>
                    </td>
                    <td className="py-3 border-y border-transparent group-hover:border-slate-100 text-center text-sm font-black">
                      {order.quantity}
                    </td>
                    <td className="py-3 border-y border-transparent group-hover:border-slate-100 text-center text-xs font-black text-slate-500 uppercase hidden lg:table-cell">
                      {order.platform}
                    </td>
                    <td className="py-3 border-y border-transparent group-hover:border-slate-100 text-center text-xs font-black text-slate-500 uppercase hidden lg:table-cell">
                      {order.courier}
                    </td>
                    <td className="py-3 border-y border-transparent group-hover:border-slate-100 text-right text-sm font-black text-emerald-600 pr-2 whitespace-nowrap">
                      {order.total_amount != null
                        ? `₱${Number(order.total_amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="py-3 border-y border-transparent group-hover:border-slate-100 text-center text-xs text-slate-400 uppercase hidden md:table-cell whitespace-nowrap">
                      {order.order_date ? new Date(order.order_date).toLocaleDateString("en-CA") : "—"}
                    </td>
                    <td className="py-3 border-y border-transparent group-hover:border-slate-100 text-left">
                      <span className={`px-2 lg:px-3 py-1 rounded-lg text-[10px] uppercase font-black text-white shadow-sm ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-2 rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100">
                      <div className="flex items-center justify-end gap-1.5">
                        {isDelivered && (
                          <button
                            onClick={() => openReturnModal(order)}
                            title="Log Return"
                            className="p-2 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-100 shadow-sm text-sm"
                          >
                            ↩
                          </button>
                        )}
                        {!isDelivered && nextStatus && (
                          <button
                            onClick={() => handleStatusUpdate(order.order_id, order.status)}
                            disabled={updatingId === order.order_id}
                            title={`Mark as ${nextStatus}`}
                            className="p-2 bg-slate-50 text-slate-500 hover:bg-black hover:text-white rounded-xl transition-all border border-slate-200 shadow-sm disabled:opacity-40"
                          >
                            <HiOutlineCheck size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="10" className="py-16 text-center opacity-20 font-black uppercase tracking-widest text-slate-400 text-sm">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-4 lg:p-6 text-left">
          <div className="bg-white rounded-[2rem] lg:rounded-[3rem] w-full max-w-xl p-6 lg:p-12 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setShowModal(false); resetForm(); }}
              className="absolute top-5 right-5 lg:top-10 lg:right-10 text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full"
            >
              <HiX size={22} />
            </button>

            <h2 className="text-3xl lg:text-5xl font-black text-slate-900 uppercase mb-1 tracking-tighter leading-none">New Order</h2>
            <p className="text-xs text-slate-400 mb-6 font-black uppercase tracking-widest">Create a sales transaction</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Client Name</label>
                  <input
                    required
                    type="text"
                    maxLength={30}
                    className="w-full bg-[#F3F4F6] rounded-2xl p-3 lg:p-4 outline-none font-bold text-base"
                    value={form.client_name}
                    onChange={e => setForm({ ...form, client_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Platform</label>
                  <select
                    required
                    className="w-full bg-[#F3F4F6] rounded-2xl p-3 lg:p-4 outline-none font-black text-base"
                    value={form.platform}
                    onChange={e => setForm({ ...form, platform: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Courier</label>
                  {!showCustomCourier ? (
                    <select
                      required
                      className="w-full bg-[#F3F4F6] rounded-2xl p-3 lg:p-4 outline-none font-black text-base"
                      value={form.courier}
                      onChange={e => {
                        if (e.target.value === "__custom__") {
                          setShowCustomCourier(true);
                          setForm({ ...form, courier: "" });
                        } else {
                          setForm({ ...form, courier: e.target.value });
                        }
                      }}
                    >
                      <option value="">Select...</option>
                      {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="__custom__">+ Add custom courier...</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        required
                        type="text"
                        maxLength={30}
                        placeholder="Enter courier name"
                        className="flex-1 bg-[#F3F4F6] rounded-2xl p-3 lg:p-4 outline-none font-bold text-base"
                        value={customCourier}
                        onChange={e => {
                          setCustomCourier(e.target.value);
                          setForm({ ...form, courier: e.target.value });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => { setShowCustomCourier(false); setCustomCourier(""); setForm({ ...form, courier: "" }); }}
                        className="px-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-black hover:bg-slate-200 transition-all text-xs font-black uppercase"
                      >
                        Back
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Order Date</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-[#F3F4F6] rounded-2xl p-3 lg:p-4 outline-none font-bold text-base"
                    value={form.order_date}
                    onChange={e => setForm({ ...form, order_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Product</label>
                <select
                  required
                  className="w-full bg-[#F3F4F6] rounded-2xl p-3 lg:p-4 outline-none font-black text-base"
                  value={form.sku}
                  onChange={e => setForm({ ...form, sku: e.target.value, quantity: "" })}
                >
                  <option value="">Select Product...</option>
                  {products.map(p => (
                    <option key={p.sku} value={p.sku}>
                      {p.name} ({p.sku}) — Stock: {p.current_stock}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <p className="text-xs text-slate-400 font-bold ml-2 mt-1">
                    Available: <span className="text-slate-700 font-black">{selectedProduct.current_stock}</span> units
                    {selectedProduct.selling_price && (
                      <> · ₱{Number(selectedProduct.selling_price).toLocaleString("en-PH", { minimumFractionDigits: 2 })} each</>
                    )}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Quantity</label>
                <input
                  required
                  type="number"
                  onInput={limitDigits(6)}
                  min="1"
                  max={selectedProduct?.current_stock || undefined}
                  step="1"
                  placeholder="Enter quantity"
                  className="w-full bg-[#F3F4F6] rounded-2xl p-3 lg:p-4 outline-none font-bold text-base"
                  value={form.quantity}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "" || Number(val) >= 1) setForm({ ...form, quantity: val });
                  }}
                  onKeyDown={e => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
                />
                {form.quantity && selectedProduct && Number(form.quantity) > Number(selectedProduct.current_stock) && (
                  <p className="text-xs text-red-500 font-black ml-2">
                    Exceeds available stock ({selectedProduct.current_stock} units)
                  </p>
                )}
                {form.quantity && selectedProduct && form.sku && Number(form.quantity) <= Number(selectedProduct.current_stock) && (
                  <p className="text-xs text-emerald-600 font-black ml-2">
                    Total: ₱{(Number(form.quantity) * Number(selectedProduct.selling_price || 0)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                  <p className="text-sm font-black text-red-500">{errorMsg}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 lg:px-10 py-3 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-xs font-black hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 lg:px-12 py-3 bg-black text-white rounded-2xl uppercase text-xs font-black shadow-xl hover:bg-stone-800 transition-all tracking-widest disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReturnModal && returnOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-4 lg:p-6 text-left">
          <div className="bg-white rounded-[2rem] lg:rounded-[3rem] w-full max-w-md p-6 lg:p-12 relative shadow-2xl">
            <button
              onClick={() => { setShowReturnModal(false); setReturnOrder(null); setReturnReason(""); setReturnError(""); setReturnSuccess(false); }}
              className="absolute top-5 right-5 lg:top-10 lg:right-10 text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full"
            >
              <HiX size={22} />
            </button>

            <h2 className="text-3xl lg:text-5xl font-black text-slate-900 uppercase mb-1 tracking-tighter leading-none">Return</h2>
            <p className="text-xs text-slate-400 mb-1 font-black uppercase tracking-widest">Log a product return</p>
            <p className="text-sm text-slate-500 font-bold mb-6">
              Order: <span className="text-slate-800 font-black">SO-{returnOrder.order_id}</span>
              {returnOrder.product_name && <> · {returnOrder.product_name}</>}
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Reason</label>
                <textarea
                  required
                  rows={3}
                  maxLength={30}
                  placeholder="Describe the reason for return..."
                  className="w-full bg-[#F3F4F6] rounded-2xl p-3 lg:p-4 outline-none font-bold text-base resize-none"
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                />
                <p className="text-xs text-slate-400 font-black ml-2">{returnReason.length}/30</p>
              </div>

              {returnError && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                  <p className="text-sm font-black text-red-500">{returnError}</p>
                </div>
              )}

              {returnSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                  <p className="text-sm font-black text-emerald-600">✓ Return logged successfully!</p>
                </div>
              )}

              <div className="flex gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowReturnModal(false); setReturnOrder(null); setReturnReason(""); setReturnError(""); setReturnSuccess(false); }}
                  className="px-6 lg:px-10 py-3 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-xs font-black hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn || returnSuccess}
                  className="px-8 lg:px-12 py-3 bg-rose-500 text-white rounded-2xl uppercase text-xs font-black shadow-xl hover:bg-rose-600 transition-all tracking-widest disabled:opacity-50"
                >
                  {submittingReturn ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}