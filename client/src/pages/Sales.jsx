import { useState, useEffect } from 'react';
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
    product: '',
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
  const [products, setProducts] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await fetch('https://smart-inventory-application-1.onrender.com/api/sales', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        setSales(data.sales);
        setIsLoading(false);
      } catch (error) {
        toast.error(error.message);
        setIsLoading(false);
      }
    };

    fetchSales();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const response = await axios.get('https://smart-inventory-application-1.onrender.com/api/products', {
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

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  const totalProfit = sales.reduce((acc, sale) => acc + sale.profit, 0);
  const averageTicketSize = sales.length > 0 ? totalRevenue / sales.length : 0;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  useEffect(() => {
    let result = [...sales];
    
    if (searchTerm) {
      result = result.filter(sale =>
        sale.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.salesPerson?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      result = result.filter(sale => sale.category === selectedCategory);
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
            product: currentSale.products[0].product,
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
        const response = await fetch(`https://smart-inventory-application-1.onrender.com/api/sales/${currentSale.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(saleData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        setSales(sales.map((s) => (s.id === currentSale.id ? data.sale : s)));
        toast.success('Sale updated successfully!');
      } else {
        const response = await fetch('https://smart-inventory-application-1.onrender.com/api/sales', {
          method: 'POST',
          headers,
          body: JSON.stringify(saleData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        const populatedSale = await fetch(`https://smart-inventory-application-1.onrender.com/api/sales/${data.sale.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then((res) => res.json());

        setSales([...sales, populatedSale.sale]);
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
        const response = await fetch(`https://smart-inventory-application-1.onrender.com/api/sales/${id}`, {
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
          const response = await fetch('https://smart-inventory-application-1.onrender.com/api/sales/import', {
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

  const handleEdit = (sale) => {
    setCurrentSale(sale);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleFilter = () => {
    const filtered = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return saleDate >= start && saleDate <= end;
    });
    setFilteredSales(filtered);
  };

  const handleAddSale = () => {
    setIsEditing(false);
    setCurrentSale(initialSale);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Other'];
  const paymentMethods = ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'mobile_payment'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <h1 className="text-xl font-semibold text-gray-900">Sales</h1>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-24 px-2 py-1 text-sm border rounded"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-24 px-2 py-1 text-sm border rounded"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFilter}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Filter
                </button>
                <button
                  onClick={handleAddSale}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  New Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-[1920px] mx-auto px-4 py-8">
        <ToastContainer position="top-right" />
        
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Sales Management</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-500 flex-shrink-0" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-xl md:text-2xl font-bold">ksh {totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-blue-500 flex-shrink-0" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Profit</p>
                  <p className="text-xl md:text-2xl font-bold">ksh {totalProfit.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <div className="flex items-center">
                <ArrowUpRight className="h-6 w-6 md:h-8 md:w-8 text-purple-500 flex-shrink-0" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Average Ticket</p>
                  <p className="text-xl md:text-2xl font-bold">ksh {averageTicketSize.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingDown className="h-6 w-6 md:h-8 md:w-8 text-indigo-500 flex-shrink-0" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Profit Margin</p>
                  <p className="text-xl md:text-2xl font-bold">{profitMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"> {/* Reduced from gap-4 to gap-2 */}
            <div className="relative">
              <div className="flex items-center">
                <Search className="h-5 w-5 text-gray-400 absolute left-3" />
                <input
                  type="text"
                  placeholder="Search sales..."
                  className="pl-10 p-1.5 border rounded-md w-32 sm:w-48" // Reduced padding from p-2 to p-1.5
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 absolute left-3" />
                <select
                  className="pl-10 p-1.5 border rounded-md w-32 sm:w-48" // Reduced padding from p-2 to p-1.5
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 absolute left-3" />
                <DatePicker
                  selectsRange={true}
                  startDate={dateRange[0]}
                  endDate={dateRange[1]}
                  onChange={(update) => setDateRange(update)}
                  className="pl-10 p-1.5 border rounded-md w-32 sm:w-48" // Reduced padding and width
                  placeholderText="Select date range"
                />
              </div>
            </div>

            <div className="flex gap-1 sm:justify-end"> {/* Reduced gap from gap-2 to gap-1 */}
              <button
                onClick={() => {
                  setIsEditing(false);
                  setCurrentSale(initialSale);
                  setIsModalOpen(true);
                }}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">New</span>
              </button>
              <label className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer text-sm whitespace-nowrap">
                <Upload className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Import</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
              <button
                onClick={handleExport}
                className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm whitespace-nowrap"
              >
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[1000px]">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{sale.id}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {sale.products?.[0]?.product?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.products?.[0]?.product?.category || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {sale.customerName || sale.customer || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{sale.paymentMethod || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {sale.products?.[0]?.quantity || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        ksh {sale.products?.[0]?.product?.price?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        ksh {sale.totalAmount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${sale.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ksh {sale.profit?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(sale.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(sale)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sale.id)}
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
        </div>

        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-4"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        >
          <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Sale' : 'New Sale'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Product</label>
              <select
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={currentSale.products[0]?.product}
                onChange={(e) => {
                  const selectedProductId = e.target.value;
                  const selectedProduct = products.find(p => p._id === selectedProductId);
                  
                  setCurrentSale({
                    ...currentSale,
                    products: [{
                      product: selectedProductId,
                      productName: selectedProduct?.name,
                      category: selectedProduct?.category,
                      unitPrice: selectedProduct?.price,
                      costPrice: selectedProduct?.cost,
                      quantity: 1
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

            {currentSale.products[0]?.product && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <p className="text-sm font-medium text-gray-700">Selected Product Details:</p>
                <p className="text-sm text-gray-500">Name: {currentSale.products[0].productName}</p>
                <p className="text-sm text-gray-500">Category: {currentSale.products[0].category}</p>
                <p className="text-sm text-gray-500">Unit Price: ksh {currentSale.products[0].unitPrice}</p>
                <p className="text-sm text-gray-500">Cost Price: ksh {currentSale.products[0].costPrice}</p>
              </div>
            )}

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

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                value={currentSale.notes}
                onChange={(e) => setCurrentSale({ ...currentSale, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
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
    </div>
  );
};

export default Sales;