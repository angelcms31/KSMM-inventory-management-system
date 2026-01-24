import React, { useState, useEffect } from 'react';
import { HiOutlineSearch, HiOutlinePencil, HiOutlineClipboardList, HiOutlineFilter } from 'react-icons/hi';

export default function Artisan() {
  const [userName, setUserName] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All categories");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [materials, setMaterials] = useState([
    {
      id: 1,
      name: "Raw Material",
      sku: "WBH-001",
      category: "Earrings",
      stock: 45,
      price: "$79.99",
      supplier: "Supplier Name",
      status: "In Stock",
      image: "https://via.placeholder.com/50/E8D4C4/A89080?text=Material"
    },
    {
      id: 2,
      name: "Raw Material",
      sku: "WBH-001",
      category: "Earrings",
      stock: 45,
      price: "$79.99",
      supplier: "Supplier Name",
      status: "In Stock",
      image: "https://via.placeholder.com/50/E8D4C4/A89080?text=Material"
    },
    {
      id: 3,
      name: "Raw Material",
      sku: "WBH-001",
      category: "Earrings",
      stock: 45,
      price: "$79.99",
      supplier: "Supplier Name",
      status: "In Stock",
      image: "https://via.placeholder.com/50/E8D4C4/A89080?text=Material"
    }
  ]);

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) setUserName(savedName);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "In Stock": return "bg-green-500";
      case "Low Stock": return "bg-yellow-500";
      case "Out of Stock": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === "All categories" || material.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedMaterials = filteredMaterials.slice(startIdx, startIdx + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#FBFBFB] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <div className="px-10 pt-10 pb-6 bg-white">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Artisan</h1>
          <p className="text-sm text-gray-400 font-medium">Manage your product inventory</p>
        </div>

        <div className="px-10 py-6 bg-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <HiOutlineSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="text"
                placeholder="Search by material name, SKU, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm font-medium"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-2 focus:ring-gray-100 text-sm font-bold text-gray-500 uppercase tracking-widest cursor-pointer"
            >
              <option>All categories</option>
              <option>Earrings</option>
              <option>Bags</option>
              <option>Headpiece</option>
              <option>Necklace</option>
            </select>
            <button className="bg-black text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-sm">
              + Add Material
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-10 py-8">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tighter mb-1">Raw Material Inventory</h2>
                <p className="text-xs text-gray-400 font-medium">Manage your product catalog and stock levels</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-2 focus:ring-gray-100 text-sm font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-2">
                  <HiOutlineFilter size={16} />
                  Filter
                </button>
                <button className="bg-black text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-sm">
                  + Add Material
                </button>
              </div>
            </div>
            
            <table className="w-full text-left align-middle">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Image</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Material Name</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">SKU</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Category</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Stock</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Price</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Supplier</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMaterials.length > 0 ? (
                  paginatedMaterials.map((material, idx) => (
                    <tr key={idx} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-all align-middle">
                      <td className="px-6 py-5 text-center align-middle">
                        <img src={material.image} alt={material.name} className="w-12 h-12 rounded-lg object-cover mx-auto" />
                      </td>
                      <td className="px-8 py-5 text-sm text-gray-900 font-black tracking-tight align-middle text-center">{material.name}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium align-middle">{material.sku}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium align-middle">{material.category}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium text-center align-middle">{material.stock}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium text-center align-middle">{material.price}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium align-middle">{material.supplier}</td>
                      <td className="px-6 py-5 text-center align-middle">
                        <span className={`px-5 py-2 rounded-full text-[10px] font-black text-white uppercase tracking-tight inline-block min-w-max ${getStatusColor(material.status)}`}>
                          {material.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center align-middle">
                        <button className="text-gray-300 hover:text-black transition-colors inline-flex">
                          <HiOutlinePencil size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <HiOutlineClipboardList size={56} className="text-gray-400" />
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">No Raw Material Data Available</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {filteredMaterials.length > 0 && (
              <div className="px-8 py-6 border-t border-gray-100 flex justify-end items-center">
                <div className="flex justify-center items-center gap-2">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 text-gray-400 hover:text-black disabled:opacity-30 transition-colors">‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === page ? "bg-black text-white shadow-lg" : "text-gray-400 hover:bg-gray-100"}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 text-gray-400 hover:text-black disabled:opacity-30 transition-colors">›</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
