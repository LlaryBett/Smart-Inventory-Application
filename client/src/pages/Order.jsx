import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import { read, utils, writeFile } from 'xlsx';
import { 
  Search, Plus, Download, Upload, Edit2, Trash2, 
  DollarSign, ShoppingCart, Package, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

const initialOrder = {
  id: '',
  customerName: '',
  customerEmail: '',
  status: 'pending',
  items: 1,
  totalAmount: 0,
  createdAt: new Date().toISOString(),
  shippingAddress: '',
  paymentMethod: 'credit_card',
  notes: '',
  productId: '',
  productName: '',
  quantity: 1,
  pricePerUnit: 0,
  selectedProduct: null
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(initialOrder);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate metrics
  const totalRevenue = orders.reduce((acc, order) => 
    order.status !== 'cancelled' ? acc + (order.totalAmount || 0) : acc, 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch('https://smart-inventory-application-1.onrender.com/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        setOrders(data.orders);
        setIsLoading(false);
      } catch (err) { // Changed from error to err and using it
        console.error('Error fetching orders:', err);
        toast.error(err.message || 'Failed to fetch orders');
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch('https://smart-inventory-application-1.onrender.com/api/products', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) { // Changed from error to err and using it
        console.error('Error fetching products:', err);
        toast.error('Failed to fetch products: ' + err.message);
      }
    };
    fetchProducts();
  }, []);

  // Filter and search orders
  useEffect(() => {
    let result = [...orders];
    
    if (searchTerm) {
      result = result.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedStatus !== 'all') {
      result = result.filter(order => order.status === selectedStatus);
    }
    
    setFilteredOrders(result);
  }, [orders, searchTerm, selectedStatus]);

  // Product search handler
  const handleProductSearch = (searchTerm) => {
    setProductSearchTerm(searchTerm);
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  // Update handleSubmit to use API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentOrder.selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    const quantity = parseInt(currentOrder.quantity);
    const totalAmount = quantity * currentOrder.pricePerUnit;

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const orderPayload = {
        ...currentOrder,
        quantity: quantity,
        items: quantity,
        totalAmount: totalAmount,
        productId: currentOrder.selectedProduct._id,
        productName: currentOrder.selectedProduct.name,
        pricePerUnit: currentOrder.selectedProduct.price
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      if (isEditing) {
        const response = await fetch(`/${currentOrder.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(orderPayload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        setOrders(orders.map(o => o.id === currentOrder.id ? data : o));
        toast.success('Order updated successfully!');
      } else {
        const response = await fetch('https://smart-inventory-application-1.onrender.com/api/orders', {
          method: 'POST',
          headers,
          body: JSON.stringify(orderPayload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        setOrders([...orders, data]);
        toast.success('Order added successfully!');
      }
      setIsModalOpen(false);
      setCurrentOrder(initialOrder);
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch(`https://smart-inventory-application-1.onrender.com/api/orders/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message);
        }
        
        setOrders(orders.filter(o => o.id !== id));
        toast.success('Order deleted successfully!');
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const handleEdit = (order) => {
    setCurrentOrder(order);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const ws = utils.json_to_sheet(orders);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Orders');
    writeFile(wb, 'orders.xlsx');
    toast.success('Orders exported successfully!');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result);
        const workbook = read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(worksheet);
        setOrders(jsonData);
        toast.success('Orders imported successfully!');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <ShoppingCart className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <ToastContainer position="top-right" />
      
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Order Management</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="h-6 md:h-8 w-6 md:w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-xs md:text-sm text-gray-500">Total Revenue</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">ksh {totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-6 md:h-8 w-6 md:w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-xs md:text-sm text-gray-500">Pending Orders</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">{pendingOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle2 className="h-6 md:h-8 w-6 md:w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-xs md:text-sm text-gray-500">Completed Orders</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">{completedOrders}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full lg:w-auto">
            <div className="flex items-center w-full">
              <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search orders..."
                className="ml-2 p-2 border rounded-md w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center w-full">
              <select
                className="p-2 border rounded-md w-full"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentOrder(initialOrder);
                setIsModalOpen(true);
              }}
              className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 min-w-[100px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </button>
            <label className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer min-w-[100px]">
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
              className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 min-w-[100px]"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {!isMobile && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                {!isMobile && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>}
                {!isMobile && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  {!isMobile && (
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.customerEmail}</div>
                    {isMobile && (
                      <>
                        <div className="text-xs text-gray-500 mt-1">
                          Total: ksh {(order.totalAmount || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Date: {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {Array.isArray(order.items) ? order.items.length : order.items} items
                  </td>
                  {!isMobile && (
                    <>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        ksh {(order.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(order)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-4 md:p-6 lg:p-8 w-[95%] md:w-[80%] lg:w-[60%] max-w-2xl max-h-[90vh] overflow-y-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        style={{
          content: {
            maxWidth: '95vw',
            maxHeight: '90vh'
          }
        }}
      >
        <h2 className="text-xl md:text-2xl font-bold mb-6">{isEditing ? 'Edit Order' : 'New Order'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Select Product</h3>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={productSearchTerm}
                onChange={(e) => handleProductSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2">Stock</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map(product => (
                    <tr key={product._id}>
                      <td className="px-4 py-2">{product.name}</td>
                      <td className="px-4 py-2">{product.category}</td>
                      <td className="px-4 py-2">ksh {product.price}</td>
                      <td className="px-4 py-2">{product.stock}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => setCurrentOrder({
                            ...currentOrder,
                            productId: product._id,
                            productName: product.name,
                            pricePerUnit: product.price,
                            selectedProduct: product
                          })}
                          className={`px-3 py-1 rounded ${
                            currentOrder.selectedProduct?._id === product._id
                              ? 'bg-green-500 text-white'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          {currentOrder.selectedProduct?._id === product._id ? 'Selected' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Product Details */}
          {currentOrder.selectedProduct && (
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Selected Product Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name: {currentOrder.selectedProduct.name}</p>
                  <p className="text-sm text-gray-600">Category: {currentOrder.selectedProduct.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price: ksh {currentOrder.selectedProduct.price}</p>
                  <p className="text-sm text-gray-600">Available Stock: {currentOrder.selectedProduct.stock}</p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={currentOrder.customerName}
                onChange={(e) => setCurrentOrder({ ...currentOrder, customerName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
              <input
                type="email"
                required
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={currentOrder.customerEmail}
                onChange={(e) => setCurrentOrder({ ...currentOrder, customerEmail: e.target.value })}
              />
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                required
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={currentOrder.status}
                onChange={(e) => setCurrentOrder({ ...currentOrder, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                required
                min="1"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={currentOrder.quantity}
                onChange={(e) => {
                  const newQuantity = parseInt(e.target.value);
                  setCurrentOrder({
                    ...currentOrder,
                    quantity: newQuantity,
                    items: newQuantity,
                    totalAmount: newQuantity * currentOrder.pricePerUnit
                  });
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
            <textarea
              required
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={currentOrder.shippingAddress}
              onChange={(e) => setCurrentOrder({ ...currentOrder, shippingAddress: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              required
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={currentOrder.paymentMethod}
              onChange={(e) => setCurrentOrder({ ...currentOrder, paymentMethod: e.target.value })}
            >
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="paypal">PayPal</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={currentOrder.notes}
              onChange={(e) => setCurrentOrder({ ...currentOrder, notes: e.target.value })}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isEditing ? 'Update' : 'Create'} Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Orders;