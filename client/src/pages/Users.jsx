import React, { useState, useContext, useEffect } from 'react';
import Modal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { utils, writeFile, read } from 'xlsx';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  X,
  Save,
  Shield,
  Building,
  Mail,
  User,
  Menu,
  MoreVertical
} from 'lucide-react';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const Users = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    role: 'cashier_in',
    department: '',
    status: 'active'
  });
  const [userToDelete, setUserToDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(null);

  const roles = ['admin', 'cashier_in', 'cashier_out', 'other'];
  const departments = ['Management', 'Finance', 'Operations', 'IT', 'HR'];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) {
          toast.error('No token found. Please log in.');
          return;
        }

        const response = await axios.get('https://smart-inventory-application-1.onrender.com/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = response.data;
        if (response.status === 200) {
          setUsers(data.users);
        } else {
          throw new Error(data.message || 'Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error(error?.response?.data?.message || error.message || 'Error fetching users');
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileActions && !event.target.closest('.mobile-actions')) {
        setShowMobileActions(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMobileActions]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
                         user?.email?.toLowerCase()?.includes(searchTerm.toLowerCase()));
    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesDepartment = !selectedDepartment || user.department === selectedDepartment;
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      
      const userData = {
        name: userForm.fullName,
        email: userForm.email,
        role: userForm.role,
        department: userForm.department,
        status: userForm.status,
        adminCode: userForm.role === 'admin' ? prompt('Enter admin security code:') : undefined
      };

      const response = await fetch('https://smart-inventory-application-1.onrender.com/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success('User created successfully!');
      setUsers(prevUsers => [...prevUsers, data]);
      setIsModalOpen(false);
      setUserForm({
        fullName: '',
        email: '',
        role: 'cashier_in',
        department: '',
        status: 'active'
      });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditUser = async (user) => {
    setSelectedUser(user);
    setUserForm({
      fullName: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status
    });
    setIsModalOpen(true);
    setShowMobileActions(null);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
    setShowMobileActions(null);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");
        const response = await fetch(`https://smart-inventory-application-1.onrender.com/api/users/${userToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to delete user');
        setUsers(users.filter(user => user.id !== userToDelete.id));
        toast.success('User deleted successfully');
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const exportToExcel = () => {
    const ws = utils.json_to_sheet(users);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Users');
    writeFile(wb, 'users.xlsx');
    toast.success('Users exported successfully');
  };

  const importFromExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = utils.sheet_to_json(ws);
      setUsers(jsonData);
      toast.success('Users imported successfully');
    } catch (err) {
      toast.error('Error importing users: ' + err.message);
      console.error('Import error:', err);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
        <p className="text-gray-700 mb-6">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[1400px] mx-auto">
        <ToastContainer position="top-right" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center">
            <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 mr-2 sm:mr-3 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Users Management</h1>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <label className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer text-sm">
              <Upload className="w-4 h-4 mr-1.5" />
              Import
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={importFromExcel}
                className="hidden"
              />
            </label>
            <button
              onClick={exportToExcel}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export
            </button>
            <button
              onClick={() => {
                setSelectedUser(null);
                setUserForm({
                  fullName: '',
                  email: '',
                  role: 'cashier_in',
                  department: '',
                  status: 'active'
                });
                setIsModalOpen(true);
              }}
              className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Add User
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg"
          >
            <Menu className="w-4 h-4 mr-2" />
            Filters
          </button>
          
          <div className={`flex flex-col sm:flex-row gap-2 ${showFilters ? 'block' : 'hidden sm:flex'}`}>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role.replace('_', ' ')}</option>
              ))}
            </select>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-indigo-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'cashier_in' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'cashier_out' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {user.department}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden sm:flex items-center gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="relative sm:hidden">
                          <button
                            onClick={() => setShowMobileActions(showMobileActions === user.id ? null : user.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {showMobileActions === user.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 mobile-actions">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(user)}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-[95%] max-w-md mx-auto"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{selectedUser ? 'Edit User' : 'Add New User'}</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={userForm.department}
                  onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={userForm.status}
                onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            {!selectedUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={userForm.password || ''}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
            <button
              onClick={handleAddUser}
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {selectedUser ? 'Update User' : 'Add User'}
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={isDeleteModalOpen}
          onRequestClose={() => setIsDeleteModalOpen(false)}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-[95%] max-w-md mx-auto"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        >
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete user "{userToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Users;