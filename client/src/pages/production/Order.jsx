import React, { useState, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineFilter, HiOutlinePencil, HiOutlineClipboardList } from 'react-icons/hi';

export default function Order() {
  const [userName, setUserName] = useState("User");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) setUserName(savedName);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Received": return "bg-green-500";
      case "Pending": return "bg-yellow-500";
      case "Approved": return "bg-blue-600";
      case "Draft": return "bg-gray-500";
      default: return "bg-gray-400";
    }
  };

  const filteredOrders = orders.filter(order => 
    order.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.material?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIdx, startIdx + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#FBFBFB] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <div className="px-10 pt-10 pb-6 bg-white">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Purchase Orders</h1>
          <p className="text-sm text-gray-400 font-medium">Manage procurement and supplier orders efficiently</p>
        </div>

        <div className="px-10 py-6 bg-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <HiOutlineSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="text"
                placeholder="Search by PO#, Supplier, or Material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm font-medium"
              />
            </div>
            <button className="bg-black text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-sm">
              + Create PO
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-10 py-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Company Order</h3>
                  <p className="text-sm font-bold text-gray-900">No active company orders</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-xl text-gray-300"><HiOutlineClipboardList size={20}/></div>
              </div>
              <div className="bg-[#F9FAFB] rounded-2xl p-6 text-center border border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Waiting for new procurement</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Customer Order</h3>
                  <p className="text-sm font-bold text-gray-900">No active customer orders</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-xl text-gray-300"><HiOutlineClipboardList size={20}/></div>
              </div>
              <div className="bg-[#F9FAFB] rounded-2xl p-6 text-center border border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Awaiting customer requests</p>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-[#FCFCFC]">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Purchase Orders List</h3>
              <button className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors">
                <HiOutlineFilter size={14} /> Filter
              </button>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">PO #</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Supplier</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Material</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Order Date</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Requisitioner</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-[#FBFBFB] transition-all">
                      <td className="px-8 py-5 text-sm text-gray-900 font-black tracking-tight">{order.poNumber}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium">{order.supplier}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium">{order.material}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium">{order.orderDate}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium">{order.requisitioner}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-tighter ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-gray-300 hover:text-black transition-colors">
                          <HiOutlinePencil size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <HiOutlineClipboardList size={56} className="text-gray-400" />
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">No Purchase Orders Found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="flex justify-center items-center gap-2 mt-8">
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
          )}
        </div>
      </div>
    </div>
  );
}