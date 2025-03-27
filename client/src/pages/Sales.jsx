import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import { read, utils, writeFile } from 'xlsx';
import DatePicker from 'react-datepicker';
import { 
  Search, Plus, Download, Upload, Edit2, Trash2, 
  DollarSign, TrendingUp, TrendingDown, Calendar,
  ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

const initialSale = {
  id: '',
  products: [{
    product: '', // This will hold the product ObjectId
    quantity: 1
  }],
  customerName: '',
  paymentMethod: 'cash',
  notes: '',
  date: new Date().toISOString()
};

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState(initialSale);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]); // Add products state

  // Fetch sales from API
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/sales', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        console.log('Fetched sales data:', data.sales); // Log the sales payload
        setSales(data.sales);
        setIsLoading(false);
      } catch (error) {
        toast.error(error.message);
        setIsLoading(false);
      }
    };

    fetchSales();
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/products', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Error fetching products. Please try again.');
      }
    };

    fetchProducts();
  }, []);

  // Calculate metrics
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  const totalProfit = sales.reduce((acc, sale) => acc + sale.profit, 0);
  const averageTicketSize = sales.length > 0 ? totalRevenue / sales.length : 0;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Filter and search sales
  useEffect(() => {
    let result = [...sales];
    
    if (searchTerm) {
      result = result.filter(sale => {
        // Search through product name
        const productName = sale.products?.[0]?.product?.name?.toLowerCase() || '';
        
        // Search through customer name
        const customerName = sale.customerName?.toLowerCase() || '';
        
        // Search through payment method
        const paymentMethod = sale.paymentMethod?.toLowerCase() || '';

        const searchLower = searchTerm.toLowerCase();
        
        return (
          productName.includes(searchLower) ||
          customerName.includes(searchLower) ||
          paymentMethod.includes(searchLower)
        );
      });
    }
    
    if (selectedCategory !== 'all') {
      result = result.filter(sale => 
        sale.products?.[0]?.product?.category === selectedCategory
      );
    }
    
    if (dateRange[0] && dateRange[1]) {
      result = result.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= dateRange[0] && saleDate <= dateRange[1];
      });
    }
    
    setFilteredSales(result);
  }, [sales, searchTerm, selectedCategory, dateRange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const saleData = {
        products: [
          {
            product: currentSale.products[0].product, // Use the selected product's _id
            productName: currentSale.products[0].productName,
            quantity: currentSale.products[0].quantity,
            unitPrice: currentSale.products[0].unitPrice,
            costPrice: currentSale.products[0].costPrice,
            category: currentSale.products[0].category,
          },
        ],
        customerName: currentSale.customerName,
        paymentMethod: currentSale.paymentMethod,
        notes: currentSale.notes,
        date: currentSale.date,
      };

      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      if (isEditing) {
        const response = await fetch(`http://localhost:5000/api/sales/${currentSale.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(saleData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        setSales(sales.map((s) => (s.id === currentSale.id ? data.sale : s))); // Update the edited sale
        toast.success('Sale updated successfully!');
      } else {
        const response = await fetch('http://localhost:5000/api/sales', {
          method: 'POST',
          headers,
          body: JSON.stringify(saleData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        const populatedSale = await fetch(`http://localhost:5000/api/sales/${data.sale.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then((res) => res.json()); // Fetch the fully populated sale

        setSales([...sales, populatedSale.sale]); // Add the fully populated sale to the state
        toast.success('Sale added successfully!');
      }
      setIsModalOpen(false);
      setCurrentSale(initialSale);
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/sales/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message);
        }
        
        setSales(sales.filter(s => s.id !== id));
        toast.success('Sale deleted successfully!');
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const handleExport = () => {
    const ws = utils.json_to_sheet(sales);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sales');
    writeFile(wb, 'sales.xlsx');
    toast.success('Sales data exported successfully!');
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
          const response = await fetch('http://localhost:5000/api/sales/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(jsonData)
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
          
          setSales(prevSales => [...prevSales, ...result]);
          toast.success('Sales imported successfully!');
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  // Add handleEdit function
  const handleEdit = (sale) => {
    setCurrentSale(sale);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Other'];
  const paymentMethods = ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'mobile_payment'];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <ToastContainer position="top-right" />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Sales Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">ksh {totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Profit</p>
                <p className="text-2xl font-bold">ksh {totalProfit.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            
            <div className="flex items-center">
              <ArrowUpRight className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Average Ticket</p>
                <p className="text-2xl font-bold">ksh {averageTicketSize.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-indigo-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Profit Margin</p>
                <p className="text-2xl font-bold">{profitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center w-full md:w-auto space-x-2">
            <div className="flex items-center">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search sales..."
                className="ml-2 p-2 border rounded-md w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                className="ml-2 p-2 border rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400" />
              <DatePicker
                selectsRange={true}
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                onChange={(update) => setDateRange(update)}
                className="ml-2 p-2 border rounded-md"
                placeholderText="Select date range"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentSale(initialSale);
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Sale
            </button>
            <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer">
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
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSales.map((sale) => (
              <tr key={sale.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {sale.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">
                    {sale.products?.[0]?.product?.name || 'N/A'} {/* Access product name */}
                  </div>
                  <div className="text-sm text-gray-500">
                    {sale.products?.[0]?.product?.category || 'N/A'} {/* Access category */}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">
                    {sale.customerName || sale.customer || 'N/A'} {/* Handle both customerName and customer */}
                  </div>
                  <div className="text-sm text-gray-500">{sale.paymentMethod || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sale.products?.[0]?.quantity || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ksh {sale.products?.[0]?.product?.price?.toFixed(2) || '0.00'} {/* Access unit price */}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ksh {sale.totalAmount?.toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-medium ${sale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ksh {sale.profit?.toFixed(2) || '0.00'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(sale.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(sale)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(sale.id)}
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

      {/* Add/Edit Sale Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-8 w-full max-w-md max-h-[80vh] overflow-y-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Sale' : 'New Sale'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Product</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={currentSale.products[0]?.product}
                onChange={(e) => {
                  const selectedProductId = e.target.value;
                  const selectedProduct = products.find(p => p._id === selectedProductId);
                  
                  // Update currentSale with selected product details
                  setCurrentSale({
                    ...currentSale,
                    products: [{
                      product: selectedProductId,
                      productName: selectedProduct.name,
                      category: selectedProduct.category,
                      unitPrice: selectedProduct.price,
                      costPrice: selectedProduct.cost,
                      quantity: 1 // Reset quantity to 1
                    }]
                  });
                }}
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.category}) - ksh {product.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={currentSale.products[0]?.quantity}
                onChange={(e) => {
                  setCurrentSale({
                    ...currentSale,
                    products: [{
                      ...currentSale.products[0],
                      quantity: parseInt(e.target.value)
                    }]
                  });
                }}
              />
            </div>

            {/* Display selected product details (read-only) */}
            {currentSale.products[0]?.product && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <p className="text-sm font-medium text-gray-700">Selected Product Details:</p>
                <p className="text-sm text-gray-500">Name: {currentSale.products[0].productName}</p>
                <p className="text-sm text-gray-500">Category: {currentSale.products[0].category}</p>
                <p className="text-sm text-gray-500">Unit Price: ksh {currentSale.products[0].unitPrice}</p>
                <p className="text-sm text-gray-500">Cost Price: ksh {currentSale.products[0].costPrice}</p>
              </div>
            )}

            {/* Customer Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={currentSale.customerName}
                onChange={(e) => setCurrentSale({ ...currentSale, customerName: e.target.value })}
              />
            </div>

            {/* Payment Method Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={currentSale.paymentMethod}
                onChange={(e) => setCurrentSale({ ...currentSale, paymentMethod: e.target.value })}
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>
                    {method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes Textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                value={currentSale.notes}
                onChange={(e) => setCurrentSale({ ...currentSale, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
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
              {isEditing ? 'Update' : 'Create'} Sale
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sales;