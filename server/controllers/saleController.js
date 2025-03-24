const Sale = require('../models/Sale');
const { v4: uuidv4 } = require('uuid'); // Use UUID for unique IDs

// Get all sales with metrics
exports.getSales = async (req, res) => {
  try {
    const { searchTerm, category, startDate, endDate } = req.query;
    let query = {};
    
    if (searchTerm) {
      query.$or = [
        { 'products.name': { $regex: searchTerm, $options: 'i' } },
        { customer: { $regex: searchTerm, $options: 'i' } },
        { salesPerson: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      query['products.category'] = category;
    }
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await Sale.find(query).sort({ date: -1 });

    res.json({ sales }); // Send the full sales data
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create sale
exports.createSale = async (req, res) => {
  try {
    console.log('Incoming request body:', req.body); // Log the incoming payload for debugging

    const {
      products,
      customer,
      paymentMethod,
      salesPerson,
      notes,
      date,
    } = req.body;

    // Validate required fields
    if (!products || products.length === 0) {
      return res.status(400).json({ message: 'Products array is required and cannot be empty.' });
    }

    if (!customer) {
      return res.status(400).json({ message: 'Customer is required.' });
    }

    if (!salesPerson) {
      return res.status(400).json({ message: 'Sales person is required.' });
    }

    // Validate and calculate fields for each product
    const validatedProducts = products.map((product) => {
      if (!product.name || !product.quantity || !product.price || !product.costPrice || !product.category) {
        throw new Error('Each product must include name, quantity, price, costPrice, and category.');
      }

      return {
        ...product,
        totalAmount: product.quantity * product.price,
        profit: product.quantity * (product.price - product.costPrice),
      };
    });

    // Calculate totalAmount and profit for the sale
    const totalAmount = validatedProducts.reduce((acc, p) => acc + p.totalAmount, 0);
    const profit = validatedProducts.reduce((acc, p) => acc + p.profit, 0);

    // Create sale object
    const saleData = {
      id: `SALE-${Date.now()}`, // Generate ID in the format SALE-<timestamp>
      products: validatedProducts,
      customer,
      paymentMethod,
      salesPerson,
      notes,
      totalAmount,
      profit,
      date: date || new Date(),
    };

    const sale = new Sale(saleData);
    await sale.save();

    res.status(201).json(sale);
  } catch (error) {
    console.error('Error creating sale:', error.message); // Log the error for debugging
    res.status(400).json({ message: error.message });
  }
};

// Update sale
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = {
      ...req.body,
      totalAmount: req.body.quantity * req.body.unitPrice,
      profit: (req.body.quantity * req.body.unitPrice) - 
             (req.body.quantity * req.body.costPrice)
    };

    const updatedSale = await Sale.findOneAndUpdate(
      { id: id },
      updatedData,
      { new: true }
    );
    
    if (!updatedSale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    res.json(updatedSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete sale
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSale = await Sale.findOneAndDelete({ id: id });
    
    if (!deletedSale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Import sales
exports.importSales = async (req, res) => {
  try {
    const sales = req.body;
    const savedSales = await Sale.insertMany(
      sales.map((sale) => ({
        ...sale,
        id: sale.id || `SALE-${Date.now()}`, // Ensure ID follows the required format
        totalAmount: sale.quantity * sale.unitPrice,
        profit: (sale.quantity * sale.unitPrice) - (sale.quantity * sale.costPrice),
      }))
    );
    res.status(201).json(savedSales);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
