import React, { useState, useEffect } from "react";
import axios from "axios";
import { HiMagnifyingGlass, HiPencil, HiPhoto } from "react-icons/hi2";
import AddProductModal from "../../components/modals/AddProductModal";

export default function SalesInventory() {
  const [products, setProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const autoCreateWorkOrders = async (productList) => {
    try {
      const woRes = await axios.get("http://localhost:5000/api/artisan_work_orders");
      const existingOrders = woRes.data || [];
      const activeSkus = new Set(
        existingOrders
          .filter(wo => wo.status === "Pending" || wo.status === "pending" || wo.status === "In Production")
          .map(wo => wo.sku)
      );
      const lowStockProducts = productList.filter(p => {
        const stock = Number(p.current_stock) || 0;
        const threshold = Number(p.min_stocks) || 0;
        return stock <= threshold;
      });
      await Promise.all(
        lowStockProducts
          .filter(p => !activeSkus.has(p.sku))
          .map(p =>
            axios.post("http://localhost:5000/api/artisan_work_orders", {
              sku: p.sku,
              quantity_needed: p.min_stocks || 1,
              status: "Pending",
              product_image: p.product_image || null,
              category: p.category || "",
            })
          )
      );
    } catch (err) {
      console.error("Auto work order creation failed:", err);
    }
  };

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/finished_goods");
      const fetchedProducts = res.data || [];
      setProducts(fetchedProducts);
      await autoCreateWorkOrders(fetchedProducts);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getStockStatus = (current, min) => {
    const stock = Number(current) || 0;
    const threshold = Number(min) || 0;
    if (stock <= 0) return { label: "NO STOCK", color: "bg-[#F43F5E] text-white" };
    if (stock <= threshold) return { label: "LOW STOCK", color: "bg-[#F43F5E] text-white" };
    return { label: "IN STOCK", color: "bg-[#10B981] text-white" };
  };

  const generateNextSKU = (productList) => {
    if (!productList || productList.length === 0) return "SKU-001";
    const nums = productList
      .map(p => {
        const match = p.sku?.match(/^SKU-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `SKU-${String(max + 1).padStart(3, "0")}`;
  };

  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !search ||
      (p.name || "").toLowerCase().includes(search) ||
      (p.sku || "").toLowerCase().includes(search) ||
      (p.category || "").toLowerCase().includes(search) ||
      (p.collection || "").toLowerCase().includes(search);
    const statusObj = getStockStatus(p.current_stock, p.min_stocks);
    const matchesStatus = statusFilter === "All Status" || statusObj.label === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedProduct(null);
  };

  const handleEditClick = p => {
    setSelectedProduct(p);
    setShowAddModal(true);
  };

  return (
    <div className="flex h-screen w-full bg-[#F9FAFB] font-sans antialiased text-slate-900 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden px-10 py-8">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex gap-4 items-center flex-shrink-0">
          <div className="relative flex-1 group">
            <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by SKU, Product Name, or Category..."
              className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-slate-700 focus:ring-2 focus:ring-black/5 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 px-2">
              <div>
                <h1 className="text-3xl font-black uppercase text-slate-900 leading-none tracking-tighter">
                  Finished Goods Inventory
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 text-left">
                  Production Records
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 font-bold text-slate-600 outline-none cursor-pointer text-[10px] uppercase tracking-wider hover:bg-slate-100 transition-all shadow-sm"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="All Status">All Status</option>
                  <option value="IN STOCK">In Stock</option>
                  <option value="LOW STOCK">Low Stock</option>
                  <option value="NO STOCK">No Stock</option>
                </select>
                <button
                  onClick={() => {
                    setSelectedProduct({ sku: generateNextSKU(products), isNew: true });
                    setShowAddModal(true);
                  }}
                  className="bg-black text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all tracking-widest"
                >
                  + Add Product
                </button>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <HiMagnifyingGlass size={56} className="mb-4" />
                  <p className="text-base font-black uppercase tracking-widest text-slate-400">No results found</p>
                  {searchTerm && (
                    <p className="text-[11px] font-bold text-slate-300 mt-1 uppercase tracking-wider">
                      No products matching "{searchTerm}"
                    </p>
                  )}
                </div>
              ) : (
                <table className="w-full border-separate border-spacing-y-4">
                  <thead>
                    <tr className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
                      <th className="pb-2 text-left pl-6 w-[28%]">Product Details</th>
                      <th className="pb-2 text-center w-[12%]">Category</th>
                      <th className="pb-2 text-center w-[13%]">Stocks</th>
                      <th className="pb-2 text-center w-[10%]">Unit</th>
                      <th className="pb-2 text-center w-[13%]">Status</th>
                      <th className="pb-2 text-center w-[12%]">Price</th>
                      <th className="pb-2 text-right pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold text-slate-700">
                    {filteredProducts.map(p => {
                      const status = getStockStatus(p.current_stock, p.min_stocks);
                      return (
                        <tr key={p.sku} className="group hover:bg-slate-50/80 transition-all">
                          <td className="py-4 pl-6 rounded-l-[2rem] text-left border-y border-l border-transparent group-hover:border-slate-100 max-w-[280px]">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm flex-shrink-0">
                                {p.product_image ? (
                                  <img src={p.product_image} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <HiPhoto size={24} className="text-slate-200" />
                                )}
                              </div>
                              <div className="flex flex-col items-start min-w-0 overflow-hidden">
                                <span className="text-slate-900 font-black uppercase text-xs mb-0.5 truncate w-full" title={p.name}>
                                  {p.name || "Unnamed"}
                                </span>
                                <div className="flex items-center gap-1.5 justify-start w-full overflow-hidden text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                  <span className="truncate max-w-[120px]" title={p.sku}>{p.sku}</span>
                                  {p.collection && (
                                    <>
                                      <span className="text-slate-300 flex-shrink-0">•</span>
                                      <span className="truncate max-w-[100px]" title={p.collection}>{p.collection}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-center text-slate-500 text-sm border-y border-transparent group-hover:border-slate-100 max-w-[150px]">
                            <p className="truncate w-full uppercase font-black text-[10px]" title={p.category}>{p.category || "---"}</p>
                          </td>
                          <td className="py-4 text-center border-y border-transparent group-hover:border-slate-100 min-w-[100px]">
                            <div className="flex flex-col items-center">
                              <span className="text-[14px] text-slate-900 font-black leading-none">{p.current_stock || 0}</span>
                              <span className="text-[8px] text-slate-400 uppercase font-black mt-1 tracking-tight">Min: {p.min_stocks || 0}</span>
                            </div>
                          </td>
                          <td className="py-4 text-center border-y border-transparent group-hover:border-slate-100 min-w-[80px]">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wide">
                              {p.stock_unit || "---"}
                            </span>
                          </td>
                          <td className="py-4 text-center border-y border-transparent group-hover:border-slate-100 min-w-[120px]">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm tracking-tight inline-block whitespace-nowrap ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-4 text-center font-black text-[#10B981] border-y border-transparent group-hover:border-slate-100 whitespace-nowrap">
                            ₱{parseFloat(p.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 pr-8 rounded-r-[2rem] text-right border-y border-r border-transparent group-hover:border-slate-100">
                            <button
                              onClick={() => handleEditClick(p)}
                              className="w-10 h-10 bg-white text-slate-900 hover:shadow-md rounded-xl transition-all border border-slate-100 inline-flex items-center justify-center shadow-sm"
                            >
                              <HiPencil size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>

      {showAddModal && (
        <AddProductModal
          product={selectedProduct}
          products={products}
          fetchProducts={fetchData}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}