import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import { read, utils, writeFile } from 'xlsx';
import {
  Search,
  Plus,
  Download,
  Upload,
  BarChart3,
  X,
  Save,
  Filter,
  Edit,
  Trash2,
  MoreVertical,
  Menu
} from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

Modal.setAppElement('#root');

const initialService = {
  name: '',
  price: 0,
  category: '',
  description: ''
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [metrics, setMetrics] = useState({
    totalServices: 0,
    activeServices: 0,
    averagePrice: 0,
    totalRevenuePotential: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newService, setNewService] = useState(initialService);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const categories = Array.from(new Set(services.map(service => service.category)));
  
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
    const matchesPrice = service.price >= priceRange.min && service.price <= priceRange.max;
    return matchesSearch && matchesCategory && matchesPrice;
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) {
          toast.error('No token found. Please log in.');
          return;
        }

        const response = await fetch('https://smart-inventory-application-1.onrender.com/api/services', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        if (data.services && Array.isArray(data.services)) {
          setServices(data.services);
          setMetrics(data.metrics);
        } else {
          console.error('Invalid services data:', data);
          setServices([]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error(error.message);
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleAddService = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch('https://smart-inventory-application-1.onrender.com/api/services', {
        method: 'POST',
        headers,
        body: JSON.stringify(newService)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setServices([...services, data]);
      setIsModalOpen(false);
      setNewService(initialService);
      toast.success('Service added successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = async (service) => {
    setEditingService(service);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`https://smart-inventory-application-1.onrender.com/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      setServices(services.filter(s => s.id !== serviceId));
      toast.success('Service deleted successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdateService = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`https://smart-inventory-application-1.onrender.com/api/services/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingService)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setServices(services.map(s => s.id === editingService.id ? data : s));
      setIsEditModalOpen(false);
      setEditingService(null);
      toast.success('Service updated successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const exportToExcel = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch('https://smart-inventory-application-1.onrender.com/api/services', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      const ws = utils.json_to_sheet(data.services);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Services');
      writeFile(wb, 'services.xlsx');
      toast.success('Services exported successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const importFromExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = utils.sheet_to_json(ws);
      
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch('https://smart-inventory-application-1.onrender.com/api/services/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jsonData)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      
      setServices(prevServices => [...prevServices, ...result]);
      toast.success('Services imported successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <ToastContainer position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Services Management</h1>
        </div>
        
        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex items-center px-3 py-2 border rounded text-gray-500 border-gray-500"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Action Buttons */}
        <div className={`flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto ${showMobileMenu ? 'block' : 'hidden md:flex'}`}>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center justify-center px-3 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm md:text-base"
          >
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Analytics
          </button>
          <label className="flex items-center justify-center px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer text-sm md:text-base">
            <Upload className="w-4 h-4 md:w-5 md:h-5 mr-2" />
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
            className="flex items-center justify-center px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
          >
            <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Export
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm md:text-base"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Add Service
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="md:flex md:gap-4 mb-6 space-y-4 md:space-y-0">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden w-full flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg"
        >
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </button>

        <div className={`flex flex-col md:flex-row gap-4 ${showFilters ? 'block' : 'hidden md:flex'}`}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min Price"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
              className="w-full md:w-24 px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max Price"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
              className="w-full md:w-24 px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="mb-8 p-4 md:p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Service Analytics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm md:text-lg font-medium text-blue-800">Total Services</h3>
              <p className="text-xl md:text-2xl font-bold text-blue-600">{metrics.totalServices}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm md:text-lg font-medium text-green-800">Active Services</h3>
              <p className="text-xl md:text-2xl font-bold text-green-600">{metrics.activeServices}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="text-sm md:text-lg font-medium text-purple-800">Average Price</h3>
              <p className="text-xl md:text-2xl font-bold text-purple-600">ksh {metrics.averagePrice.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="text-sm md:text-lg font-medium text-yellow-800">Revenue Potential</h3>
              <p className="text-xl md:text-2xl font-bold text-yellow-600">ksh {metrics.totalRevenuePotential.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="hidden md:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="hidden md:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                    No services found
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service._id || service.id}>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{service.name}</div>
                      <div className="md:hidden text-sm text-gray-500">{service.category}</div>
                    </td>
                    <td className="hidden md:table-cell px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.category}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ksh {service.price?.toFixed(2)}
                    </td>
                    <td className="hidden md:table-cell px-4 md:px-6 py-4 text-sm text-gray-500">
                      {service.description}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden sm:flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="relative sm:hidden">
                          <button
                            onClick={() => setShowMobileActions(showMobileActions === service.id ? null : service.id)}
                            className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          {showMobileActions === service.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                              <button
                                onClick={() => handleEdit(service)}
                                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(service.id)}
                                className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-4 md:p-8 w-[95%] md:w-full max-w-md mx-4"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Add New Service</h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              value={newService.price}
              onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <input
              type="text"
              value={newService.category}
              onChange={(e) => setNewService({ ...newService, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>
          <button
            onClick={handleAddService}
            className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Service
          </button>
        </div>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={() => {
          setIsEditModalOpen(false);
          setEditingService(null);
        }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-4 md:p-8 w-[95%] md:w-full max-w-md mx-4"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Edit Service</h2>
          <button
            onClick={() => {
              setIsEditModalOpen(false);
              setEditingService(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {editingService && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={editingService.name}
                onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                value={editingService.price}
                onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                type="text"
                value={editingService.category}
                onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editingService.description}
                onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
            <button
              onClick={handleUpdateService}
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Save className="w-5 h-5 mr-2" />
              Update Service
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Services;