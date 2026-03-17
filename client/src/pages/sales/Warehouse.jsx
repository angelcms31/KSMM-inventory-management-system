import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  HiOutlineSearch, HiX, HiDotsHorizontal, HiChevronLeft, HiChevronRight,
} from "react-icons/hi";
import {
  HiOutlineBuildingStorefront, HiOutlineMapPin, HiOutlineUser,
  HiOutlineCube, HiOutlineArchiveBox, HiPhoto,
} from "react-icons/hi2";
import AddWarehouseModal from "../../components/modals/AddWarehouseModal";

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryWarehouse, setInventoryWarehouse] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const itemsPerPage = 8;

  const [allFinishedGoods, setAllFinishedGoods] = useState([]);

  const fetchData = async () => {
    try {
      const [whRes, fgRes] = await Promise.all([
        axios.get("http://localhost:5000/api/warehouses"),
        axios.get("http://localhost:5000/api/finished_goods"),
      ]);
      setWarehouses(whRes.data || []);
      setAllFinishedGoods(fgRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const getWarehouseStock = (warehouseName) => {
    return allFinishedGoods
      .filter(p => (p.warehouse_location || "").toLowerCase() === (warehouseName || "").toLowerCase())
      .reduce((sum, p) => sum + (Number(p.current_stock) || 0), 0);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCardClick = (w) => {
    setInventoryWarehouse(w);
    setInventorySearch("");
    setShowInventoryModal(true);
    const filtered = allFinishedGoods.filter(p =>
      (p.warehouse_location || "").toLowerCase() === (w.name || "").toLowerCase()
    );
    setInventoryItems(filtered);
  };

  const handleCloseInventoryModal = () => {
    setShowInventoryModal(false);
    setInventoryWarehouse(null);
    setInventoryItems([]);
    setInventorySearch("");
  };

  const filteredInventory = useMemo(() => {
    const s = inventorySearch.toLowerCase();
    if (!s) return inventoryItems;
    return inventoryItems.filter(item =>
      (item.name || "").toLowerCase().includes(s) ||
      (item.sku || "").toLowerCase().includes(s) ||
      (item.category || "").toLowerCase().includes(s) ||
      (item.collection || "").toLowerCase().includes(s)
    );
  }, [inventoryItems, inventorySearch]);

  const stats = useMemo(() => {
    const total = warehouses.length;
    const totalCapacity = warehouses.reduce((s, w) => s + (Number(w.capacity_total) || 0), 0);
    const totalStocks = allFinishedGoods.reduce((s, p) => s + (Number(p.current_stock) || 0), 0);
    const totalLowStock = warehouses.reduce((s, w) => s + (Number(w.low_stock_count) || 0), 0);
    return { total, totalCapacity, totalStocks, totalLowStock };
  }, [warehouses, allFinishedGoods]);

  const filteredWarehouses = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return warehouses.filter(w =>
      (w.name || "").toLowerCase().includes(s) ||
      (w.location || "").toLowerCase().includes(s) ||
      (w.manager_name || "").toLowerCase().includes(s)
    );
  }, [warehouses, searchTerm]);

  const currentWarehouses = filteredWarehouses.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const getUtilizationPct = (w) => {
    const cap = Number(w.capacity_total) || 1;
    const used = getWarehouseStock(w.name);
    const raw = (used / cap) * 100;
    return Math.min(parseFloat(raw.toFixed(2)), 100);
  };

  const getUtilizationColor = (pct) => {
    if (pct >= 90) return "bg-rose-500";
    if (pct >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const handleCloseModal = () => {
    setShowWarehouseModal(false);
    setSelectedWarehouse(null);
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center font-black text-gray-400 animate-pulse tracking-widest uppercase text-xs">
      Loading...
    </div>
  );

  return (
    <div className="w-full flex flex-col font-sans antialiased text-slate-900">
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-3 flex gap-4 items-center">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, location or manager..."
            className="w-full bg-[#F8F9FA] border-none rounded-xl py-2.5 pl-11 pr-4 outline-none font-bold text-slate-700 text-xs"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(0); }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-3">
        {[
          { label: "Total Warehouses", val: stats.total, sub: "Storage Locations", icon: <HiOutlineBuildingStorefront size={20} /> },
          { label: "Total Capacity", val: `${stats.totalCapacity.toLocaleString()} Units`, sub: "Max Storage", icon: <HiOutlineCube size={20} /> },
          { label: "Total Stocks Available", val: `${stats.totalStocks.toLocaleString()} Units`, sub: "Across All Warehouses", icon: <HiOutlineArchiveBox size={20} /> },
          { label: "Low Stock Items", val: stats.totalLowStock, sub: "Needs Attention", icon: <HiOutlineCube size={20} /> },
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">{item.label}</p>
              <span className="text-slate-300">{item.icon}</span>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight truncate">{item.val}</h2>
              <p className="text-slate-400 text-[8px] font-bold uppercase mt-0.5 tracking-tighter">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 pb-10">
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 relative h-fit text-left">
          <div className="flex justify-between items-center mb-6 px-2">
            <div>
              <h1 className="text-2xl font-black uppercase text-slate-900 leading-none tracking-tighter">
                Manage Warehouses
              </h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Storage Monitoring</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 mr-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 0))}
                  disabled={currentPage === 0}
                  className="p-1.5 rounded-full border border-slate-200 disabled:opacity-30 hover:bg-slate-100 transition-all"
                >
                  <HiChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage >= Math.ceil(filteredWarehouses.length / itemsPerPage) - 1}
                  className="p-1.5 rounded-full border border-slate-200 disabled:opacity-30 hover:bg-slate-100 transition-all"
                >
                  <HiChevronRight size={16} />
                </button>
              </div>
              <button
                onClick={() => { setSelectedWarehouse(null); setShowWarehouseModal(true); }}
                className="bg-black text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg hover:scale-105 transition-all tracking-widest"
              >
                + Add Warehouse
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-5">
            {currentWarehouses.length > 0 ? (
              currentWarehouses.map(w => {
                const pct = getUtilizationPct(w);
                const barColor = getUtilizationColor(pct);
                return (
                  <div
                    key={w.warehouse_id}
                    onClick={() => handleCardClick(w)}
                    className="border border-gray-100 rounded-3xl p-5 bg-white shadow-sm flex flex-col hover:shadow-md transition-all relative cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-slate-400">
                        <HiOutlineBuildingStorefront size={20} />
                      </div>
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === w.warehouse_id ? null : w.warehouse_id)}
                          className="text-slate-300 hover:text-black transition-colors"
                        >
                          <HiDotsHorizontal size={20} />
                        </button>
                        {activeMenuId === w.warehouse_id && (
                          <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-100 rounded-xl shadow-xl z-20 py-1.5 text-left">
                            <button
                              onClick={() => {
                                setSelectedWarehouse(w);
                                setShowWarehouseModal(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 font-black text-[8px] uppercase hover:bg-gray-50 text-slate-600"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3 overflow-hidden">
                      <h3
                        className="font-black text-base text-slate-900 leading-tight truncate overflow-hidden whitespace-nowrap w-full"
                        title={w.name}
                      >
                        {w.name}
                      </h3>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <HiOutlineMapPin size={12} className="text-slate-300 flex-shrink-0" />
                        <span
                          className="text-[9px] font-bold text-slate-500 truncate overflow-hidden whitespace-nowrap"
                          title={w.location}
                        >
                          {w.location || "No Location"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <HiOutlineUser size={12} className="text-slate-300 flex-shrink-0" />
                        <span
                          className="text-[9px] font-bold text-slate-500 truncate overflow-hidden whitespace-nowrap"
                          title={w.manager_name}
                        >
                          {w.manager_name || "Unassigned"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 mt-auto">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Stock vs Capacity</span>
                        <span className="text-[9px] font-black text-slate-700">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${barColor}`}
                          style={{ width: `${Math.max(pct, pct > 0 ? 1.5 : 0)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[8px] text-slate-400 font-bold">
                          {getWarehouseStock(w.name).toLocaleString()} stocks
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold">
                          {Number(w.capacity_total || 0).toLocaleString()} capacity
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-4 py-20 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                <HiOutlineSearch size={48} className="mb-2 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest">No warehouses found</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {showInventoryModal && inventoryWarehouse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-6 text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl p-10 relative shadow-2xl flex flex-col max-h-[90vh]">
            <button
              onClick={handleCloseInventoryModal}
              className="absolute top-10 right-10 text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm"
            >
              <HiX size={24} />
            </button>

            <div className="mb-5">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                {inventoryWarehouse.name}
              </h2>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">
                Finished Goods Inventory
              </p>
              <div className="flex items-center gap-3 mt-2">
                <p className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                  <HiOutlineMapPin size={11} className="text-slate-300" />
                  {inventoryWarehouse.location || "No Location"}
                </p>
                <span className="text-slate-200">•</span>
                <p className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                  <HiOutlineUser size={11} className="text-slate-300" />
                  {inventoryWarehouse.manager_name || "Unassigned"}
                </p>
              </div>
            </div>

            <div className="relative mb-4">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
              <input
                type="text"
                placeholder="Search by name, SKU or category..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-9 pr-4 outline-none font-bold text-slate-700 text-xs"
                value={inventorySearch}
                onChange={e => setInventorySearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {inventoryLoading ? (
                <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest animate-pulse">
                  Loading inventory...
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">
                  No materials found
                </div>
              ) : (
                <table className="w-full border-separate border-spacing-y-2">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      <th className="pb-3 text-left pl-2">Product</th>
                      <th className="pb-3 text-center">Category</th>
                      <th className="pb-3 text-center">Stock</th>
                      <th className="pb-3 text-center">Min</th>
                      <th className="pb-3 text-center">Price</th>
                      <th className="pb-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold text-slate-700">
                    {filteredInventory.map(item => {
                      const stock = Number(item.current_stock) || 0;
                      const min = Number(item.min_stocks) || 0;
                      const isLow = stock <= 0 ? "NO STOCK" : stock <= min ? "LOW STOCK" : "IN STOCK";
                      const statusColor = isLow === "IN STOCK" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white";
                      return (
                        <tr key={item.sku} className="group hover:bg-slate-50 transition-all">
                          <td className="py-3 pl-2 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100 max-w-[200px]">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 flex-shrink-0">
                                {item.product_image
                                  ? <img src={item.product_image} className="w-full h-full object-cover" alt="" />
                                  : <HiPhoto size={16} className="text-slate-300" />
                                }
                              </div>
                              <div className="min-w-0">
                                <span
                                  className="text-xs font-black text-slate-900 uppercase truncate overflow-hidden whitespace-nowrap block"
                                  title={item.name}
                                >
                                  {item.name || "Unnamed"}
                                </span>
                                <span
                                  className="text-[9px] text-slate-400 font-bold truncate overflow-hidden whitespace-nowrap block"
                                  title={item.sku}
                                >
                                  {item.sku}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-center border-y border-transparent group-hover:border-slate-100">
                            <span
                              className="text-[10px] text-slate-500 font-bold uppercase truncate overflow-hidden whitespace-nowrap block px-1"
                              title={item.category}
                            >
                              {item.category || "---"}
                            </span>
                          </td>
                          <td className="py-3 text-center font-black text-slate-900 border-y border-transparent group-hover:border-slate-100">
                            {item.current_stock || 0}
                          </td>
                          <td className="py-3 text-center text-[10px] text-slate-400 font-bold border-y border-transparent group-hover:border-slate-100">
                            {item.min_stocks || 0}
                          </td>
                          <td className="py-3 text-center font-black text-emerald-600 border-y border-transparent group-hover:border-slate-100 whitespace-nowrap">
                            ₱{parseFloat(item.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 text-center rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${statusColor}`}>
                              {isLow}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showWarehouseModal && (
        <AddWarehouseModal
          warehouse={selectedWarehouse}
          onClose={handleCloseModal}
          fetchWarehouses={fetchData}
        />
      )}
    </div>
  );
}