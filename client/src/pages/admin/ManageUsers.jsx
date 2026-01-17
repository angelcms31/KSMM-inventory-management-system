import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { HiOutlinePlus, HiOutlineMail, HiOutlinePhone, HiX, HiCamera, HiDotsHorizontal, HiChevronDown } from "react-icons/hi";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({ 
    firstName: '', lastName: '', email: '', contactNo: '', role: 'Sales', gender: 'Male', profileImage: '' 
  });

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users");
      setUsers(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setSelectedUser({ ...selectedUser, profileImage: reader.result });
        } else {
          setFormData({ ...formData, profileImage: reader.result });
        }
      };
      reader.readAsDataURL(file);
    } else if (file) alert("Max 10MB only");
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/add_user", formData);
      setShowAddModal(false);
      fetchUsers();
      alert("User added successfully!");
    } catch (err) { alert(err.response?.data || "Error adding user"); }
  };

  const handleEditClick = (user) => {
    setSelectedUser({
      firstName: user.firstname || user.FirstName,
      lastName: user.lastname || user.LastName,
      email: user.email || user.Email,
      contactNo: user.contact_no || user.Contact_No,
      role: user.user_role || user.User_Role,
      gender: user.gender || user.Gender,
      profileImage: user.profile_image || user.Profile_Image,
      originalEmail: user.email || user.Email 
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
    alert("User information updated successfully!");
  } catch (err) {
    if (err.response?.status === 413) {
      alert("Error: The photo is too large. Please use a smaller image.");
    } else {
      alert("Update failed: " + (err.response?.data || err.message));
    }
  }
};

  if (loading) return <div className="p-10 text-center font-bold">Loading Users...</div>;

  return (
    <div className="p-10 bg-white min-h-screen font-sans" onClick={() => setActiveMenu(null)}>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Manage User</h1>
        <button onClick={() => setShowAddModal(true)} className="bg-black text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold transition-all hover:scale-105">
          <HiOutlinePlus size={20} /> Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {users.map((user, index) => (
          <div key={index} className="border rounded-2xl p-6 relative bg-white shadow-sm text-left">
            <button onClick={(e) => { e.stopPropagation(); setActiveMenu(index); }} className="absolute top-5 right-5 text-gray-400 hover:text-black">
              <HiDotsHorizontal size={24} />
            </button>

            {activeMenu === index && (
              <div className="absolute top-12 right-5 bg-white border rounded-lg shadow-xl z-10 w-48 py-2 font-medium animate-in fade-in zoom-in duration-200">
                <button onClick={() => handleEditClick(user)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700">Update Information</button>
                <div className="border-t my-1"></div>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-500">Deactivate Account</button>
              </div>
            )}

            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <img src={user.profile_image || user.Profile_Image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.FirstName}`} className="w-20 h-20 rounded-full object-cover mb-3 grayscale" />
                <div className={`absolute bottom-4 right-1 w-4 h-4 rounded-full border-2 border-white ${user.is_locked || user.Is_Locked ? 'bg-red-500' : 'bg-green-500'}`}></div>
              </div>
              <h3 className="font-bold text-lg leading-tight">{user.firstname || user.FirstName} {user.lastname || user.LastName}</h3>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{user.user_role || user.User_Role}</p>
            </div>

            <div className="border rounded-xl p-5 bg-gray-50/50">
              <div className="flex justify-between text-[11px] text-gray-400 font-bold mb-1 uppercase tracking-wider">
                <span>ID No.</span>
                <span>Date Added</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-800 mb-4">
                <span>{(user.user_role || user.User_Role || "US").substring(0,2).toUpperCase()}00{index+1}</span>
                <span>{(user.date_added || user.Date_Added) ? new Date(user.date_added || user.Date_Added).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="space-y-3">
                <p className="flex items-center gap-3 text-gray-600 font-medium truncate"><HiOutlineMail size={20} className="text-gray-400"/> {user.email || user.Email}</p>
                <p className="flex items-center gap-3 text-gray-600 font-medium"><HiOutlinePhone size={20} className="text-gray-400"/> {user.contact_no || user.Contact_No}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- ADD USER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 relative shadow-2xl">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-gray-300 hover:text-black"><HiX size={28}/></button>
            <h2 className="text-3xl font-bold mb-1">Add User</h2>
            <p className="text-gray-400 text-sm mb-8">Set up account and upload profile photo.</p>
            <form onSubmit={handleAddUser} className="grid grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-4">
                <input required placeholder="First Name" className="w-full bg-gray-50 rounded-xl p-4 outline-none border" onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <input required placeholder="Last Name" className="w-full bg-gray-50 rounded-xl p-4 outline-none border" onChange={e => setFormData({...formData, lastName: e.target.value})} />
                <div className="relative">
                  <select className="w-full bg-gray-50 rounded-xl p-4 outline-none border appearance-none font-bold text-gray-400" onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="Sales">Sales Position</option><option value="Admin">Admin Position</option><option value="Production">Production Position</option><option value="Finance">Finance Position</option>
                  </select>
                  <HiChevronDown className="absolute right-4 top-5 text-gray-400" size={20} />
                </div>
                <div className="relative">
                  <select className="w-full bg-gray-50 rounded-xl p-4 outline-none border appearance-none font-bold text-gray-400" onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                  <HiChevronDown className="absolute right-4 top-5 text-gray-400" size={20} />
                </div>
              </div>
              <div className="space-y-4 text-left">
                <label className="block cursor-pointer">
                  <div className="w-full h-40 bg-gray-50 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center overflow-hidden hover:border-black transition-all">
                    {formData.profileImage ? <img src={formData.profileImage} className="w-full h-full object-cover" /> : <HiCamera size={40} className="text-gray-200" />}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, false)} />
                </label>
                <input required type="email" placeholder="Email Address" className="w-full bg-gray-50 rounded-xl p-4 outline-none border" onChange={e => setFormData({...formData, email: e.target.value})} />
                <input required placeholder="Contact Number" className="w-full bg-gray-50 rounded-xl p-4 outline-none border" onChange={e => setFormData({...formData, contactNo: e.target.value})} />
              </div>
              <div className="col-span-2 flex justify-end gap-6 mt-6 pt-6 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 font-bold">Cancel</button>
                <button type="submit" className="bg-black text-white px-10 py-3 rounded-xl font-bold">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 relative shadow-2xl">
            <button onClick={() => setShowEditModal(false)} className="absolute top-8 right-8 text-gray-300 hover:text-black"><HiX size={28}/></button>
            <h2 className="text-3xl font-bold mb-1">Update User</h2>
            <p className="text-gray-400 text-sm mb-8">Modify the details for {selectedUser.firstName}.</p>
            <form onSubmit={handleUpdateUser} className="grid grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-4 text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">First Name</label>
                <input value={selectedUser.firstName} className="w-full bg-gray-50 rounded-xl p-4 outline-none border" onChange={e => setSelectedUser({...selectedUser, firstName: e.target.value})} />
                
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Last Name</label>
                <input value={selectedUser.lastName} className="w-full bg-gray-50 rounded-xl p-4 outline-none border" onChange={e => setSelectedUser({...selectedUser, lastName: e.target.value})} />
                
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Position</label>
                <div className="relative">
                  <select value={selectedUser.role} className="w-full bg-gray-50 rounded-xl p-4 outline-none border appearance-none font-bold" onChange={e => setSelectedUser({...selectedUser, role: e.target.value})}>
                    <option value="Sales">Sales Position</option><option value="Admin">Admin Position</option><option value="Production">Production Position</option><option value="Finance">Finance Position</option>
                  </select>
                  <HiChevronDown className="absolute right-4 top-5 text-gray-400" size={20} />
                </div>
              </div>
              <div className="space-y-4 text-left">
                <label className="block cursor-pointer">
                  <div className="w-full h-40 bg-gray-50 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center overflow-hidden">
                    <img src={selectedUser.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.firstName}`} className="w-full h-full object-cover" />
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, true)} />
                </label>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Email (Username)</label>
                <input value={selectedUser.email} className="w-full bg-gray-100 rounded-xl p-4 outline-none border text-gray-400" readOnly />
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Contact Number</label>
                <input value={selectedUser.contactNo} className="w-full bg-gray-50 rounded-xl p-4 outline-none border" onChange={e => setSelectedUser({...selectedUser, contactNo: e.target.value})} />
              </div>
              <div className="col-span-2 flex justify-end gap-6 mt-6 pt-6 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-400 font-bold">Cancel</button>
                <button type="submit" className="bg-black text-white px-10 py-3 rounded-xl font-bold shadow-lg hover:shadow-black/20 transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;