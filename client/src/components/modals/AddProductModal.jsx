import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { HiXMark, HiPhoto, HiQrCode, HiPrinter, HiCheckCircle, HiXCircle } from "react-icons/hi2";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";

const UNIT_OPTIONS = [
  { value: "", label: "---" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "cm", label: "Centimeters (cm)" },
  { value: "inches", label: "Inches (in)" },
  { value: "meters", label: "Meters (m)" },
  { value: "mm", label: "Millimeters (mm)" },
  { value: "yards", label: "Yards (yd)" },
  { value: "grams", label: "Grams (g)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "liters", label: "Liters (L)" },
  { value: "ml", label: "Milliliters (mL)" },
  { value: "rolls", label: "Rolls" },
  { value: "sheets", label: "Sheets" },
  { value: "pairs", label: "Pairs" },
];

const AlertDialog = ({ alert, onClose }) => {
  if (!alert) return null;
  const isSuccess = alert.type === "success";
  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.25)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 flex flex-col items-center text-center relative overflow-hidden"
        style={{ animation: "popIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards" }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center mb-6 ${isSuccess ? "bg-emerald-50" : "bg-rose-50"}`}>
          {isSuccess
            ? <HiCheckCircle size={44} className="text-emerald-500" />
            : <HiXCircle size={44} className="text-rose-500" />}
        </div>
        <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2 ${isSuccess ? "text-emerald-500" : "text-rose-500"}`}>
          {isSuccess ? "Success" : "Error"}
        </p>
        <p className="text-slate-800 font-black text-lg leading-snug tracking-tight mb-8">{alert.message}</p>
        <button
          onClick={onClose}
          className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg ${isSuccess ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200" : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"}`}
        >
          Got it
        </button>
        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-[0.06] ${isSuccess ? "bg-emerald-500" : "bg-rose-500"}`} />
        <div className={`absolute -top-6 -left-6 w-24 h-24 rounded-full opacity-[0.04] ${isSuccess ? "bg-emerald-500" : "bg-rose-500"}`} />
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.88) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
};

const useAlert = () => {
  const [alert, setAlert] = useState(null);
  const showAlert = useCallback((message, type = "success") => setAlert({ message, type }), []);
  const closeAlert = useCallback(() => setAlert(null), []);
  return { alert, showAlert, closeAlert };
};

