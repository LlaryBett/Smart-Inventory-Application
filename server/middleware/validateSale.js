const mongoose = require('mongoose');
const Product = require('../models/Product');

const validateSale = async (req, res, next) => {
  try {
    // Verify authenticated user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: 'No authenticated user found'
      });
    }

    // Check user role
    if (!['admin', 'cashier-out'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Only administrators and cashiers can create sales',
        currentRole: req.user.role
      });
    }

    const { products, customerName, paymentMethod } = req.body;

    // Validate required fields
    if (!customerName || !paymentMethod) {
      return res.status(400).json({
        message: 'Customer name and payment method are required'
      });
    }

    // Validate payment method
    const validPaymentMethods = ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'mobile_payment'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        message: 'Invalid payment method',
        validMethods: validPaymentMethods
      });
    }

    // Validate products array and check ObjectId format
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message: 'Sale must include at least one product'
      });
    }

    // Validate each product ID is a valid ObjectId
    const invalidIds = products.filter(item => !mongoose.Types.ObjectId.isValid(item.product));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: 'Invalid product ID format',
        invalidIds: invalidIds.map(item => item.product)
      });
    }

    // Add products info to request for later use
    req.productsInfo = await Promise.all(
      products.map(async (item) => {
        try {
          const product = await Product.findById(item.product);
          
          if (!product) {
            return {
              ...item,
              isValid: false,
              reason: 'Product not found'
            };
          }

          // Validate required product fields
          if (!item.productName || !item.category || !item.quantity || 
              !item.unitPrice || !item.costPrice) {
            return {
              ...item,
              isValid: false,
              reason: 'Missing required product fields'
            };
          }

          return {
            ...item,
            productInfo: product,
            isValid: product.stock >= item.quantity
          };
        } catch (error) {
          return {
            ...item,
            isValid: false,
            reason: 'Invalid product reference'
          };
        }
      })
    );

    // Check for invalid products
    const invalidProducts = req.productsInfo.filter(item => !item.isValid);
    if (invalidProducts.length > 0) {
      return res.status(400).json({
        message: 'Invalid products in sale',
        invalidProducts: invalidProducts.map(item => ({
          productId: item.product,
          reason: item.reason || 'Insufficient stock',
          requestedQuantity: item.quantity,
          availableStock: item.productInfo?.stock || 0
        }))
      });
    }

    // Add sales person info to request for tracking
    req.salesInfo = {
      salesPerson: req.user._id,
      salesPersonName: req.user.name,
      role: req.user.role
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateSale;
