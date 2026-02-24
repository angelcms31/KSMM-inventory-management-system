import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import { HiXMark, HiPhoto } from "react-icons/hi2";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function AddProductModal({ product, onClose, fetchProducts }) {
  const [step, setStep] = useState(1);
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef(null);

  const [formData, setFormData] = useState({
    sku: '', name: '', brand: '', collection: '',
    category: '', location: '', quantity: '',
    min_stocks: '', selling_price: '', product_image: ''
  });

  const initialCollections = [
    "Summer Breeze", "Midnight Luxe", "Golden Hour",
    "Oceanic", "Matthew & Melka Classic", "Ken Samudio Signature"
  ];

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        brand: product.brand || '',
        collection: product.collection || '',
        category: product.category || '',
        location: product.warehouse_location || product.location || '',
        quantity: product.current_stock || '',
        min_stocks: product.min_stocks || '',
        selling_price: product.selling_price || '',
        product_image: product.product_image || ''
      });
      setShowQR(true);
    }
  }, [product]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, product_image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleGoToQR = () => {
    if (!formData.sku || !formData.name) {
      alert("Please enter at least the Product Name and SKU.");
      return;
    }
    setStep(2);
  };

  const handleGenerateCode = () => {
    setShowQR(true);
  };

  const generatePDF = async () => {
    if (!qrRef.current) return;
    try {
      const canvas = await html2canvas(qrRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      pdf.setFontSize(20);
      pdf.text("PRODUCT QR CODE", 105, 20, { align: "center" });
      pdf.addImage(imgData, "PNG", 75, 30, 60, 60);
      
      pdf.setFontSize(14);
      pdf.text(`Product Name: ${formData.name}`, 20, 105);
      pdf.text(`SKU: ${formData.sku}`, 20, 115);
      pdf.text(`Category: ${formData.category || "N/A"}`, 20, 125);
      
      pdf.save(`QR_${formData.sku}.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
    }
  };

  const handleSaveOnly = async () => {
    try {
      let response;
      if (product) {
        response = await axios.put(`http://localhost:5000/api/products/${product.sku}`, formData);
      } else {
        response = await axios.post("http://localhost:5000/api/sales_Add_inventory", formData);
      }

      if (response.status === 200) {
        alert(product ? "Updated successfully!" : "Saved successfully!");
        fetchProducts();
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.response?.data || "Server error"));
    }
  };

  const handleSaveAndPrint = async () => {
    try {
      let response;
      if (product) {
        response = await axios.put(`http://localhost:5000/api/products/${product.sku}`, formData);
      } else {
        response = await axios.post("http://localhost:5000/api/sales_Add_inventory", formData);
      }

      if (response.status === 200) {
        await generatePDF();
        fetchProducts();
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.response?.data || "Server error"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in duration-300 font-sans">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm">
          <HiXMark size={24} />
        </button>

        {step === 1 ? (
          <div className="space-y-6">
            <header className="mb-8">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
                {product ? "Update Record" : "Add Product"}
              </h2>
            </header>

            <div className="flex flex-col items-center mb-10">
              <div className="w-36 h-36 rounded-[2.5rem] border-4 border-white shadow-xl flex items-center justify-center bg-slate-50 overflow-hidden relative group transition-all ring-1 ring-slate-100">
                {formData.product_image ? (
                  <img src={formData.product_image} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <HiPhoto size={48} className="text-slate-200" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <p className="text-white text-[10px] font-black uppercase tracking-widest text-center px-2">Upload Image</p>
                </div>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Product Name</label>
                  <input className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent focus:border-slate-200 font-bold transition-all text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">SKU Code</label>
                  <input className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent focus:border-slate-200 font-bold transition-all text-sm" placeholder="SKU-001" value={formData.sku} readOnly={!!product} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Category</label>
                  <select className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent focus:border-slate-200 font-bold transition-all text-sm" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option value="">Choose Category...</option>
                    <option value="Shirt">Shirt</option>
                    <option value="Accessory">Accessory</option>
                    <option value="Jewelry">Jewelry</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Collection</label>
                  <select className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent focus:border-slate-200 font-bold transition-all text-sm" value={formData.collection} onChange={e => setFormData({ ...formData, collection: e.target.value })}>
                    <option value="">Choose Collection...</option>
                    {initialCollections.map((col, i) => <option key={i} value={col}>{col}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Storage Location</label>
                  <select className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent focus:border-slate-200 font-bold transition-all text-sm" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}>
                    <option value="">Select Warehouse...</option>
                    <option value="Central Warehouse">Central Warehouse</option>
                    <option value="North Warehouse">North Warehouse</option>
                    <option value="South Warehouse">South Warehouse</option>
                    <option value="West Warehouse">West Warehouse</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Brand</label>
                  <input className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent focus:border-slate-200 font-bold transition-all text-sm" placeholder="Brand Name" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Quantity</label>
                  <input className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent focus:border-slate-200 font-bold transition-all text-sm" type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Min Threshold</label>
                  <input className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent focus:border-slate-200 font-bold transition-all text-sm" type="number" value={formData.min_stocks} onChange={e => setFormData({ ...formData, min_stocks: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Unit Price</label>
                  <input className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent focus:border-slate-200 font-bold transition-all text-sm" type="number" value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 justify-end">
              <button onClick={onClose} className="px-10 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-[11px] font-black hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleGoToQR} className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-stone-800 transition-all active:scale-95">Generate QR</button>
              <button onClick={handleSaveOnly} className="bg-[#10B981] text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all active:scale-95">
                {product ? "Update Only" : "Save Only"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <header>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-tight">Product Identity</h2>
              <p className="text-slate-400 font-bold mt-1 tracking-tight">System generated QR identification.</p>
            </header>
            
            <div className="flex gap-10 items-start">
              <div ref={qrRef} className="p-8 bg-white border-4 border-slate-900 rounded-[2.5rem] shadow-2xl shrink-0">
                {showQR ? <QRCode value={formData.sku} size={200} /> : <div className="w-48 h-48 bg-slate-50 flex items-center justify-center text-slate-300 font-black uppercase tracking-widest text-[10px]">QR Preview</div>}
              </div>
              <div className="flex-1 space-y-6 min-w-0 max-w-md overflow-hidden pt-4">
                <div className="space-y-2 min-w-0">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Verified Product Name</label>
                  <div className="bg-slate-50 p-4 rounded-2xl font-black text-slate-900 border border-slate-100 overflow-hidden shadow-sm">
                    <p className="truncate text-sm uppercase" title={formData.name}>{formData.name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 min-w-0">
                  <div className="space-y-2 min-w-0 overflow-hidden">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">SKU Code</label>
                    <div className="bg-slate-50 p-4 rounded-2xl font-black text-slate-900 border border-slate-100 overflow-hidden shadow-sm text-center">
                      <p className="truncate text-xs uppercase" title={formData.sku}>{formData.sku}</p>
                    </div>
                  </div>
                  <div className="space-y-2 min-w-0 overflow-hidden">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Category Tag</label>
                    <div className="bg-slate-50 p-4 rounded-2xl font-black text-slate-900 border border-slate-100 overflow-hidden shadow-sm text-center">
                      <p className="truncate text-xs uppercase" title={formData.category}>{formData.category || "---"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 min-w-0">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Assigned Storage</label>
                  <div className="bg-slate-50 p-4 rounded-2xl font-black text-slate-400 border border-slate-100 overflow-hidden shadow-sm italic">
                    <p className="truncate text-xs uppercase" title={formData.location}>{formData.location || "---"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-10 border-t border-slate-100">
              <button onClick={handleGenerateCode} className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:scale-105 transition-all">Regenerate Code</button>
              <div className="flex-1 flex justify-end gap-4 items-center">
                <button onClick={() => setStep(1)} className="font-black text-slate-400 uppercase text-[11px] px-8 py-4 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">Back to Edit</button>
                <button onClick={handleSaveAndPrint} className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] shadow-2xl hover:bg-emerald-600 active:scale-95 transition-all tracking-widest italic">Print PDF & Save Record</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}