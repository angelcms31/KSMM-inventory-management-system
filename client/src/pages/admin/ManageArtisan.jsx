import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { HiOutlinePlus, HiOutlineMail, HiOutlinePhone, HiX, HiCamera, HiDotsHorizontal, HiChevronDown, HiOutlineSearch, HiChevronLeft, HiChevronRight } from "react-icons/hi";

const ManageArtisan = () => {
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalArtisans, setTotalArtisans] = useState(0);
  const artisansPerPage = 9;

  const initialFormState = { 
    firstName: '', middleName: '', lastName: '', email: '', contactNo: '', department: 'Necklace', profileImage: '' 
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchArtisans = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/artisans`, {
        params: { search: searchTerm, page: currentPage + 1, limit: artisansPerPage }
      });
      setArtisans(res.data.artisans || []);
      setTotalArtisans(res.data.totalArtisans || 0);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArtisans(); }, [currentPage, searchTerm]);

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert("Only JPEG and PNG images are allowed");
        return;
      }
      if (file.size <= 10 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isEdit) setSelectedArtisan({ ...selectedArtisan, profileImage: reader.result });
          else setFormData({ ...formData, profileImage: reader.result });
        };
        reader.readAsDataURL(file);
      } else {
        alert("Max 10MB only");
      }
    }
  };

  const validateTextInput = (value) => {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}\u{FE0F}]/gu;
    return !emojiRegex.test(value);
  };

  const handleNameChange = (field, value, isEdit = false) => {
    const lettersOnly = /^[a-zA-Z\s]*$/;
    if (!lettersOnly.test(value)) return;
    if (!validateTextInput(value)) {
      alert("Emoticons are not allowed");
      return;
    }
    if (isEdit) setSelectedArtisan({ ...selectedArtisan, [field]: value });
    else setFormData({ ...formData, [field]: value });
  };

  const handleEmailChange = (value, isEdit = false) => {
    if (!validateTextInput(value)) {
      alert("Emoticons are not allowed");
      return;
    }
    if (isEdit) setSelectedArtisan({ ...selectedArtisan, email: value });
    else setFormData({ ...formData, email: value });
  };

  const handlePhoneChange = (value, isEdit = false) => {
    if (!/^\d*$/.test(value)) return;
    if (isEdit) setSelectedArtisan({ ...selectedArtisan, contactNo: value });
    else setFormData({ ...formData, contactNo: value });
  };

  const handleAddArtisan = async (e) => {
    e.preventDefault();
    if (!formData.email.includes('@')) {
      alert("Email must contain @");
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/add_artisan", {
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        email: formData.email,
        contact_no: formData.contactNo,
        department: formData.department,
        profile_image: formData.profileImage
      });
      setShowAddModal(false);
      setFormData(initialFormState);
      fetchArtisans();
      alert("Artisan added successfully!");
    } catch (err) { alert("Error adding artisan"); }
  };

  const handleEditClick = (artisan) => {
    setSelectedArtisan({
      ...artisan,
      firstName: artisan.first_name || '',
      middleName: artisan.middle_name || '',
      lastName: artisan.last_name || '',
      email: artisan.email || '',
      contactNo: artisan.contact_no || '',
      department: artisan.department || '',
      profileImage: artisan.profile_image || '',
      displayId: `AR-${artisan.artisan_id}`
    });
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleUpdateArtisan = async (e) => {
    e.preventDefault();
    if (!selectedArtisan.email.includes('@')) {
      alert("Email must contain @");
      return;
    }
    try {
      await axios.put(`http://localhost:5000/api/artisans/${selectedArtisan.artisan_id}`, {
        first_name: selectedArtisan.firstName,
        middle_name: selectedArtisan.middleName,
        last_name: selectedArtisan.lastName,
        email: selectedArtisan.email,
        contact_no: selectedArtisan.contactNo,
        department: selectedArtisan.department,
        profile_image: selectedArtisan.profileImage,
        status: selectedArtisan.status
      });
      setShowEditModal(false);
      fetchArtisans();
      alert("Artisan updated successfully!");
    } catch (err) { alert("Update failed"); }
  };

  const toggleStatus = async (artisan) => {
    const currentStatus = artisan.status || 'Active';
    const newStatus = currentStatus === 'Active' ? 'Deactivated' : 'Active';
    try {
      await axios.post("http://localhost:5000/api/artisan/status", { email: artisan.email, status: newStatus });
      fetchArtisans();
      setActiveMenu(null);
    } catch (err) { alert("Error updating status"); }
  };

  const totalPages = Math.ceil(totalArtisans / artisansPerPage);

  if (loading) return <div className="h-full flex items-center justify-center font-black text-gray-400 animate-pulse tracking-widest uppercase">Loading...</div>;

  return (
    <div className="w-full flex flex-col font-sans antialiased text-slate-900 overflow-hidden">
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-3 flex gap-4 items-center">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-[#F8F9FA] border-none rounded-xl py-2.5 pl-11 pr-4 outline-none font-bold text-slate-700 text-xs"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
          />
        </div>
      </div>

      <div className="space-y-3 pb-10">
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 relative h-fit text-left">
          <div className="flex justify-between items-center mb-6 px-2">
            <div>
              <h1 className="text-2xl font-black uppercase text-slate-900 leading-none tracking-tighter">Manage Artisans</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 mr-2">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 0))} disabled={currentPage === 0} className="p-1.5 rounded-full border disabled:opacity-30 hover:bg-slate-100"><HiChevronLeft size={16}/></button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1} className="p-1.5 rounded-full border disabled:opacity-30 hover:bg-slate-100"><HiChevronRight size={16}/></button>
              </div>
              <button onClick={() => setShowAddModal(true)} className="bg-black text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg hover:scale-105 transition-all tracking-widest">+ Add Artisan</button>
            </div>
          </div>

          {artisans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <HiOutlineSearch size={48} className="mb-2 opacity-20" />
              <p className="text-lg font-bold">No artisan found</p>
              <p className="text-sm">Try searching for a different name or ID</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {artisans.map((artisan, index) => {
                const artisanStatus = artisan.status || 'Active';
                const fullName = `${artisan.first_name} ${artisan.middle_name ? `${artisan.middle_name} ` : ''}${artisan.last_name}`;
                return (
                  <div key={index} className={`border border-gray-300 rounded-[1.5rem] p-4 relative bg-white shadow-sm hover:shadow-md transition-all flex flex-col ${artisanStatus === 'Deactivated' ? 'opacity-80' : ''}`}>
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === index ? null : index); }} className="absolute top-4 right-4 text-gray-600 hover:text-black">
                      <HiDotsHorizontal size={20} />
                    </button>

                    {activeMenu === index && (
                      <div className="absolute top-11 right-4 bg-white border rounded-lg shadow-xl z-10 w-44 py-1 text-[11px] font-bold">
                        <button onClick={() => handleEditClick(artisan)} className="w-full text-left px-4 py-2 hover:bg-gray-50">Update Information</button>
                        <div className="border-t"></div>
                        <button onClick={() => toggleStatus(artisan)} className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${artisanStatus === 'Active' ? 'text-red-500' : 'text-green-600'}`}>
                          {artisanStatus === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                        </button>
                      </div>
                    )}

                    <div className="flex items-start gap-2.5 mb-3">
                      <div className="relative flex-shrink-0">
                        <img src={artisan.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artisan.first_name}`} className="w-14 h-14 rounded-full object-cover border border-gray-100 shadow-sm" alt="Profile" />
                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${artisanStatus === 'Deactivated' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      </div>
                      <div className="flex-1 pt-0.5 min-w-0 flex flex-col pr-8">
                        <h3 className="font-bold text-sm text-black leading-tight truncate" title={fullName}>{fullName}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[#9CA3AF] text-xs font-normal">Artisan</p>
                          {artisanStatus === 'Deactivated' && <span className="bg-[#EF4444] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Deactivated</span>}
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-300 rounded-2xl p-3 bg-white">
                      <div className="flex justify-between text-[#9CA3AF] text-[10px] font-normal mb-1.5 uppercase tracking-widest">
                        <span>ID No.</span>
                        <span>Department</span>
                      </div>
                      <div className="flex justify-between font-black text-black text-xs mb-3 pb-2 border-b border-gray-200 uppercase tracking-tight">
                        <span>AR-{artisan.artisan_id}</span>
                        <span>{artisan.department || 'General'}</span>
                      </div>
                      <div className="space-y-2">
                        <p className="flex items-center gap-2 text-black text-xs font-normal truncate"><HiOutlineMail size={18} className="text-black flex-shrink-0"/><span className="truncate">{artisan.email}</span></p>
                        <p className="flex items-center gap-2 text-black text-xs font-normal"><HiOutlinePhone size={18} className="text-black flex-shrink-0"/>{artisan.contact_no || 'No Contact'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-6 text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl p-12 relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => { setShowAddModal(false); setShowEditModal(false); setFormData(initialFormState); }} className="absolute top-10 right-10 text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full shadow-sm"><HiX size={28}/></button>
            <h2 className="text-3xl font-black text-slate-900 uppercase mb-8 tracking-tighter leading-none">{showAddModal ? "Add New Artisan" : "Update Artisan"}</h2>

            <form onSubmit={showAddModal ? handleAddArtisan : handleUpdateArtisan} className="grid grid-cols-5 gap-x-10">
              <div className="col-span-3 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">First Name</label>
                    <input required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-black text-sm" value={showAddModal ? formData.firstName : selectedArtisan?.firstName} onChange={e => handleNameChange('firstName', e.target.value, showEditModal)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Middle Name</label>
                    <input className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-black text-sm" value={showAddModal ? formData.middleName : selectedArtisan?.middleName} onChange={e => handleNameChange('middleName', e.target.value, showEditModal)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Last Name</label>
                    <input required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-black text-sm" value={showAddModal ? formData.lastName : selectedArtisan?.lastName} onChange={e => handleNameChange('lastName', e.target.value, showEditModal)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Department</label>
                    <div className="relative">
                      <select className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-black text-sm appearance-none" value={showAddModal ? formData.department : selectedArtisan?.department} onChange={e => showAddModal ? setFormData({...formData, department: e.target.value}) : setSelectedArtisan({...selectedArtisan, department: e.target.value})}>
                        <option value="Necklace">Necklace</option><option value="Bag">Bag</option><option value="Earring">Earring</option><option value="Headpiece">Headpiece</option>
                      </select>
                      <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Contact</label>
                    <input required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-black text-sm" value={showAddModal ? formData.contactNo : selectedArtisan?.contactNo} onChange={e => handlePhoneChange(e.target.value, showEditModal)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">Email Address</label>
                  <input required type="email" className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none border border-transparent font-black text-sm" value={showAddModal ? formData.email : selectedArtisan?.email} onChange={e => handleEmailChange(e.target.value, showEditModal)} />
                </div>
              </div>

              <div className="col-span-2 flex flex-col items-center justify-between py-2">
                <div className="flex flex-col items-center w-full">
                  <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-xl flex items-center justify-center bg-slate-50 overflow-hidden relative group mb-4">
                    {(showAddModal ? formData.profileImage : selectedArtisan?.profileImage) ? (
                      <img src={showAddModal ? formData.profileImage : selectedArtisan.profileImage} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <HiCamera size={48} className="text-gray-200" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <p className="text-white text-[10px] font-black uppercase">Upload Photo</p>
                    </div>
                    <input type="file" accept="image/jpeg,image/png" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, showEditModal)} />
                  </div>
                  
                  <div className="w-full space-y-1">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-2 font-black">ID Number</label>
                    <div className="w-full bg-[#E9ECEF] rounded-2xl p-4 font-black text-sm text-slate-600 text-center">
                      {showAddModal ? "Generated Automatically" : (selectedArtisan?.displayId || "Loading...")}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full mt-6">
                  <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); setFormData(initialFormState); }} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-[11px] font-black hover:bg-slate-50 transition-all">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-black text-white rounded-2xl uppercase text-[11px] font-black shadow-xl transition-all hover:bg-stone-800 tracking-widest">Confirm</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageArtisan;