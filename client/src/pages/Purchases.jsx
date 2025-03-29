import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import { read, utils, writeFile } from 'xlsx';
import DatePicker from 'react-datepicker';
import { 
  Search, Plus, Download, Upload, Edit2, Trash2, 
  DollarSign, Package, Truck, Calendar,
  Building2, Filter, ShoppingBag
} from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import 'react-datepicker/dist/react-datepicker.css';

const initialPurchase = {
  id: '',
  productId: `PROD-${Date.now()}`,
  productName: '',
  quantity: 1,
  unitCost: 0,
  totalCost: 0,
  date: new Date().toISOString(),
  supplier: '',
  category: '',
  status: 'pending',
  paymentStatus: 'pending',
  paymentMethod: 'bank_transfer',
  purchasedBy: '',
  notes: ''
};

const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Other'];
const suppliers = ['Supplier A', 'Supplier B', 'Supplier C', 'Other'];
const paymentMethods = ['cash', 'bank_transfer', 'credit', 'cheque'];
const orderStatuses = ['pending', 'received', 'cancelled', 'processing'];
const paymentStatuses = ['pending', 'paid', 'partially_paid', 'cancelled'];

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState(initialPurchase);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      setIsLoading(true);
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch('https://smart-inventory-application-1.onrender.com/api/purchases', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch purchases');
        const data = await response.json();
        setPurchases(data.purchases);
      } catch (error) {
        toast.error('Failed to fetch purchases');
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  useEffect(() => {
    let result = [...purchases];
    
    if (searchTerm) {
      result = result.filter(purchase =>
        purchase.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      result = result.filter(purchase => purchase.category === selectedCategory);
    }

    if (selectedSupplier !== 'all') {
      result = result.filter(purchase => purchase.supplier === selectedSupplier);
    }
    
    if (dateRange[0] && dateRange[1]) {
      result = result.filter(purchase => {
        const purchaseDate = new Date(purchase.date);
        return purchaseDate >= dateRange[0] && purchaseDate <= dateRange[1];
      });
    }
    
    setFilteredPurchases(result);
  }, [purchases, searchTerm, selectedCategory, selectedSupplier, dateRange]);

  const totalExpenses = purchases.reduce((acc, purchase) => acc + purchase.totalCost, 0);
  const pendingPayments = purchases
    .filter(purchase => purchase.paymentStatus !== 'paid')
    .reduce((acc, purchase) => acc + purchase.totalCost, 0);
  const totalOrders = purchases.length;
  const pendingOrders = purchases.filter(purchase => purchase.status === 'pending').length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const purchaseData = {
        ...currentPurchase,
        totalCost: currentPurchase.quantity * currentPurchase.unitCost
      };

      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      if (isEditing) {
        const response = await fetch(`https://smart-inventory-application-1.onrender.com/api/purchases/${currentPurchase.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(purchaseData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        setPurchases(purchases.map(p => p.id === currentPurchase.id ? data : p));
        toast.success('Purchase updated successfully!');
      } else {
        const response = await fetch('https://smart-inventory-application-1.onrender.com/api/purchases', {
          method: 'POST',
          headers,
          body: JSON.stringify(purchaseData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        setPurchases([...purchases, data]);
        toast.success('Purchase added successfully!');
      }
      setIsModalOpen(false);
      setCurrentPurchase(initialPurchase);
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch(`https://smart-inventory-application-1.onrender.com/api/purchases/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message);
        }
        
        setPurchases(purchases.filter(p => p.id !== id));
        toast.success('Purchase deleted successfully!');
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = new Uint8Array(e.target?.result);
          const workbook = read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = utils.sheet_to_json(worksheet);
          
          const token = sessionStorage.getItem('token') || localStorage.getItem('token');
          const response = await fetch('https://smart-inventory-application-1.onrender.com/api/purchases/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(jsonData)
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
          
          setPurchases(prevPurchases => [...prevPurchases, ...result]);
          toast.success('Purchases imported successfully!');
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const handleEdit = (purchase) => {
    setCurrentPurchase(purchase);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const ws = utils.json_to_sheet(purchases);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Purchases');
    writeFile(wb, 'purchases.xlsx');
    toast.success('Purchases exported successfully!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'partially_paid': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <ToastContainer position="top-right" />
      
      {/* Header with Stats */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Purchase Management</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-500">Total Expenses</p>
                <p className="text-lg sm:text-2xl font-bold">ksh {totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-500">Pending Payments</p>
                <p className="text-lg sm:text-2xl font-bold">ksh {pendingPayments.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-500">Total Orders</p>
                <p className="text-lg sm:text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-500">Pending Orders</p>
                <p className="text-lg sm:text-2xl font-bold">{pendingOrders}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search purchases..."
                className="pl-10 p-2 w-full border rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                className="pl-10 p-2 w-full border rounded-md appearance-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                className="pl-10 p-2 w-full border rounded-md appearance-none"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
              >
                <option value="all">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <DatePicker
                selectsRange={true}
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                onChange={(update) => setDateRange(update)}
                className="pl-10 p-2 w-full border rounded-md"
                placeholderText="Select date range"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentPurchase(initialPurchase);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Purchase
            </button>
            <label className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Import
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImport}
              />
            </label>
            <button
              onClick={handleExport}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Purchases Table/List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{purchase.productName}</div>
                    <div className="text-sm text-gray-500">{purchase.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{purchase.supplier}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{purchase.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ksh {purchase.unitCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ksh {purchase.totalCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                      {formatStatus(purchase.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.paymentStatus)}`}>
                      {formatStatus(purchase.paymentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(purchase)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(purchase.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="block md:hidden">
          {filteredPurchases.map((purchase) => (
            <div key={purchase.id} className="border-b border-gray-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{purchase.productName}</h3>
                  <p className="text-sm text-gray-500">{purchase.category}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(purchase)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(purchase.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Supplier</p>
                  <p className="font-medium">{purchase.supplier}</p>
                </div>
                <div>
                  <p className="text-gray-500">Quantity</p>
                  <p className="font-medium">{purchase.quantity}</p>
                </div>
                <div>
                  <p className="text-gray-500">Unit Cost</p>
                  <p className="font-medium">ksh {purchase.unitCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-medium">ksh {purchase.totalCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                    {formatStatus(purchase.status)}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Payment</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.paymentStatus)}`}>
                    {formatStatus(purchase.paymentStatus)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 sm:p-8 w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Purchase' : 'New Purchase'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={currentPurchase.productName}
              onChange={(e) => setCurrentPurchase({ ...currentPurchase, productName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={currentPurchase.category}
              onChange={(e) => setCurrentPurchase({ ...currentPurchase, category: e.target.value })}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={currentPurchase.supplier}
              onChange={(e) => setCurrentPurchase({ ...currentPurchase, supplier: e.target.value })}
            >
              <option value="">Select a supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={currentPurchase.quantity}
              onChange={(e) => setCurrentPurchase({ ...currentPurchase, quantity: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Unit Cost</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={currentPurchase.unitCost}
              onChange={(e) => setCurrentPurchase({ ...currentPurchase, unitCost: parseFloat(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Order Status</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={currentPurchase.status}
              onChange={(e) => setCurrentPurchase({ ...currentPurchase, status: e.target.value })}
            >
              {orderStatuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Status</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={currentPurchase.paymentStatus}
              onChange={(e) => setCurrentPurchase({ ...currentPurchase, paymentStatus: e.target.value })}
            >
              {paymentStatuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={currentPurchase.paymentMethod}
              onChange={(e) => setCurrentPurchase({ ...currentPurchase, paymentMethod: e.target.value })}
            >
              {paymentMethods.map(method => (
                <option key={method} value={method}>
                  {method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Purchased By</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={currentPurchase.purchasedBy}
              onChange={(e) => setCurrentPurchase({ ...currentPurchase, purchasedBy: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              value={currentPurchase.notes}
              onChange={(e) => setCurrentPurchase({ ...currentPurchase, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isEditing ? 'Update' : 'Create'} Purchase
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Purchases;