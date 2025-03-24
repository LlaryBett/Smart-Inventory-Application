const Service = require('../models/Service');

// Get all services
const getServices = async (req, res) => {
  try {
    const { searchTerm, category, status } = req.query;
    let query = {};
    
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { technician: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const services = await Service.find(query).sort({ createdAt: -1 });
    
    // Calculate metrics
    const metrics = {
      totalServices: services.length,
      activeServices: services.filter(s => s.status === 'active').length,
      averagePrice: services.length > 0 ? 
        services.reduce((acc, s) => acc + s.price, 0) / services.length : 0,
      totalRevenuePotential: services
        .filter(s => s.status === 'active')
        .reduce((acc, s) => acc + s.price, 0)
    };

    res.json({ services, metrics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new service
const createService = async (req, res) => {
  try {
    const serviceData = {
      ...req.body,
      id: `SRV-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const service = new Service(serviceData);
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a service
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = {
      ...req.body,
      updatedAt: new Date()
    };

    const service = await Service.findOneAndUpdate(
      { id },
      updatedData,
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a service
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findOneAndDelete({ id });
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Import services
const importServices = async (req, res) => {
  try {
    const services = req.body;
    const savedServices = await Service.insertMany(
      services.map(service => ({
        ...service,
        id: service.id || `SRV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );
    res.status(201).json(savedServices);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getServices,
  createService,
  updateService,
  deleteService,
  importServices
};
