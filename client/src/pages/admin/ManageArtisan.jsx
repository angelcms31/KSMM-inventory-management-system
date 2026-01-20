import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { HiOutlinePlus, HiOutlineMail, HiOutlinePhone, HiX, HiCamera, HiDotsHorizontal, HiChevronDown, HiOutlineSearch } from "react-icons/hi";

const ManageArtisan = () => {
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArtisans, setTotalArtisans] = useState(0);
  const artisansPerPage = 6;

  const initialFormState = { 
    firstName: '', middleName: '', lastName: '', email: '', contactNo: '', department: 'Necklace', profileImage: '' 
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchArtisans = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/artisans`, {
        params: { search: searchTerm, page: currentPage, limit: artisansPerPage }
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
    if (file && file.size <= 10 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) setSelectedArtisan({ ...selectedArtisan, profileImage: reader.result });
        else setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    } else if (file) alert("Max 10MB only");
  };

  const handleAddArtisan = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/add_artisan", formData);
      setShowAddModal(false);
      setFormData(initialFormState);
      fetchArtisans();
      alert("Artisan added successfully!");
    } catch (err) { alert(err.response?.data || "Error adding artisan"); }
  };

  const handleEditClick = (artisan) => {
    const displayId = `AR00${artisan.artisan_id || '0'}`;
    setSelectedArtisan({
      ...artisan,
      firstName: artisan.first_name || '',
      middleName: artisan.middle_name || '',
      lastName: artisan.last_name || '',
      email: artisan.email || '',
      contactNo: artisan.contact_no || '',
      department: artisan.department || 'Necklace',
      profileImage: artisan.profile_image || '',
      displayId: displayId
    });
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleUpdateArtisan = async (e) => {
    e.preventDefault();
    try {
      await axios.put("http://localhost:5000/api/artisan/update", selectedArtisan);
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
  const inputStyle = "w-full bg-[#EEEEEE] rounded-md p-2 outline-none border-none text-[13px] text-gray-700 placeholder:text-gray-400";
  const labelStyle = "block text-[13px] font-semibold text-gray-800 mb-1 ml-1";

  if (loading && currentPage === 1 && searchTerm === "") {
    return <div className="h-screen flex items-center justify-center font-bold">Loading...</div>;
  }

  return (
    <div className="pt-6 px-10 bg-[#F8F9FA] h-screen flex flex-col font-sans overflow-hidden" onClick={() => setActiveMenu(null)}>
      
      <div className="flex justify-between items-start mb-4">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">Manage Artisan</h1>
          <p className="text-gray-400 text-sm">Manage Artisan Information</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-black text-white px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md hover:scale-105 transition-transform">
          <HiOutlinePlus size={18} /> Add Artisan
        </button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search Artisan" 
          className="w-full bg-[#E9ECEF] rounded-lg py-2 pl-10 pr-4 outline-none text-sm"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <div className="flex-1 min-h-0 mb-2 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {artisans.map((artisan, index) => {
            const artisanStatus = artisan.status || 'Active';

            return (
              <div key={index} className="border border-gray-300 rounded-[1.5rem] p-5 relative bg-white shadow-sm hover:shadow-md transition-all flex flex-col h-fit">
                <button onClick={(e) => { e.stopPropagation(); setActiveMenu(index); }} className="absolute top-5 right-5 text-gray-600 hover:text-black">
                  <HiDotsHorizontal size={22} />
                </button>

                {activeMenu === index && (
                  <div className="absolute top-12 right-5 bg-white border rounded-lg shadow-xl z-10 w-44 py-1 text-[11px] font-bold animate-in fade-in zoom-in duration-200">
                    <button onClick={() => handleEditClick(artisan)} className="w-full text-left px-4 py-2 hover:bg-gray-50">Update Information</button>
                    <div className="border-t"></div>
                    <button onClick={() => toggleStatus(artisan)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-500">
                      {artisanStatus === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-3 mb-5">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={artisan.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artisan.first_name}`} 
                      className="w-16 h-16 rounded-full object-cover" 
                      alt="Profile"
                    />
                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-[2.5px] border-white 
                      ${artisanStatus === 'Deactivated' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  </div>
                  
                  <div className="flex-1 pt-0.5 min-w-0">
                    <h3 className="font-bold text-base text-black leading-tight mb-1.5">{artisan.first_name} {artisan.last_name}</h3>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[#9CA3AF] text-sm font-normal">Artisan</p>
                      {artisanStatus === 'Deactivated' && (
                        <span className="bg-[#EF4444] text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wide">Deactivated</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border border-gray-300 rounded-2xl p-4 bg-white">
                  <div className="flex justify-between text-[#9CA3AF] text-[11px] font-normal mb-2">
                    <span>ID No.</span>
                    <span>Department</span>
                  </div>
                  <div className="flex justify-between font-bold text-black text-sm mb-4 pb-3 border-b border-gray-200">
                    <span>AR00{artisan.artisan_id}</span>
                    <span>{artisan.department || 'General'}</span>
                  </div>
                  <div className="space-y-2.5">
                    <p className="flex items-center gap-2.5 text-black text-sm font-normal truncate">
                      <HiOutlineMail size={20} className="text-black flex-shrink-0"/> 
                      <span className="truncate">{artisan.email}</span>
                    </p>
                    <p className="flex items-center gap-2.5 text-black text-sm font-normal">
                      <HiOutlinePhone size={20} className="text-black flex-shrink-0"/> 
                      {artisan.contact_no}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 py-4 mt-auto border-t border-gray-200">
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${currentPage === i + 1 ? "bg-black text-white" : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`}>{i + 1}</button>
        ))}
      </div>

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl p-10 relative shadow-2xl overflow-hidden">
            <button onClick={() => { setShowAddModal(false); setShowEditModal(false); setFormData(initialFormState); }} className="absolute top-8 right-8 text-gray-400 hover:text-black flex items-center gap-1 font-semibold">
              <HiX size={24}/>
            </button>
            <h2 className="text-3xl font-bold mb-8 text-gray-900">{showAddModal ? "Add Artisan" : "Update Artisan"}</h2>

            <form onSubmit={showAddModal ? handleAddArtisan : handleUpdateArtisan} className="grid grid-cols-5 gap-x-10 gap-y-4">
              <div className="col-span-3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>First Name</label>
                    <input required className={inputStyle} value={showAddModal ? formData.firstName : selectedArtisan?.firstName} onChange={e => showAddModal ? setFormData({...formData, firstName: e.target.value}) : setSelectedArtisan({...selectedArtisan, firstName: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelStyle}>Last Name</label>
                    <input required className={inputStyle} value={showAddModal ? formData.lastName : selectedArtisan?.lastName} onChange={e => showAddModal ? setFormData({...formData, lastName: e.target.value}) : setSelectedArtisan({...selectedArtisan, lastName: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Department</label>
                    <div className="relative">
                      <select className={`${inputStyle} appearance-none font-medium`} value={showAddModal ? formData.department : selectedArtisan?.department} onChange={e => showAddModal ? setFormData({...formData, department: e.target.value}) : setSelectedArtisan({...selectedArtisan, department: e.target.value})}>
                        <option value="Necklace">Necklace</option><option value="Bag">Bag</option><option value="Earring">Earring</option><option value="Headpiece">Headpiece</option>
                      </select>
                      <HiChevronDown className="absolute right-3 top-2.5 text-gray-500" size={18} />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>Contact No.</label>
                    <input required className={inputStyle} value={showAddModal ? formData.contactNo : selectedArtisan?.contactNo} onChange={e => showAddModal ? setFormData({...formData, contactNo: e.target.value}) : setSelectedArtisan({...selectedArtisan, contactNo: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Email</label>
                  <input required type="email" className={inputStyle} value={showAddModal ? formData.email : selectedArtisan?.email} onChange={e => showAddModal ? setFormData({...formData, email: e.target.value}) : setSelectedArtisan({...selectedArtisan, email: e.target.value})} />
                </div>
              </div>

              <div className="col-span-2 flex flex-col items-center space-y-6">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                    {(showAddModal ? formData.profileImage : selectedArtisan?.profileImage) ? (
                      <img src={showAddModal ? formData.profileImage : selectedArtisan.profileImage} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <HiCamera size={48} className="text-gray-200" />
                    )}
                  </div>
                  <label className="mt-4 cursor-pointer bg-[#333333] text-white text-xs px-6 py-2 rounded-md font-medium hover:bg-black transition-colors">
                    Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, showEditModal)} />
                  </label>
                </div>

                <div className="flex gap-3 w-full pt-4">
                  <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); setFormData(initialFormState); }} className="flex-1 border border-gray-300 rounded-md py-2.5 font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 bg-[#333333] text-white rounded-md py-2.5 font-bold hover:bg-black transition-colors">{showAddModal ? "Add Artisan" : "Save Changes"}</button>
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