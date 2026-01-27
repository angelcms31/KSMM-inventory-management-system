import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import { HiX, HiCamera } from "react-icons/hi";
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
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in duration-300 font-sans text-sm">
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-300 hover:text-black transition-all">
          <HiX size={24} />
        </button>

        {step === 1 ? (
          <div className="space-y-6">
            <header>
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
                {product ? "Update Product" : "Add New Product"}
              </h2>
              <p className="text-gray-400 text-sm font-bold tracking-tight">
                {product ? "Update existing product details." : "Enter the details for the new product."}
              </p>
            </header>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Product Image</label>
                <div className="border-2 border-dashed border-gray-100 rounded-xl p-4 flex items-center justify-center bg-gray-50/50 min-h-[100px]">
                  {formData.product_image ? (
                    <img src={formData.product_image} className="h-20 w-20 object-cover rounded-lg shadow-md" alt="Preview" />
                  ) : (
                    <label className="cursor-pointer flex items-center gap-2 text-gray-400 font-bold hover:text-black transition-all">
                      <HiCamera size={20} /> Upload image
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input className="bg-gray-50 border border-gray-100 rounded-xl p-3 font-bold outline-none" placeholder="Product Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                <input className="bg-gray-50 border border-gray-100 rounded-xl p-3 font-bold outline-none" placeholder="SKU" value={formData.sku} readOnly={!!product} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select className="bg-gray-50 border border-gray-100 rounded-xl p-3 font-bold text-gray-400 outline-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="">Select Category</option>
                  <option value="Shirt">Shirt</option>
                  <option value="Accessory">Accessory</option>
                  <option value="Jewelry">Jewelry</option>
                </select>
                <select className="bg-gray-50 border border-gray-100 rounded-xl p-3 font-bold text-gray-400 outline-none" value={formData.collection} onChange={e => setFormData({ ...formData, collection: e.target.value })}>
                  <option value="">Select Collection</option>
                  {initialCollections.map((col, i) => <option key={i} value={col}>{col}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <select className="bg-gray-50 border border-gray-100 rounded-xl p-3 font-bold text-gray-400 outline-none" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}>
                  <option value="">Select Location</option>
                  <option value="Central Warehouse">Central Warehouse</option>
                  <option value="North Warehouse">North Warehouse</option>
                  <option value="South Warehouse">South Warehouse</option>
                  <option value="West Warehouse">West Warehouse</option>
                </select>
                <input className="bg-gray-50 border border-gray-100 rounded-xl p-3 font-bold outline-none" placeholder="Brand" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <input className="bg-gray-50 border border-gray-100 rounded-xl p-3 font-bold outline-none" placeholder="Stock" type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                <input className="bg-gray-50 border border-gray-100 rounded-xl p-3 font-bold outline-none" placeholder="Min Stock" type="number" value={formData.min_stocks} onChange={e => setFormData({ ...formData, min_stocks: e.target.value })} />
                <input className="bg-gray-50 border border-gray-100 rounded-xl p-3 font-bold outline-none" placeholder="Price" type="number" value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={handleGoToQR} className="bg-[#262221] text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all active:scale-95">Generate QR</button>
              <div className="flex-1 flex justify-end gap-3">
                <button onClick={onClose} className="font-bold text-gray-400 text-sm hover:text-black">Cancel</button>
                <button onClick={handleSaveOnly} className="bg-stone-800 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] active:scale-95">
                  {product ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Product QR</h2>
            <div className="flex gap-10 items-start">
              <div ref={qrRef} className="p-6 bg-white border-2 border-gray-900 rounded-lg shadow-inner shrink-0">
                {showQR ? <QRCode value={formData.sku} size={200} /> : <div className="w-48 h-48 bg-gray-50 flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-[10px]">QR Preview</div>}
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Product Name</label>
                  <p className="bg-gray-50 p-3 rounded-xl font-bold text-gray-800 border border-gray-100 min-h-[45px]">{formData.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">SKU</label>
                    <p className="bg-gray-50 p-3 rounded-xl font-bold text-gray-800 border border-gray-100">{formData.sku}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Category</label>
                    <p className="bg-gray-50 p-3 rounded-xl font-bold text-gray-800 border border-gray-100">{formData.category || "---"}</p>
                  </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Location</label>
                    <p className="bg-gray-50 p-3 rounded-xl font-bold text-gray-800 border border-gray-100">{formData.location || "---"}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-6 border-t">
              <button onClick={handleGenerateCode} className="bg-[#262221] text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black">Generate Code</button>
              <div className="flex-1 flex justify-end gap-3 items-center">
                <button onClick={() => setStep(1)} className="font-bold text-gray-400 text-sm border px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-all">Back</button>
                <button onClick={handleSaveAndPrint} className="bg-stone-800 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all">Print PDF & Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}