import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { HiOutlineMail, HiOutlinePhone, HiX, HiCamera, HiDotsHorizontal, HiOutlineSearch, HiChevronLeft, HiChevronRight } from "react-icons/hi";

const ManageArtisan = () => {
  const [allArtisans, setAllArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const artisansPerPage = 9;

  const initialFormState = {
    firstName: '', middleName: '', lastName: '', email: '', contactNo: '', profileImage: '', department: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchArtisans = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/artisans`, {
        params: { page: 1, limit: 9999 }
      });
      setAllArtisans(res.data.artisans || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArtisans(); }, []);
  useEffect(() => { setCurrentPage(0); }, [searchTerm]);

  const filteredArtisans = allArtisans.filter(a => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    const firstName = (a.first_name || '').toLowerCase();
    const lastName = (a.last_name || '').toLowerCase();
    const email = (a.email || '').toLowerCase();
    const contactNo = (a.contact_no || '').toLowerCase();
    const dept = (a.department || '').toLowerCase();
    const arId = `ar-${a.artisan_id}`;
    return (
      firstName.startsWith(term) ||
      lastName.startsWith(term) ||
      arId.startsWith(term) ||
      dept.startsWith(term) ||
      email.includes(term) ||
      contactNo.includes(term)
    );
  });

  const totalPages = Math.ceil(filteredArtisans.length / artisansPerPage);
  const currentArtisans = filteredArtisans.slice(currentPage * artisansPerPage, (currentPage + 1) * artisansPerPage);

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) { alert("Only JPEG and PNG images are allowed"); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) setSelectedArtisan({ ...selectedArtisan, profileImage: reader.result });
        else setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameChange = (field, value, isEdit = false) => {
    const lettersOnly = /^[a-zA-Z\s]*$/;
    if (!lettersOnly.test(value)) return;
    if (isEdit) setSelectedArtisan({ ...selectedArtisan, [field]: value });
    else setFormData({ ...formData, [field]: value });
  };

  const handlePhoneChange = (value, isEdit = false) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 10) return;
    if (isEdit) setSelectedArtisan({ ...selectedArtisan, contactNo: value });
    else setFormData({ ...formData, contactNo: value });
  };

  const handleAddArtisan = async (e) => {
    e.preventDefault();
    if (formData.contactNo.length !== 10) { alert("Contact number must be exactly 10 digits."); return; }
    try {
      await axios.post("http://localhost:5000/api/add_artisan", {
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        email: formData.email,
        contact_no: formData.contactNo,
        profile_image: formData.profileImage,
        department: formData.department
      });
      setShowAddModal(false);
      setFormData(initialFormState);
      fetchArtisans();
      alert("Artisan added successfully!");
    } catch (err) {
      const msg = err.response?.data?.message || "Error adding artisan";
      alert(msg);
    }
  };

  const handleEditClick = (artisan) => {
    setSelectedArtisan({
      ...artisan,
      firstName: artisan.first_name || '',
      middleName: artisan.middle_name || '',
      lastName: artisan.last_name || '',
      email: artisan.email || '',
      contactNo: artisan.contact_no || '',
      profileImage: artisan.profile_image || '',
      department: artisan.department || '',
      displayId: `AR-${artisan.artisan_id}`
    });
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleUpdateArtisan = async (e) => {
    e.preventDefault();
    if (selectedArtisan.contactNo.length !== 10) { alert("Contact number must be exactly 10 digits."); return; }
    try {
      await axios.put(`http://localhost:5000/api/artisans/${selectedArtisan.artisan_id}`, {
        first_name: selectedArtisan.firstName,
        middle_name: selectedArtisan.middleName,
        last_name: selectedArtisan.lastName,
        email: selectedArtisan.email,
        contact_no: selectedArtisan.contactNo,
        profile_image: selectedArtisan.profileImage,
        status: selectedArtisan.status,
        department: selectedArtisan.department
      });
      setShowEditModal(false);
      fetchArtisans();
      alert("Artisan updated successfully!");
    } catch (err) {
      const msg = err.response?.data?.message || "Update failed";
      alert(msg);
    }
  };

  const toggleStatus = async (artisan) => {
    const newStatus = artisan.status === 'Active' ? 'Deactivated' : 'Active';
    try {
      await axios.post("http://localhost:5000/api/artisan/status", { email: artisan.email, status: newStatus });
      fetchArtisans();
      setActiveMenu(null);
    } catch (err) { alert("Error"); }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setFormData(initialFormState);
  };

  if (loading) return <div className="h-full flex items-center justify-center font-black text-gray-400 animate-pulse tracking-widest uppercase">Loading...</div>;

  return (
    <div className="w-full flex flex-col font-sans antialiased text-slate-900 overflow-hidden text-left">
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-3 flex gap-4 items-center">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, contact, ID, or department..."
            className="w-full bg-[#F8F9FA] border-none rounded-xl py-2.5 pl-11 pr-4 outline-none font-bold text-slate-700 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3 pb-10">
        <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 relative h-fit text-left">
          <div className="flex justify-between items-center mb-6 px-2">
            <h1 className="text-2xl font-black uppercase text-slate-900 leading-none tracking-tighter">Manage Artisans</h1>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 mr-2">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 0))} disabled={currentPage === 0} className="p-1.5 rounded-full border border-slate-200 disabled:opacity-30 hover:bg-slate-100 transition-all"><HiChevronLeft size={16}/></button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1} className="p-1.5 rounded-full border border-slate-200 disabled:opacity-30 hover:bg-slate-100 transition-all"><HiChevronRight size={16}/></button>
              </div>
              <button onClick={() => setShowAddModal(true)} className="bg-black text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg tracking-widest hover:scale-105 transition-all">+ Add Artisan</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {currentArtisans.map((artisan, index) => (
              <div key={artisan.artisan_id} className={`border border-gray-300 rounded-[1.5rem] p-4 relative bg-white shadow-sm flex flex-col ${artisan.status === 'Deactivated' ? 'opacity-80' : ''}`}>
                <button onClick={() => setActiveMenu(activeMenu === index ? null : index)} className="absolute top-4 right-4 text-gray-600 transition-colors hover:text-black"><HiDotsHorizontal size={20} /></button>

                {activeMenu === index && (
                  <div className="absolute top-11 right-4 bg-white border rounded-lg shadow-xl z-10 w-44 py-1 text-[11px] font-bold animate-in fade-in zoom-in duration-200">
                    <button onClick={() => handleEditClick(artisan)} className="w-full text-left px-4 py-2 hover:bg-gray-50">Update Information</button>
                    <button onClick={() => toggleStatus(artisan)} className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${artisan.status === 'Active' ? 'text-red-500' : 'text-green-600'}`}>
                      {artisan.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-2.5 mb-3">
                  <div className="relative flex-shrink-0">
                    <img src={artisan.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artisan.first_name}`} className="w-14 h-14 rounded-full object-cover border border-gray-100" alt="Profile" />
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${artisan.status === 'Deactivated' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  </div>
                  <div className="flex-1 pt-0.5 min-w-0 pr-8">
                    <h3 className="font-bold text-sm text-black truncate">{artisan.first_name} {artisan.last_name}</h3>
                    <p className="text-[#9CA3AF] text-[10px] font-black uppercase tracking-wider">{artisan.department || 'No Dept'}</p>
                  </div>
                </div>

                <div className="border border-gray-300 rounded-2xl p-3 bg-white">
                  <p className="text-[#9CA3AF] text-[10px] uppercase font-normal mb-1">ID No.</p>
                  <p className="font-black text-black text-xs mb-3 pb-2 border-b border-gray-200">AR-{artisan.artisan_id}</p>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-black text-xs truncate"><HiOutlineMail size={18}/>{artisan.email}</p>
                    <p className="flex items-center gap-2 text-black text-xs"><HiOutlinePhone size={18}/>{artisan.contact_no ? `+63 ${artisan.contact_no}` : 'No Contact'}</p>
                  </div>
                </div>
              </div>
            ))}

            {currentArtisans.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <HiOutlineSearch size={48} className="mb-2 opacity-20" />
                <p className="text-lg font-bold">No results found</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-[100] p-6 text-left">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={closeModal} className="absolute top-10 right-10 text-slate-300 hover:text-black transition-all bg-slate-50 p-2 rounded-full"><HiX size={28}/></button>
            <h2 className="text-4xl font-black text-slate-900 uppercase mb-10 tracking-tighter leading-none">{showAddModal ? "Add Artisan" : "Update Artisan"}</h2>

            <form onSubmit={showAddModal ? handleAddArtisan : handleUpdateArtisan}>
              <div className="grid grid-cols-2 gap-x-12 mb-6 items-start">
                <div className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-black ml-1">First Name</label>
                    <input required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-bold text-sm border border-transparent focus:border-slate-200" value={showAddModal ? formData.firstName : selectedArtisan?.firstName} onChange={e => handleNameChange('firstName', e.target.value, showEditModal)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-black ml-1">Middle Name</label>
                    <input className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-bold text-sm border border-transparent focus:border-slate-200" value={showAddModal ? formData.middleName : selectedArtisan?.middleName} onChange={e => handleNameChange('middleName', e.target.value, showEditModal)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-black ml-1">Last Name</label>
                    <input required className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-bold text-sm border border-transparent focus:border-slate-200" value={showAddModal ? formData.lastName : selectedArtisan?.lastName} onChange={e => handleNameChange('lastName', e.target.value, showEditModal)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-black ml-1">Department</label>
                    <select
                      required
                      className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-bold text-sm border border-transparent focus:border-slate-200 appearance-none cursor-pointer"
                      value={showAddModal ? formData.department : selectedArtisan?.department}
                      onChange={e => showAddModal ? setFormData({...formData, department: e.target.value}) : setSelectedArtisan({...selectedArtisan, department: e.target.value})}
                    >
                      <option value="">Select Department</option>
                      <option value="Earrings">Earrings</option>
                      <option value="Necklace">Necklace</option>
                      <option value="Bracelets">Bracelets</option>
                      <option value="Bag">Bag</option>
                      <option value="Accessory">Accessory</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-5 flex flex-col h-full">
                  <div className="flex justify-center items-center py-2 mb-2">
                    <div className="w-24 h-24 rounded-[1.5rem] border-4 border-white shadow-xl flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                      {(showAddModal ? formData.profileImage : selectedArtisan?.profileImage) ? (
                        <img src={showAddModal ? formData.profileImage : selectedArtisan.profileImage} className="w-full h-full object-cover" alt="Preview" />
                      ) : <HiCamera size={36} className="text-gray-200" />}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-center">
                        <p className="text-white text-[8px] font-black uppercase">Change Photo</p>
                      </div>
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, showEditModal)} accept="image/*" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-black ml-1">Email Address</label>
                    <input required type="email" className="w-full bg-[#F3F4F6] rounded-2xl p-4 outline-none font-bold text-sm border border-transparent focus:border-slate-200" value={showAddModal ? formData.email : selectedArtisan?.email} onChange={e => showAddModal ? setFormData({...formData, email: e.target.value}) : setSelectedArtisan({...selectedArtisan, email: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-400 font-black ml-1">Contact No.</label>
                    <div className="flex items-center bg-[#F3F4F6] rounded-2xl overflow-hidden">
                      <span className="px-3 text-sm font-black text-slate-500 border-r border-slate-300 py-4 flex-shrink-0">+63</span>
                      <input
                        required
                        className="flex-1 bg-transparent p-4 outline-none font-bold text-sm"
                        placeholder="9XXXXXXXXX"
                        maxLength={10}
                        value={showAddModal ? formData.contactNo : selectedArtisan?.contactNo}
                        onChange={e => handlePhoneChange(e.target.value, showEditModal)}
                      />
                      <span className="pr-3 text-[10px] font-black text-slate-400 flex-shrink-0">
                        {(showAddModal ? formData.contactNo : selectedArtisan?.contactNo || '').length}/10
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end mt-8">
                <button type="button" onClick={closeModal} className="px-10 py-4 border-2 border-slate-100 rounded-2xl text-slate-400 uppercase text-[11px] font-black hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="px-12 py-4 bg-black text-white rounded-2xl uppercase text-[11px] font-black shadow-xl transition-all hover:bg-stone-800 tracking-widest">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageArtisan;