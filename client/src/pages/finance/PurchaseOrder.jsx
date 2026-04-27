import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  HiOutlineSearch, HiOutlinePencil, HiOutlineClipboardList,
  HiOutlinePhotograph, HiChevronLeft, HiChevronRight, HiX,
  HiOutlineCheck, HiCheckCircle, HiXCircle, HiOutlineDownload,
  HiOutlineTruck
} from 'react-icons/hi';
import { FaRegFilePdf } from 'react-icons/fa';

const AlertDialog = ({ alert, onClose }) => {
  if (!alert) return null;
  const isSuccess = alert.type === 'success';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.25)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 flex flex-col items-center text-center relative overflow-hidden"
        style={{ animation: 'popIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards' }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center mb-6 ${isSuccess ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          {isSuccess
            ? <HiCheckCircle size={44} className="text-emerald-500" />
            : <HiXCircle size={44} className="text-rose-500" />
          }
        </div>

        <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${isSuccess ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isSuccess ? 'Success' : 'Error'}
        </p>

        <p className="text-slate-800 font-bold text-lg leading-tight tracking-tight mb-8">
          {alert.message}
        </p>

        <div className="flex flex-col gap-2 w-full relative z-10">
          {isSuccess && alert.fileUrl && (
            <button
              onClick={() => { window.open(alert.fileUrl, '_blank'); onClose(); }}
              className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all bg-black hover:bg-stone-800 shadow-xl shadow-stone-200 flex items-center justify-center gap-2 active:scale-95"
            >
              <FaRegFilePdf size={14} /> View Receipt
            </button>
          )}

          <button
            onClick={onClose}
            className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]
              ${isSuccess
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-100'}`}
          >
            {isSuccess ? 'CLOSE' : 'GOT IT'}
          </button>
        </div>

        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-[0.06] ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        <div className={`absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-[0.04] ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)     translateY(0);    }
        }
      `}</style>
    </div>
  );
};

const DeliveryConfirmDialog = ({ open, order, onConfirm, onCancel }) => {
  if (!open || !order) return null;
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.3)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 flex flex-col items-center text-center relative overflow-hidden"
        style={{ animation: 'popIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-20 h-20 rounded-[1.75rem] flex items-center justify-center mb-6 bg-emerald-50">
          <HiOutlineTruck size={36} className="text-emerald-500" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2 text-emerald-500">
          Delivery Update
        </p>
        <p className="text-slate-800 font-black text-base leading-snug tracking-tight mb-1">
          Has PO-{order.assignment_id} been delivered?
        </p>
        <p className="text-slate-400 text-xs mb-8 font-bold leading-relaxed">
          Marking as delivered will update inventory stock. This cannot be undone.
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-4 border-2 border-slate-100 rounded-2xl text-slate-500 uppercase text-[11px] font-black hover:bg-slate-50 transition-all tracking-wider"
          >
            Not Yet
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 rounded-2xl uppercase text-[11px] font-black shadow-xl transition-all tracking-widest text-white bg-emerald-500 hover:bg-emerald-600 active:scale-[0.97] flex items-center justify-center gap-2"
          >
            <HiOutlineCheck size={14} /> Delivered
          </button>
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-[0.04] bg-emerald-500" />
      </div>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
};

const useAlert = () => {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((message, type = 'success', fileUrl = null, onFinish = null) => {
    setAlert({ message, type, fileUrl, onFinish });
  }, []);

  const closeAlert = useCallback(() => {
    if (!alert) return;

    const callback = alert.onFinish;
    setAlert(null);

    if (callback && typeof callback === 'function') {
      callback();
    }
  }, [alert]);

  return { alert, showAlert, closeAlert };
};

export default function PurchaseOrder({ onCompose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [currentPage, setCurrentPage] = useState(0);
  const [lowStockPage, setLowStockPage] = useState(0);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [userName, setUserName] = useState('');
  const [suggestedQty, setSuggestedQty] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, order: null });

  const { alert, showAlert, closeAlert } = useAlert();

  const itemsPerPage = 5;
  const lowStockPerPage = 4;
  const loggedInUserId = localStorage.getItem('user_id');

  const [formData, setFormData] = useState({
    supplier_id: '',
    material_id: '',
    ordered_quantity: '',
    status: 'Pending'
  });

  const fetchUserName = async () => {
    if (!loggedInUserId) { setUserName('Guest'); return; }
    try {
      const res = await axios.get(`http://localhost:5000/api/user/name/${loggedInUserId}`);
      setUserName(res.data.name || 'User');
    } catch { setUserName('User'); }
  };

  const fetchData = async () => {
    try {
      const [resOrders, resSuppliers, resMaterials] = await Promise.all([
        axios.get('http://localhost:5000/api/all_orders'),
        axios.get('http://localhost:5000/api/suppliers'),
        axios.get('http://localhost:5000/api/materials')
      ]);
      setOrders(resOrders.data || []);
      setSuppliers(resSuppliers.data || []);
      setMaterials(resMaterials.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); fetchUserName(); }, []);

  useEffect(() => {
    if (!materials.length) return;
    const params = new URLSearchParams(location.search);
    const materialIdFromQuery = params.get('material_id');
    if (!materialIdFromQuery) return;
    navigate(location.pathname, { replace: true });
    const mat = materials.find(m => parseInt(m.material_id) === parseInt(materialIdFromQuery));
    if (mat) {
      const suggested = Math.max(mat.reorder_threshold * 2 - mat.stock_quantity, mat.reorder_threshold);
      resetForm();
      setSuggestedQty(suggested);
      setFormData(prev => ({
        ...prev,
        material_id: String(mat.material_id),
        ordered_quantity: String(suggested),
        status: 'Pending'
      }));
      setShowModal(true);
    }
  }, [materials, location.search]);

  const activeSuppliers = suppliers.filter(s => s.status === 'Active');

  const lowStockMaterials = materials.filter(m => {
    const isLow = parseInt(m.stock_quantity) <= parseInt(m.reorder_threshold);
    const hasActivePO = orders.some(o =>
      parseInt(o.material_id) === parseInt(m.material_id) &&
      (o.status === 'Ongoing' || o.status === 'Pending')
    );
    return isLow && !hasActivePO;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-500';
      case 'Pending': return 'bg-amber-500';
      case 'Ongoing': return 'bg-blue-600';
      default: return 'bg-slate-400';
    }
  };

  const filteredOrders = orders.filter(order => {
    const sTerm = searchTerm.toLowerCase();
    const poString = `PO-${order.assignment_id}`.toLowerCase();
    const matchesSearch =
      poString.includes(sTerm) ||
      (order.supplier_name || '').toLowerCase().includes(sTerm) ||
      (order.material_name || '').toLowerCase().includes(sTerm) ||
      (order.requisitioner_name || '').toLowerCase().includes(sTerm);
    const matchesStatus = statusFilter === 'All Status' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const currentOrders = filteredOrders.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handleMarkDeliveredClick = (order) => {
    setConfirmDialog({ open: true, order });
  };

  const handleConfirmDelivered = async () => {
    const order = confirmDialog.order;
    setConfirmDialog({ open: false, order: null });
    try {
      await axios.patch(`http://localhost:5000/api/orders/receive/${order.assignment_id}`);
      fetchData();
      showAlert('Order marked as delivered!', 'success');
    } catch {
      showAlert('Failed to mark as delivered.', 'error');
    }
  };

  const generatePDFReceipt = async (order) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });

      doc.setFillColor(248, 248, 248);
      doc.rect(0, 0, 148, 210, 'F');

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(10, 10, 128, 190, 8, 8, 'F');

      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.roundedRect(10, 10, 128, 190, 8, 8, 'S');

      doc.setFillColor(15, 15, 15);
      doc.roundedRect(18, 18, 112, 48, 6, 6, 'F');

      const statusColor = order.status === 'Delivered'
        ? [16, 185, 129]
        : order.status === 'Ongoing'
          ? [37, 99, 235]
          : [245, 158, 11];

      doc.setFillColor(...statusColor);
      doc.circle(114, 24, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont(undefined, 'bold');
      doc.text('MATTHEW & MELKA', 22, 28);

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(5.5);
      doc.setFont(undefined, 'normal');
      doc.text('PURCHASE ORDER RECEIPT', 22, 34);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text(`PO-${order.assignment_id}`, 22, 52);

      doc.setTextColor(...statusColor);
      doc.setFontSize(6);
      doc.setFont(undefined, 'bold');
      doc.text(order.status.toUpperCase(), 22, 60);

      let y = 80;

      const drawField = (label, value) => {
        doc.setTextColor(160, 160, 160);
        doc.setFontSize(6);
        doc.setFont(undefined, 'normal');
        doc.text(label, 22, y);

        doc.setTextColor(15, 15, 15);
        doc.setFontSize(8.5);
        doc.setFont(undefined, 'bold');
        const truncated = (value || '—').length > 28 ? (value || '—').substring(0, 28) + '…' : (value || '—');
        doc.text(truncated, 22, y + 6);

        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.2);
        doc.line(18, y + 11, 130, y + 11);

        y += 18;
      };

      drawField('DATE ISSUED', order.order_date
        ? new Date(order.order_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—');
      drawField('REQUISITIONER', order.requisitioner_name || 'Admin');
      drawField('SUPPLIER', order.supplier_name || '—');
      drawField('MATERIAL', order.material_name || '—');
      drawField('QUANTITY ORDERED', `${order.ordered_quantity} units`);

      y += 2;
      doc.setFillColor(15, 15, 15);
      doc.roundedRect(18, y, 112, 24, 5, 5, 'F');

      doc.setTextColor(120, 120, 120);
      doc.setFontSize(6);
      doc.setFont(undefined, 'normal');
      doc.text('TOTAL AMOUNT', 24, y + 9);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont(undefined, 'bold');
      doc.text(
        `₱${Number(order.total_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        128, y + 16,
        { align: 'right' }
      );

      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.line(18, 188, 130, 188);

      doc.setTextColor(190, 190, 190);
      doc.setFontSize(5.5);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Printed ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}  ·  Matthew & Melka Inventory System`,
        74, 194,
        { align: 'center' }
      );

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      showAlert('Receipt generated successfully!', 'success', url);
    } catch {
      showAlert('Failed to generate receipt.', 'error');
    }
  };

  const handleEditClick = (order) => {
    setIsEdit(true);
    setSelectedOrderId(order.assignment_id);
    setSuggestedQty(null);
    setFormData({
      supplier_id: order.supplier_id || '',
      material_id: order.material_id || '',
      ordered_quantity: order.ordered_quantity || '',
      status: order.status || 'Ongoing',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const qtyToOrder = formData.ordered_quantity;
    const selectedSup = suppliers.find(s => Number(s.supplier_id) === Number(formData.supplier_id));
    const selectedMat = materials.find(m => Number(m.material_id) === Number(formData.material_id));

    try {
      if (isEdit) {
        await axios.put(`http://localhost:5000/api/orders/${selectedOrderId}`, { ...formData, user_id: loggedInUserId });
        setShowModal(false);
        await fetchData();
        showAlert('Order updated successfully!', 'success');
      } else {
        const response = await axios.post('http://localhost:5000/api/create_order', {
          ...formData,
          user_id: loggedInUserId,
          status: 'Ongoing'
        });

        const assignmentId = response.data?.assignment_id || 'New';

        setShowModal(false);
        await fetchData();

        if (onCompose && selectedSup?.email) {
          onCompose({
            to: selectedSup.email,
            subject: `Purchase Order Request #PO-${assignmentId}`,
            body: `Dear ${selectedSup.name},\n\nWe would like to place a purchase order for:\n\nOrder ID: PO-${assignmentId}\nMaterial: ${selectedMat?.material_name || 'N/A'}\nQuantity: ${qtyToOrder}\n\nPlease confirm receipt of this order.\n\nBest regards,\n${userName}\nMatthew & Melka`
          });
        }
      }
      resetForm();
    } catch (err) {
      console.error(err);
      showAlert('Failed to process order.', 'error');
    }
  };

  const resetForm = () => {
    setIsEdit(false);
    setSelectedOrderId(null);
    setSuggestedQty(null);
    setFormData({ supplier_id: '', material_id: '', ordered_quantity: '', status: 'Pending' });
  };

  return (
    <div className="w-full flex flex-col font-sans antialiased text-slate-900 text-left">
      <AlertDialog alert={alert} onClose={closeAlert} />
      <DeliveryConfirmDialog
        open={confirmDialog.open}
        order={confirmDialog.order}
        onConfirm={handleConfirmDelivered}
        onCancel={() => setConfirmDialog({ open: false, order: null })}
      />

      <div className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search records..."
            className="w-full bg-[#F8F9FA] border-none rounded-2xl py-3 sm:py-3.5 pl-12 pr-4 outline-none font-bold text-slate-700 text-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
          />
        </div>
        <select
          className="bg-[#F8F9FA] border-none rounded-2xl py-3 sm:py-3.5 px-4 sm:px-6 font-bold text-slate-600 outline-none cursor-pointer text-xs uppercase tracking-wider"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
        >
          <option>All Status</option>
          <option>Pending</option>
          <option>Ongoing</option>
          <option>Delivered</option>
        </select>
      </div>

      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-5 sm:p-8 mb-6 sm:mb-8">
        <div className="flex justify-between items-center mb-6 sm:mb-8 px-1 sm:px-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 leading-none tracking-tighter">Restock Queue</h1>
              {lowStockMaterials.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {lowStockMaterials.length} Critical
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Materials requiring immediate replenishment</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLowStockPage(p => Math.max(p - 1, 0))} disabled={lowStockPage === 0} className="p-2 rounded-full border disabled:opacity-30 hover:bg-slate-100 transition-all"><HiChevronLeft size={18} /></button>
            <button onClick={() => setLowStockPage(p => p + 1)} disabled={lowStockPage >= Math.ceil(lowStockMaterials.length / lowStockPerPage) - 1} className="p-2 rounded-full border disabled:opacity-30 hover:bg-slate-100 transition-all"><HiChevronRight size={18} /></button>
          </div>
        </div>

        {lowStockMaterials.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
            <HiOutlineClipboardList size={40} className="text-slate-200 mb-2" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Inventory is healthy. No low stock materials.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {lowStockMaterials.slice(lowStockPage * lowStockPerPage, (lowStockPage + 1) * lowStockPerPage).map(m => {
              const suggested = Math.max(m.reorder_threshold * 2 - m.stock_quantity, m.reorder_threshold);
              return (
                <div key={m.material_id} className="border border-gray-200 rounded-[2rem] p-4 bg-white shadow-sm flex flex-col hover:shadow-md transition-all text-left">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-rose-600 text-[9px] font-black uppercase">Low</span>
                    </div>
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border bg-slate-50 flex items-center justify-center shadow-sm">
                      {m.material_image ? <img src={m.material_image} className="w-full h-full object-cover" alt="" /> : <HiOutlinePhotograph size={20} className="text-slate-200" />}
                    </div>
                  </div>
                  <div className="mb-1 w-full">
                    <p className="font-black text-sm text-slate-900 leading-tight truncate uppercase">{m.material_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{m.unique_code}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 my-3 text-[10px] font-black uppercase text-slate-500 tracking-tighter">
                    Current: <span className="text-rose-500">{m.stock_quantity}</span>
                    {m.stock_unit && <span className="text-slate-400 ml-1 normal-case font-bold">{m.stock_unit}</span>}
                    {' '}/ Min: {m.reorder_threshold}
                    {m.stock_unit && <span className="text-slate-400 ml-1 normal-case font-bold">{m.stock_unit}</span>}
                  </div>
                  <button
                    onClick={() => {
                      resetForm();
                      setSuggestedQty(suggested);
                      setFormData(prev => ({
                        ...prev,
                        material_id: String(m.material_id),
                        ordered_quantity: String(suggested),
                        status: 'Pending'
                      }));
                      setShowModal(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-black text-white text-[9px] font-black uppercase tracking-wider hover:bg-stone-800 transition-all mt-auto shadow-md flex items-center justify-center gap-2"
                  >
                    Create Purchase Order
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-5 sm:p-8 flex flex-col mb-10">
        <div className="flex justify-between items-center mb-6 sm:mb-10 px-1 sm:px-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase text-slate-900 leading-none tracking-tighter">Procurement List</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Active and Completed POs</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 0))} disabled={currentPage === 0} className="p-2 rounded-full border disabled:opacity-30 hover:bg-slate-100 transition-all"><HiChevronLeft size={18} /></button>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(filteredOrders.length / itemsPerPage) - 1} className="p-2 rounded-full border disabled:opacity-30 hover:bg-slate-100 transition-all"><HiChevronRight size={18} /></button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
          <table className="w-full text-center border-separate border-spacing-y-1.5 min-w-[700px]" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '90px' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '70px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '200px' }} />
            </colgroup>
            <thead>
              <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b">
                <th className="pb-4 text-left pl-4">PO ID</th>
                <th className="pb-4 text-left">Supplier</th>
                <th className="pb-4 text-left">Material</th>
                <th className="pb-4 text-center">Qty</th>
                <th className="pb-4 text-right pr-6">Total Cost</th>
                <th className="pb-4 text-left">Requisitioner</th>
                <th className="pb-4 text-left">Status</th>
                <th className="pb-4 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="font-bold text-slate-700">
              {currentOrders.length > 0 ? currentOrders.map((order) => {
                const isDelivered = order.status === 'Delivered';
                const mat = materials.find(m => parseInt(m.material_id) === parseInt(order.material_id));
                return (
                  <tr key={order.assignment_id} className="hover:bg-slate-50 transition-all group">
                    <td className="py-2.5 pl-4 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100 text-sm font-black text-slate-900 uppercase text-left">PO-{order.assignment_id}</td>
                    <td className="py-2.5 border-y border-transparent group-hover:border-slate-100 text-left">
                      <span className="block truncate max-w-[120px] uppercase text-xs" title={order.supplier_name}>{order.supplier_name || 'N/A'}</span>
                    </td>
                    <td className="py-2.5 border-y border-transparent group-hover:border-slate-100 text-left">
                      <span className="block truncate max-w-[120px] uppercase text-xs" title={order.material_name}>{order.material_name || 'N/A'}</span>
                    </td>
                    <td className="py-2.5 border-y border-transparent group-hover:border-slate-100 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-slate-700">{order.ordered_quantity ?? '—'}</span>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{mat?.stock_unit || '---'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 border-y border-transparent group-hover:border-slate-100 text-right pr-6">
                      <span className="text-sm font-black text-emerald-600">
                        {order.total_amount != null ? `₱${Number(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'}
                      </span>
                    </td>
                    <td className="py-2.5 border-y border-transparent group-hover:border-slate-100 text-left">
                      <span className="block truncate max-w-[100px] text-[10px] font-black text-slate-400 uppercase" title={order.requisitioner_name}>
                        {order.requisitioner_name || 'Admin'}
                      </span>
                    </td>
                    <td className="py-2.5 border-y border-transparent group-hover:border-slate-100 text-left">
                      <span className={`px-4 py-1.5 rounded-full text-[8px] uppercase font-black text-white shadow-sm ${getStatusStyle(order.status)}`}>
                        {order.status === 'Approved' ? 'Ongoing' : order.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right pr-4 rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100">
                      <div className="flex justify-end gap-2">
                        {isDelivered && (
                          <button
                            onClick={() => generatePDFReceipt(order)}
                            title="Download Receipt PDF"
                            className="p-2.5 bg-slate-50 text-slate-400 hover:bg-black hover:text-white rounded-xl transition-all border border-slate-200 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-3"
                          >
                            <FaRegFilePdf size={13} />
                            <span>Receipt</span>
                          </button>
                        )}
                        {order.status === 'Ongoing' && (
                          <button
                            onClick={() => handleMarkDeliveredClick(order)}
                            title="Mark as Delivered"
                            className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 rounded-xl transition-all text-[10px] font-black uppercase tracking-wide shadow-md shadow-emerald-100"
                          >
                            <HiOutlineTruck size={14} />
                            <span>Delivered?</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleEditClick(order)}
                          disabled={isDelivered}
                          className={`p-3 bg-white text-slate-300 hover:text-black hover:shadow-md rounded-2xl transition-all border border-slate-100 ${isDelivered ? 'opacity-20 cursor-not-allowed' : ''}`}
                        >
                          <HiOutlinePencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="8" className="py-20 text-center opacity-20 font-black uppercase tracking-widest text-slate-400 text-xs">No active orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-4 sm:p-6 text-left">
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-2xl p-6 sm:p-12 relative shadow-2xl text-left max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setShowModal(false); resetForm(); }} className="absolute top-6 right-6 sm:top-10 sm:right-10 text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full"><HiX size={24} /></button>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase mb-2 tracking-tighter leading-none">Execute Order</h2>
            <p className="text-xs text-slate-400 mb-6 sm:mb-8 font-black uppercase tracking-widest">Processing for: <span className="text-black">{userName}</span></p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-bold">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Supplier</label>
                  <select required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-black text-sm" value={formData.supplier_id} onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}>
                    <option value="">Select Supplier...</option>
                    {activeSuppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Raw Material</label>
                  <div className="w-full bg-slate-100 rounded-2xl p-4 font-bold text-sm text-slate-400 cursor-not-allowed border border-slate-200 truncate">
                    {materials.find(m => parseInt(m.material_id) === parseInt(formData.material_id))?.material_name || '—'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 font-bold">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">
                    Quantity {suggestedQty !== null && (
                      <span className="text-amber-500 normal-case font-bold tracking-normal">(suggested: {suggestedQty})</span>
                    )}
                    {(() => {
                      const mat = materials.find(m => parseInt(m.material_id) === parseInt(formData.material_id));
                      return mat?.stock_unit ? <span className="text-slate-400 normal-case font-bold tracking-normal ml-1">· {mat.stock_unit}</span> : null;
                    })()}
                  </label>
                  <input type="number" min="1" step="1" required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-bold text-sm" value={formData.ordered_quantity} onChange={e => setFormData({ ...formData, ordered_quantity: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-4 pt-4 justify-end">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-8 sm:px-10 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-[11px] font-black hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="px-10 sm:px-12 py-4 bg-black text-white rounded-2xl uppercase text-[11px] font-black shadow-xl hover:bg-stone-800 transition-all tracking-widest">Confirm & Process</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}