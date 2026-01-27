import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  HiOutlineSearch, 
  HiOutlineFilter, 
  HiOutlinePlus, 
  HiOutlinePencilAlt,
  HiOutlineOfficeBuilding
} from "react-icons/hi";
import AddProductModal from "../../components/modals/AddProductModal";
import AddWarehouseModal from "../../components/modals/AddWarehouseModal";

export default function SalesInventory() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      const productRes = await axios.get("http://localhost:5000/api/products", { 
        params: { search: searchTerm } 
      });
      setProducts(productRes.data);

      const warehouseRes = await axios.get("http://localhost:5000/api/warehouses");
      setWarehouses(warehouseRes.data);
    } catch (err) { 
      console.error("Error fetching data:", err); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [searchTerm]);

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedProduct(null);
  };

  const handleEditClick = (p) => {
    setSelectedProduct(p);
    setShowAddModal(true);
  };

  const handleWarehouseEdit = (w) => {
    setSelectedWarehouse(w);
    setShowWarehouseModal(true);
  };

  const handleCloseWarehouseModal = () => {
    setShowWarehouseModal(false);
    setSelectedWarehouse(null);
  };

  return (
    <div className="w-full h-screen bg-[#F9FAFB] font-sans overflow-hidden text-sm">
      <div className="h-full overflow-y-auto p-10 custom-scrollbar">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inventory Management</h1>
          <p className="text-gray-400 text-sm font-bold">Manage your finished goods catalog and warehouse utilization.</p>
        </header>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4 mb-8">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
            <input 
              type="text" 
              placeholder="Search product name or SKU..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 ring-stone-800/5 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="px-6 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-600 flex items-center gap-2 hover:bg-gray-100 transition-all">
            <HiOutlineFilter size={18}/> Filter
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-black text-gray-800 tracking-tight uppercase">Product Inventory</h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">List of authenticated products</p>
            </div>
            <button 
              onClick={() => { setSelectedProduct(null); setShowAddModal(true); }}
              className="px-6 py-2.5 bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-stone-800 shadow-xl transition-all active:scale-95"
            >
              <HiOutlinePlus size={16}/> Add product
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-y-3 min-w-[1000px]">
              <thead>
                <tr className="text-[10px] font-black text-gray-300 uppercase tracking-widest sticky top-0 bg-white z-10">
                  <th className="px-4 pb-2">Product</th>
                  <th className="px-4 pb-2">SKU</th>
                  <th className="px-4 pb-2">Category</th>
                  <th className="px-4 pb-2">Collection</th>
                  <th className="px-4 pb-2">Brand</th>
                  <th className="px-4 pb-2">Location</th>
                  <th className="px-4 pb-2">Stock</th>
                  <th className="px-4 pb-2">Price</th>
                  <th className="px-4 pb-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="font-bold text-gray-700">
                {products.map((p) => (
                  <tr key={p.sku} className="bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all group">
                    <td className="px-4 py-4 rounded-l-xl flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center">
                        {p.product_image ? (
                          <img src={p.product_image} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="text-[8px] text-gray-300 font-black italic uppercase">No Img</div>
                        )}
                      </div>
                      <span className="truncate max-w-[120px]">{p.name || "Unnamed"}</span>
                    </td>
                    <td className="px-4 py-4 text-gray-400 font-medium">{p.sku}</td>
                    <td className="px-4 py-4 text-gray-400 font-medium">{p.category || "---"}</td>
                    <td className="px-4 py-4 text-gray-400 font-medium italic">{p.collection || "---"}</td>
                    <td className="px-4 py-4 text-gray-400 font-medium">{p.brand || "---"}</td>
                    <td className="px-4 py-4 text-gray-400 font-medium">{p.warehouse_location || p.location || "---"}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span>{p.current_stock || 0}</span>
                        <span className={`text-[9px] uppercase font-black ${p.current_stock > (p.min_stocks || 10) ? 'text-green-500' : 'text-red-500'}`}>
                          {p.current_stock > (p.min_stocks || 10) ? 'Good' : 'Low Stock'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-900">${parseFloat(p.selling_price || 0).toFixed(2)}</td>
                    <td className="px-4 py-4 rounded-r-xl text-center">
                      <div className="flex justify-center gap-2 transition-all">
                        <button 
                          onClick={() => handleEditClick(p)} 
                          className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <HiOutlinePencilAlt size={18}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
                <HiOutlineOfficeBuilding size={20}/>
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-800 tracking-tight uppercase">Warehouse Inventory</h2>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Real-time storage monitoring</p>
              </div>
            </div>
            <button 
              onClick={() => { setSelectedWarehouse(null); setShowWarehouseModal(true); }}
              className="px-6 py-2.5 bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-stone-800 shadow-xl transition-all active:scale-95"
            >
              <HiOutlinePlus size={16}/> Add warehouse
            </button>
          </div>

          <div className="max-h-[350px] overflow-y-auto custom-scrollbar px-2">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black text-gray-300 uppercase tracking-widest sticky top-0 bg-white z-10">
                  <th className="px-4 pb-2">Warehouse</th>
                  <th className="px-4 pb-2">Location</th>
                  <th className="px-4 pb-2 text-center">Manager</th>
                  <th className="px-4 pb-2 text-right">Capacity Status</th>
                  <th className="px-4 pb-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="font-bold text-gray-700">
                {warehouses.map((w) => (
                  <tr key={w.warehouse_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">{w.name}</td>
                    <td className="px-4 py-4 text-gray-400 font-medium">{w.location}</td>
                    <td className="px-4 py-4 text-center text-gray-400">
                      {w.manager_name || w.manager || "N/A"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs">{w.capacity_total?.toLocaleString() || 0} </span>
                    
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => handleWarehouseEdit(w)}
                        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <HiOutlinePencilAlt size={18}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddProductModal 
          product={selectedProduct} 
          fetchProducts={fetchData} 
          onClose={handleCloseModal} 
        />
      )}

      {showWarehouseModal && (
        <AddWarehouseModal 
          warehouse={selectedWarehouse}
          onClose={handleCloseWarehouseModal} 
          fetchWarehouses={fetchData} 
        />
      )}
    </div>
  );
}