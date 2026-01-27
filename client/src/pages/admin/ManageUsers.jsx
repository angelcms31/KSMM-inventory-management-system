import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  HiOutlinePlus, HiOutlineMail, HiOutlinePhone, HiX, 
  HiCamera, HiDotsHorizontal, HiChevronDown, HiOutlineSearch 
} from "react-icons/hi";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 6;

  const initialFormState = { 
    firstName: '', middleName: '', lastName: '', email: '', 
    contactNo: '', role: 'Sales', gender: 'Male', profileImage: '' 
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users`, {
        params: { search: searchTerm, page: currentPage, limit: usersPerPage }
      });
      setUsers(res.data.users || []);
      setTotalUsers(res.data.totalUsers || 0);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [currentPage, searchTerm]);

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) setSelectedUser({ ...selectedUser, profileImage: reader.result });
        else setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    } else if (file) alert("Max 10MB only");
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/add_user", formData);
      setShowAddModal(false);
      setFormData(initialFormState);
      fetchUsers();
      alert("User added successfully!");
    } catch (err) { alert(err.response?.data || "Error adding user"); }
  };

  const handleEditClick = (user) => {
    const idPrefix = (user.user_role || "US").substring(0, 2).toUpperCase();
    const displayId = `${idPrefix}00${user.permanent_id || '0'}`;
    
    setSelectedUser({
      ...user,
      firstName: user.firstname,
      middleName: user.middlename || '',
      lastName: user.lastname,
      email: user.email,
      contactNo: user.contact_no,
      role: user.user_role,
      gender: user.gender || 'Male',
      profileImage: user.profile_image,
      originalEmail: user.email,
      displayId: displayId
    });
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put("http://localhost:5000/api/user/update", selectedUser);
      setShowEditModal(false);
      fetchUsers();
      alert("User updated successfully!");
    } catch (err) { alert("Update failed"); }
  };

  const handleUnlock = async (user) => {
    try {
      // FIX: Ginawang PUT at user_id ang ginamit
      await axios.put("http://localhost:5000/api/user/unlock", { 
        userId: user.user_id,
        adminId: localStorage.getItem("user_id"), 
        adminRole: localStorage.getItem("role")
      });
      fetchUsers();
      setActiveMenu(null);
      alert("Account unlocked successfully!");
    } catch (err) { alert("Error unlocking account"); }
  };

  const toggleStatus = async (user) => {
    const currentStatus = user.status || user.Status;
    const newStatus = currentStatus === 'Active' ? 'Deactivated' : 'Active';
    try {
      // FIX: Ginawang PUT at user_id ang ginamit
      await axios.put("http://localhost:5000/api/user/status", { 
        userId: user.user_id, 
        status: newStatus,
        adminId: localStorage.getItem("user_id"),
        adminRole: localStorage.getItem("role")
      });
      fetchUsers();
      setActiveMenu(null);
    } catch (err) { alert("Error updating status"); }
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const inputStyle = "w-full bg-[#EEEEEE] rounded-md p-2 outline-none border-none text-[13px] text-gray-700 placeholder:text-gray-400";
  const labelStyle = "block text-[13px] font-semibold text-gray-800 mb-1 ml-1";

  if (loading && currentPage === 1 && searchTerm === "") {
    return <div className="h-screen flex items-center justify-center font-bold">Loading Users...</div>;
  }

  return (
    <div className="pt-6 px-10 bg-[#F8F9FA] h-screen flex flex-col font-sans overflow-hidden" onClick={() => setActiveMenu(null)}>
      
      <div className="flex justify-between items-start mb-4">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">Manage User</h1>
          <p className="text-gray-400 text-sm">Manage your users here</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-black text-white px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md hover:scale-105 transition-transform">
          <HiOutlinePlus size={18} /> Add User
        </button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search Employee" 
          className="w-full bg-[#E9ECEF] rounded-lg py-2 pl-10 pr-4 outline-none text-sm"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <div className="flex-1 min-h-0 mb-2 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((user, index) => {
            const userStatus = user.status || user.Status;
            const isLocked = user.is_locked || user.Is_Locked;

            return (
              <div key={index} className="border border-gray-300 rounded-[1.5rem] p-5 relative bg-white shadow-sm hover:shadow-md transition-all flex flex-col h-fit">
                <button onClick={(e) => { e.stopPropagation(); setActiveMenu(index); }} className="absolute top-5 right-5 text-gray-600 hover:text-black">
                  <HiDotsHorizontal size={22} />
                </button>

                {activeMenu === index && (
                  <div className="absolute top-12 right-5 bg-white border rounded-lg shadow-xl z-10 w-44 py-1 text-[11px] font-bold animate-in fade-in zoom-in duration-200">
                    {isLocked ? (
                      <button onClick={() => handleUnlock(user)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-green-600">Unlock & Activate</button>
                    ) : (
                      <>
                        <button onClick={() => handleEditClick(user)} className="w-full text-left px-4 py-2 hover:bg-gray-50">Update Information</button>
                        <div className="border-t"></div>
                        <button onClick={() => toggleStatus(user)} className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${userStatus === 'Active' ? 'text-red-500' : 'text-green-600'}`}>
                          {userStatus === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-3 mb-5">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={user.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstname}`} 
                      className="w-16 h-16 rounded-full object-cover border" 
                      alt="Profile"
                    />
                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-[2.5px] border-white 
                      ${isLocked ? 'bg-yellow-400' : userStatus === 'Deactivated' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  </div>
                  
                  <div className="flex-1 pt-0.5 min-w-0">
                    <h3 className="font-bold text-base text-black leading-tight mb-1.5 truncate">{user.firstname} {user.lastname}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[#9CA3AF] text-sm font-normal">{user.user_role}</p>
                      {isLocked && <span className="bg-yellow-400 text-black text-[9px] font-bold px-2 py-0.5 rounded uppercase">Locked</span>}
                      {userStatus === 'Deactivated' && <span className="bg-[#EF4444] text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wide">Deactivated</span>}
                    </div>
                  </div>
                </div>

                <div className="border border-gray-300 rounded-2xl p-4 bg-white">
                  <div className="flex justify-between text-[#9CA3AF] text-[11px] font-bold uppercase mb-2">
                    <span>ID No.</span>
                    <span>Date Added</span>
                  </div>
                  <div className="flex justify-between font-bold text-black text-sm mb-4 pb-3 border-b border-gray-200">
                    <span>{(user.user_role || "US").substring(0,2).toUpperCase()}00{user.permanent_id}</span>
                    <span>{user.date_added ? new Date(user.date_added).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="space-y-2.5">
                    <p className="flex items-center gap-2.5 text-black text-sm font-normal truncate">
                      <HiOutlineMail size={20} className="text-black flex-shrink-0"/> 
                      <span className="truncate">{user.email}</span>
                    </p>
                    <p className="flex items-center gap-2.5 text-black text-sm font-normal">
                      <HiOutlinePhone size={20} className="text-black flex-shrink-0"/> 
                      {user.contact_no}
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
            <h2 className="text-3xl font-bold mb-8 text-gray-900">{showAddModal ? "Add User" : "Update User"}</h2>

            <form onSubmit={showAddModal ? handleAddUser : handleUpdateUser} className="grid grid-cols-5 gap-x-10 gap-y-4">
              <div className="col-span-3 space-y-4">
                <div>
                  <label className={labelStyle}>Name</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input required placeholder="First Name" className={inputStyle} value={showAddModal ? formData.firstName : selectedUser?.firstName} onChange={e => showAddModal ? setFormData({...formData, firstName: e.target.value}) : setSelectedUser({...selectedUser, firstName: e.target.value})} />
                    <input placeholder="Middle Name" className={inputStyle} value={showAddModal ? formData.middleName : selectedUser?.middleName} onChange={e => showAddModal ? setFormData({...formData, middleName: e.target.value}) : setSelectedUser({...selectedUser, middleName: e.target.value})} />
                    <input required placeholder="Last Name" className={inputStyle} value={showAddModal ? formData.lastName : selectedUser?.lastName} onChange={e => showAddModal ? setFormData({...formData, lastName: e.target.value}) : setSelectedUser({...selectedUser, lastName: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Position</label>
                    <div className="relative">
                      <select className={`${inputStyle} appearance-none font-medium`} value={showAddModal ? formData.role : selectedUser?.role} onChange={e => showAddModal ? setFormData({...formData, role: e.target.value}) : setSelectedUser({...selectedUser, role: e.target.value})}>
                        <option value="Sales">Sales</option><option value="Admin">Admin</option><option value="Production">Production</option><option value="Finance">Finance</option>
                      </select>
                      <HiChevronDown className="absolute right-3 top-2.5 text-gray-500" size={18} />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>Gender</label>
                    <div className="relative">
                      <select className={`${inputStyle} appearance-none font-medium`} value={showAddModal ? formData.gender : selectedUser?.gender} onChange={e => showAddModal ? setFormData({...formData, gender: e.target.value}) : setSelectedUser({...selectedUser, gender: e.target.value})}>
                        <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                      </select>
                      <HiChevronDown className="absolute right-3 top-2.5 text-gray-500" size={18} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Email</label>
                  <input required type="email" placeholder="email" className={inputStyle} value={showAddModal ? formData.email : selectedUser?.email} readOnly={showEditModal} onChange={e => showAddModal && setFormData({...formData, email: e.target.value})} />
                </div>

                <div>
                  <label className={labelStyle}>ID number</label>
                  <p className="text-[13px] text-gray-600 font-bold bg-gray-100 p-2 rounded-md tracking-wider">
                    {showAddModal ? "Generated Automatically" : (selectedUser?.displayId || "Loading...")}
                  </p>
                </div>
              </div>

              <div className="col-span-2 flex flex-col items-center space-y-6">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                    {(showAddModal ? formData.profileImage : selectedUser?.profileImage) ? (
                      <img src={showAddModal ? formData.profileImage : selectedUser.profileImage} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <HiCamera size={48} className="text-gray-200" />
                    )}
                  </div>
                  <label className="mt-4 cursor-pointer bg-[#333333] text-white text-xs px-6 py-2 rounded-md font-medium hover:bg-black transition-colors">
                    Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, showEditModal)} />
                  </label>
                </div>

                <div className="w-full">
                  <label className={labelStyle}>Contact Number</label>
                  <input required placeholder="Contact Number" className={inputStyle} value={showAddModal ? formData.contactNo : selectedUser?.contactNo} onChange={e => showAddModal ? setFormData({...formData, contactNo: e.target.value}) : setSelectedUser({...selectedUser, contactNo: e.target.value})} />
                </div>

                <div className="flex gap-3 w-full pt-4">
                  <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); setFormData(initialFormState); }} className="flex-1 border border-gray-300 rounded-md py-2.5 font-bold text-gray-700 hover:bg-gray-50 uppercase text-[11px] tracking-widest">Cancel</button>
                  <button type="submit" className="flex-1 bg-[#333333] text-white rounded-md py-2.5 font-bold hover:bg-black transition-colors uppercase text-[11px] tracking-widest">{showAddModal ? "Add User" : "Save Changes"}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;