export default function AddProductModal({ product, products = [], fetchProducts, onClose }) {
  const isEdit = !!(product && product.sku && !product.isNew);
  const qrRef = useRef();
  const skuRef = useRef(product?.sku || "");

  const [view, setView] = useState("info");
  const [form, setForm] = useState({
    sku: product?.sku || "",
    name: "",
    collection: "",
    brand: "",
    selling_price: "",
    location: "",
    category: "",
    quantity: "",
    min_stocks: "",
    stock_unit: "",
    product_image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [errors, setErrors] = useState({});
  const { alert, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    axios.get("http://localhost:5000/api/warehouses").then(res => {
      setWarehouses(res.data || []);
    });
  }, []);

  useEffect(() => {
    if (product && isEdit) {
      skuRef.current = product.sku;
      setForm({
        sku: product.sku,
        name: product.name || "",
        collection: product.collection || "",
        brand: product.brand || "",
        selling_price: product.selling_price || "",
        location: product.warehouse_location || product.location || "",
        category: product.category || "",
        quantity: product.current_stock || product.quantity || "",
        min_stocks: product.min_stocks || "",
        stock_unit: product.stock_unit || "",
        product_image: product.product_image || null,
      });
      setImagePreview(product.product_image || null);
    }
  }, [product, isEdit]);

  const isDuplicateName = (value) => {
    const normalized = value.toLowerCase().replace(/\s/g, "");
    return products.some(p => {
      const existing = (p.name || "").toLowerCase().replace(/\s/g, "");
      if (isEdit) return existing === normalized && p.sku !== product.sku;
      return existing === normalized;
    });
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, name: value }));
    setErrors(prev => ({ ...prev, name: "" }));
    if (!value.trim()) { setNameError(""); return; }
    setNameError(isDuplicateName(value) ? "A product with this name already exists." : "");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setForm(prev => ({ ...prev, product_image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePositiveNumberChange = (field) => (e) => {
    const value = e.target.value;
    if (value === "" || parseFloat(value) >= 0) {
      setForm(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Product Name is required.";
    else if (isDuplicateName(form.name)) e.name = "A product with this name already exists.";
    if (!form.location) e.location = "Storage Location is required.";
    if (form.min_stocks === "" || form.min_stocks === null) e.min_stocks = "Min Threshold is required.";
    setErrors(e);
    if (e.name) setNameError(e.name);
    return Object.keys(e).length === 0;
  };

  const handleGenerateQR = () => {
    if (validate()) setView("qr");
  };

  const handleShowQR = () => {
    if (validate()) setView("qr");
  };

  const downloadPDF = async () => {
    const sku = skuRef.current;
    const qrCanvas = qrRef.current?.querySelector("canvas");
    if (!qrCanvas) return;
    const qrDataUrl = qrCanvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const cardX = 20, cardY = 20, cardW = pageW - 40, cardH = 120, radius = 6;

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(220, 220, 230);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(cardX, cardY, cardW, cardH, radius, radius, "FD");
    pdf.setFillColor(15, 15, 15);
    pdf.roundedRect(cardX, cardY, cardW, 14, radius, radius, "F");
    pdf.setFillColor(15, 15, 15);
    pdf.rect(cardX, cardY + 8, cardW, 6, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text("QR IDENTIFICATION CARD", cardX + cardW / 2, cardY + 9, { align: "center" });

    const qrSize = 52, qrX = cardX + 8, qrY = cardY + 20;
    pdf.setFillColor(248, 248, 250);
    pdf.setDrawColor(230, 230, 235);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 3, 3, "FD");
    pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    const infoX = qrX + qrSize + 10;
    const infoW = cardX + cardW - infoX - 6;

    const drawField = (label, value, x, y, w) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6);
      pdf.setTextColor(160, 160, 175);
      pdf.text(label.toUpperCase(), x + 2, y);
      pdf.setFillColor(248, 248, 250);
      pdf.setDrawColor(235, 235, 240);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(x, y + 1.5, w, 8, 1.5, 1.5, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(20, 20, 30);
      const clipped = pdf.splitTextToSize(value || "—", w - 4);
      pdf.text(clipped[0], x + 3, y + 7);
    };

    drawField("Product Name", (form.name || "").toUpperCase(), infoX, qrY + 2, infoW);
    drawField("SKU", sku, infoX, qrY + 18, infoW);
    drawField("Category", (form.category || "---").toUpperCase(), infoX, qrY + 34, infoW);

    const priceText = `PHP ${parseFloat(form.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    const halfW = (infoW - 3) / 2;
    drawField("Price", priceText, infoX, qrY + 50, halfW);
    drawField("Location", (form.location || "---").toUpperCase(), infoX + halfW + 3, qrY + 50, halfW);

    const footerY = cardY + cardH - 10;
    pdf.setFillColor(248, 248, 250);
    pdf.rect(cardX, footerY, cardW, 10, "F");
    pdf.setDrawColor(220, 220, 230);
    pdf.setLineWidth(0.3);
    pdf.line(cardX, footerY, cardX + cardW, footerY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.setTextColor(170, 170, 185);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, cardX + 4, footerY + 6);
    pdf.setFont("helvetica", "bold");
    pdf.text("INVENTORY SYSTEM", cardX + cardW - 4, footerY + 6, { align: "right" });
    pdf.save(`QR_${form.name || sku}.pdf`);
  };

  const handleSaveRecord = async () => {
    const sku = skuRef.current;
    if (!sku) { showAlert("SKU is missing. Please close and try again.", "error"); return; }

    setSubmitting(true);

    try {
      const payload = {
        sku,
        name: form.name,
        collection: form.collection || "",
        brand: form.brand || "",
        selling_price: parseFloat(form.selling_price) || 0,
        location: form.location,
        category: form.category || "",
        quantity: parseInt(form.quantity) || 0,
        min_stocks: parseInt(form.min_stocks) || 0,
        stock_unit: form.stock_unit || "",
        product_image: form.product_image || null,
      };

      if (isEdit) {
        await axios.put(`http://localhost:5000/api/products/${sku}`, payload);
      } else {
        await axios.post("http://localhost:5000/api/sales_Add_inventory", payload);
      }

      if (view === "qr") {
        await downloadPDF();
      }

      await fetchProducts();
      showAlert(isEdit ? "Product updated successfully!" : "Product added successfully!", "success");
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      const msg = err.response?.data || err.message;
      showAlert("Save failed: " + msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = "w-full bg-slate-50 border rounded-xl p-3 outline-none font-bold text-xs focus:ring-2 focus:ring-black/5 transition-all truncate";
  const inputClass = (field) => `${inputBase} ${errors[field] ? "border-red-300 bg-red-50/30" : "border-slate-100"}`;
  const limitDigits = (max) => (e) => {
  if (e.target.value.length > max) {
    e.target.value = e.target.value.slice(0, max);
  }
};

  return (
    <>
      <AlertDialog alert={alert} onClose={closeAlert} />
      <div className="fixed inset-0 flex justify-center items-center z-[100] p-4 backdrop-blur-md bg-black/20 font-sans antialiased text-slate-900">
        <div className="bg-white rounded-[2.5rem] w-full max-w-xl p-8 relative shadow-2xl overflow-hidden max-h-[95vh] flex flex-col border border-slate-100 text-left">

          <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors p-2 bg-slate-50 rounded-full z-20">
            <HiXMark size={20} />
          </button>

          {view === "info" ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500 overflow-y-auto no-scrollbar pr-1">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1 truncate px-2">
                  {isEdit ? "Edit Product" : "Add Product"}
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-28 h-28 rounded-[2rem] border-4 border-white shadow-xl flex items-center justify-center bg-slate-50 overflow-hidden relative group shrink-0">
                    {imagePreview
                      ? <img src={imagePreview} className="w-full h-full object-cover" alt="" />
                      : <HiPhoto size={32} className="text-slate-200" />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-2">
                      <span className="text-white text-[8px] font-black uppercase tracking-widest leading-tight">Upload</span>
                    </div>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/*" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-slate-400 font-black ml-1 truncate block">System SKU</label>
                    <input
                      readOnly
                      className="w-full bg-slate-50/80 rounded-xl p-3 font-black text-xs text-slate-500 border border-slate-100 outline-none cursor-not-allowed truncate"
                      value={skuRef.current}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400 ml-2 tracking-widest truncate block">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      maxLength={30}
                      className={inputClass("name")}
                      value={form.name}
                      onChange={handleNameChange}
                      placeholder="Enter Name..."
                    />
                    {(nameError || errors.name) && (
                      <p className="text-red-500 text-[8px] font-bold ml-2 mt-0.5 truncate">{nameError || errors.name}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400 ml-2 tracking-widest truncate block">Category</label>
                    <select
                      className={inputClass("category")}
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="">---</option>
                      <option>Earrings</option>
                      <option>Necklace</option>
                      <option>Bracelets</option>
                      <option>Bag</option>
                      <option>Cloth</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400 ml-2 tracking-widest truncate block">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={inputClass("location")}
                      value={form.location}
                      onChange={e => { setForm({ ...form, location: e.target.value }); setErrors({ ...errors, location: "" }); }}
                    >
                      <option value="">---</option>
                      {warehouses.map(w => (
                        <option key={w.warehouse_id} value={w.name}>{w.name}</option>
                      ))}
                    </select>
                    {errors.location && <p className="text-red-500 text-[8px] font-bold ml-2 mt-0.5">{errors.location}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400 ml-1 tracking-widest truncate block">Qty</label>
                    <input
                      type="number"
                      onInput={limitDigits(6)}
                      min="0"
                      className={inputClass("quantity")}
                      value={form.quantity}
                      onChange={handlePositiveNumberChange("quantity")}
                      onKeyDown={e => e.key === "-" && e.preventDefault()}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400 ml-1 tracking-widest truncate block">Unit</label>
                    <select
                      className={inputBase + " border-slate-100"}
                      value={form.stock_unit}
                      onChange={e => setForm({ ...form, stock_unit: e.target.value })}
                    >
                      {UNIT_OPTIONS.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400 ml-1 tracking-widest truncate block">
                      Min <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      onInput={limitDigits(6)}
                      min="0"
                      required
                      className={inputClass("min_stocks")}
                      value={form.min_stocks}
                      onChange={handlePositiveNumberChange("min_stocks")}
                      onKeyDown={e => e.key === "-" && e.preventDefault()}
                    />
                    {errors.min_stocks && <p className="text-red-500 text-[8px] font-bold ml-1 mt-0.5">{errors.min_stocks}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-400 ml-1 tracking-widest truncate block">Price</label>
                    <input
                      type="number"
                      onInput={limitDigits(6)}
                      min="0"
                      step="0.01"
                      className={inputBase + " border-slate-100"}
                      value={form.selling_price}
                      onChange={handlePositiveNumberChange("selling_price")}
                      onKeyDown={e => e.key === "-" && e.preventDefault()}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2 justify-center">
                  {isEdit ? (
                    <>
                      <button
                        type="button"
                        onClick={handleShowQR}
                        disabled={!!nameError}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest border-2 border-slate-200 transition-all ${nameError ? "opacity-50 cursor-not-allowed" : "bg-white text-slate-700 hover:border-black hover:text-black"}`}
                      >
                        <HiQrCode size={16} />
                        QR
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveRecord}
                        disabled={submitting || !!nameError}
                        className={`flex items-center gap-2 px-10 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg transition-all ${submitting || nameError ? "bg-slate-200 text-slate-400" : "bg-black text-white hover:scale-105"}`}
                      >
                        {submitting ? "..." : "Save"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerateQR}
                      disabled={!!nameError}
                      className={`flex items-center gap-3 px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] shadow-lg transition-all ${nameError ? "bg-slate-200 text-slate-400" : "bg-black text-white hover:scale-105"}`}
                    >
                      Generate QR <HiQrCode size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-500 overflow-y-auto no-scrollbar pr-1">
              <div className="bg-white p-4">
                <div className="mb-6 text-left">
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-1 truncate">Identity</h2>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider truncate">QR Identification Card</p>
                </div>

                <div className="flex flex-col gap-6 items-center mb-8">
                  <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-slate-100 shrink-0">
                    <div ref={qrRef} className="rounded-lg overflow-hidden">
                      <QRCodeCanvas value={skuRef.current} size={160} level="H" includeMargin={true} />
                    </div>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="space-y-0.5">
                      <label className="text-[8px] font-black uppercase text-slate-300 tracking-widest ml-1 truncate block">Product Name</label>
                      <div className="w-full bg-slate-50/80 p-3 rounded-xl font-black text-slate-900 text-xs truncate uppercase border border-slate-50">{form.name}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black uppercase text-slate-300 tracking-widest ml-1 truncate block">SKU</label>
                        <div className="w-full bg-slate-50/80 p-3 rounded-xl font-black text-slate-900 text-xs border border-slate-50 truncate">{skuRef.current}</div>
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black uppercase text-slate-300 tracking-widest ml-1 truncate block">Category</label>
                        <div className="w-full bg-slate-50/80 p-3 rounded-xl font-black text-slate-900 text-xs border border-slate-50 truncate uppercase">{form.category || "---"}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black uppercase text-slate-300 tracking-widest ml-1 truncate block">Location</label>
                        <div className="w-full bg-slate-50/80 p-3 rounded-xl font-black text-slate-900 text-xs border border-slate-50 truncate uppercase">{form.location}</div>
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black uppercase text-slate-300 tracking-widest ml-1 truncate block">Price</label>
                        <div className="w-full bg-slate-50/80 p-3 rounded-xl font-black text-emerald-600 text-xs border border-slate-50 truncate">
                          ₱{parseFloat(form.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => setView("info")}
                  className="px-6 py-3 border-2 border-slate-100 text-slate-400 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveRecord}
                  disabled={submitting}
                  className="flex items-center gap-2 px-8 py-3 bg-[#10B981] text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-[#059669] transition-all disabled:opacity-50"
                >
                  <HiPrinter size={16} />
                  {isEdit ? "Print & Update" : "Print & Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}