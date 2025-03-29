import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import { read, utils, writeFile } from 'xlsx';
import { 
  Search, Plus, Download, Upload, Edit2, Trash2, 
  DollarSign, TrendingUp, Package
} from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const initialProduct = {
  name: '',
  category: '',
  price: 0,
  cost: 0,
  stock: 0,
  description: ''
};

const Products = () => {
  const { getAuthToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(initialProduct);
  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalProfit = products.reduce((acc, product) => 
    acc + ((product.price - product.cost) * product.stock), 0);
  const totalInventoryValue = products.reduce((acc, product) => 
    acc + (product.cost * product.stock), 0);
  const lowStockItems = products.filter(product => product.stock < 10).length;

  useEffect(() => {
    let result = [...products];
    
    if (searchTerm) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(result);
  }, [products, searchTerm, selectedCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('https://smart-inventory-application-1.onrender.com/api/products', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      }
    };

    fetchProducts();
  }, [getAuthToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      if (isEditing) {
        const response = await fetch(`https://smart-inventory-application-1.onrender.com/api/products/${currentProduct._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(currentProduct)
        });
        
        if (!response.ok) throw new Error('Failed to update product');
        const updatedProduct = await response.json();
        setProducts(products.map(p => p._id === currentProduct._id ? updatedProduct : p));
        toast.success('Product updated successfully!');
      } else {
        const response = await fetch('https://smart-inventory-application-1.onrender.com/api/products', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(currentProduct)
        });
        
        if (!response.ok) throw new Error('Failed to create product');
        const newProduct = await response.json();
        setProducts([...products, newProduct]);
        toast.success('Product added successfully!');
      }
      setIsModalOpen(false);
      setCurrentProduct(initialProduct);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error saving product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`https://smart-inventory-application-1.onrender.com/api/products/${id}`);
        setProducts(products.filter(p => p._id !== id));
        toast.success('Product deleted successfully!');
      } catch {
        toast.error('Error deleting product');
      }
    }
  };

  const handleEdit = (product) => {
    setCurrentProduct(product);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const ws = utils.json_to_sheet(products);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Products');
    writeFile(wb, 'products.xlsx');
    toast.success('Products exported successfully!');
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
        setProducts(jsonData);
        toast.success('Products imported successfully!');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Other'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <ToastContainer position="top-right" />
      
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Product Management</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="h-6 md:h-8 w-6 md:w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-xs md:text-sm text-gray-500">Total Profit</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">ksh {totalProfit.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Package className="h-6 md:h-8 w-6 md:w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-xs md:text-sm text-gray-500">Inventory Value</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">ksh {totalInventoryValue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-6 md:h-8 w-6 md:w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-xs md:text-sm text-gray-500">Low Stock Items</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">{lowStockItems}</p>
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
                placeholder="Search products..."
                className="ml-2 p-2 border rounded-md w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center w-full">
              <select
                className="p-2 border rounded-md w-full"
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
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentProduct(initialProduct);
                setIsModalOpen(true);
              }}
              className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 min-w-[100px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
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

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                {!isMobile && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                {!isMobile && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                {!isMobile && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.description || 'No description'}</div>
                      {isMobile && (
                        <div className="text-xs text-gray-500 mt-1">
                          Category: {product.category}
                        </div>
                      )}
                    </td>
                    {!isMobile && (
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {product.category}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-500">
                      ksh {Number(product.price).toFixed(2)}
                    </td>
                    {!isMobile && (
                      <td className="px-4 py-3 text-sm text-gray-500">
                        ksh {Number(product.cost).toFixed(2)}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {product.stock}
                    </td>
                    {!isMobile && (
                      <td className="px-4 py-3 text-sm text-gray-500">
                        ksh {((product.price - product.cost) * product.stock).toFixed(2)}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isMobile ? 4 : 7} className="px-4 py-3 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
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
        <h2 className="text-xl md:text-2xl font-bold mb-6">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={currentProduct.name}
              onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              required
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={currentProduct.category}
              onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={currentProduct.price}
                onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={currentProduct.cost}
                onChange={(e) => setCurrentProduct({ ...currentProduct, cost: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              required
              min="0"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={currentProduct.stock}
              onChange={(e) => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={currentProduct.description}
              onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
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
              {isEditing ? 'Update' : 'Add'} Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;