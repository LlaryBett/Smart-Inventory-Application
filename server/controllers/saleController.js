const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid'); // Use UUID for unique IDs

// Get all sales with metrics
exports.getSales = async (req, res) => {
  try {
    const { searchTerm, category, startDate, endDate } = req.query;
    let query = {};
    
    if (searchTerm) {
      query.$or = [
        { 'products.productName': { $regex: searchTerm, $options: 'i' } },
        { customerName: { $regex: searchTerm, $options: 'i' } },
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

    // Populate all necessary fields
    const sales = await Sale.find(query)
      .sort({ date: -1 })
      .populate('products.product', 'name category price cost stock') // Populate product details
      .populate('salesPerson', 'name email role'); // Populate salesPerson details

    res.json({ sales }); // Send the full sales data
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create sale
exports.createSale = async (req, res) => {
  try {
    const { products, customerName, paymentMethod, notes } = req.body;
    const saleId = `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // First validate all products and check stock
    const validatedProducts = [];
    
    for (const item of products) {
      // Fetch product and log initial stock
      const product = await Product.findById(item.product);
      console.log(`Before sale - Product: ${product.name}, Initial stock: ${product.stock}`);

      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }

      // Calculate new stock
      const newStock = product.stock - item.quantity;
      console.log(`Calculating new stock: ${product.stock} - ${item.quantity} = ${newStock}`);

      // Update product stock
      await Product.findByIdAndUpdate(
        product._id,
        { stock: newStock },
        { new: true }
      );

      console.log(`After update - Product: ${product.name}, New stock: ${newStock}`);

      validatedProducts.push({
        product: product._id,
        productName: product.name,
        category: product.category,
        quantity: item.quantity,
        unitPrice: product.price,
        costPrice: product.cost,
        unitCost: {
          base: product.cost,
          shipping: item.unitCost?.shipping || 0,
          storage: item.unitCost?.storage || 0,
          labor: item.unitCost?.labor || 0,
          overhead: item.unitCost?.overhead || 0,
          total: product.cost + (item.unitCost?.shipping || 0) + (item.unitCost?.storage || 0) + (item.unitCost?.labor || 0) + (item.unitCost?.overhead || 0),
        }
      });
    }

    // Calculate totals
    const totalAmount = validatedProducts.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalProfit = validatedProducts.reduce((sum, item) => sum + (item.quantity * (item.unitPrice - item.costPrice)), 0);

    // Create and save the sale
    const sale = new Sale({
      id: saleId,
      products: validatedProducts,
      customerName,
      paymentMethod,
      salesPerson: req.user._id,
      totalAmount,
      profit: totalProfit,
      notes,
    });

    await sale.save();

    // Verify final stock levels
    for (const item of validatedProducts) {
      const updatedProduct = await Product.findById(item.product);
      console.log(`Final verification - Product: ${updatedProduct.name}, Final stock: ${updatedProduct.stock}`);
    }

    // Populate response data
    await sale.populate('products.product salesPerson');

    res.status(201).json({
      message: 'Sale created successfully',
      sale,
    });
  } catch (error) {
    console.error('Sale creation error:', error);
    res.status(400).json({
      message: 'Error creating sale',
      error: error.message,
    });
  }
};

// Get a single sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the sale by ID and populate necessary fields
    const sale = await Sale.findOne({ id })
      .populate('products.product', 'name category price cost stock') // Populate product details
      .populate('salesPerson', 'name email role'); // Populate salesPerson details

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json({ sale });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
