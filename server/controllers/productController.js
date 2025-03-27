const Product = require('../models/Product');
const Sale = require('../models/Sale');
const PredictiveAnalytics = require('../services/predictiveAnalytics');

exports.getProducts = async (req, res) => {
  try {
    console.log('Fetching products...'); // Debug log
    const products = await Product.find().lean();
    console.log('Products found:', products.length); // Debug log
    return res.status(200).json(products);
  } catch (error) {
    console.error('Error in getProducts:', error);
    return res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ message: 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ message: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(400).json({ message: 'Failed to delete product' });
  }
};

exports.getProductAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get performance score and predictions
    const performanceData = await PredictiveAnalytics.calculateProductScore(id);
    const salesPrediction = await PredictiveAnalytics.predictFutureSales(id);

    res.json({
      product,
      performance: performanceData,
      prediction: salesPrediction,
      recommendations: {
        shouldRestock: salesPrediction.predictedDailySales > (product.stockThreshold || 10),
        optimumPrice: product.price * (1 + (performanceData.score / 1000)), // Suggest price based on performance
        potentialRevenue: salesPrediction.predictedDailySales * product.price * 30 // Monthly revenue potential
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTopProducts = async (req, res) => {
  try {
    const products = await Product.find();
    const sales = await Sale.find({
      date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    });

    const validSales = sales.filter(sale => sale.products.some(p => p.product));

    const productsWithScores = await Promise.all(
      products.map(async (product) => {
        const productSales = validSales.filter(sale =>
          sale.products.some(p =>
            p.product && p.product._id && p.product._id.toString() === product._id.toString()
          )
        );

        const analytics = await PredictiveAnalytics.calculateProductScore(product._id, productSales);
        const prediction = await PredictiveAnalytics.predictFutureSales(product._id, productSales);

        const totalSold = productSales.reduce((sum, sale) => {
          const productInSale = sale.products.find(p =>
            p.product && p.product._id && p.product._id.toString() === product._id.toString()
          );
          return sum + (productInSale ? productInSale.quantity || 0 : 0);
        }, 0);

        const dailyAverage = totalSold / 90;
        const stockLevel = product.stock || 0;
        const turnoverRate = (dailyAverage > 0) ? stockLevel / dailyAverage : 0;

        // Calculate revenue and profit
        const totalRevenue = productSales.reduce((sum, sale) => {
          const productInSale = sale.products.find(p => 
            p.product && p.product._id && p.product._id.toString() === product._id.toString()
          );
          return sum + (productInSale ? (productInSale.quantity * product.price) || 0 : 0);
        }, 0);

        const totalProfit = totalRevenue - (totalSold * product.cost);

        return {
          ...product.toObject(),
          performanceScore: analytics.score,
          predictedSales: prediction.predictedDailySales,
          turnoverRate,
          totalSold,
          dailyAverage,
          totalRevenue,
          totalProfit
        };
      })
    );

    // Sort products by multiple criteria
    const sortedProducts = productsWithScores.sort((a, b) => {
      // Primary sort by total sold
      if (b.totalSold !== a.totalSold) return b.totalSold - a.totalSold;
      // Secondary sort by daily average
      if (b.dailyAverage !== a.dailyAverage) return b.dailyAverage - a.dailyAverage;
      // Tertiary sort by total profit
      if (b.totalProfit !== a.totalProfit) return b.totalProfit - a.totalProfit;
      // Finally sort by predicted sales
      return b.predictedSales - a.predictedSales;
    });

    const recommendations = sortedProducts.map(product => {
      let action, reason;

      if (product.predictedSales > product.dailyAverage * 1.2) {
        action = 'INCREASE_STOCK';
        reason = `Sales predicted to increase by ${((product.predictedSales / product.dailyAverage - 1) * 100).toFixed(1)}%`;
      } else if (product.turnoverRate > 30) {
        action = 'REDUCE_STOCK';
        reason = `${product.stock} units in stock with only ${product.dailyAverage.toFixed(1)} daily sales`;
      } else {
        action = 'MAINTAIN';
        reason = `Current stock levels optimal for ${product.predictedSales.toFixed(1)} predicted daily sales`;
      }

      return {
        id: product._id,
        name: product.name,
        action,
        reason,
        metrics: {
          currentStock: product.stock,
          avgDailySales: product.dailyAverage,
          predictedDailySales: product.predictedSales,
          totalSold: product.totalSold,
          turnoverDays: product.turnoverRate.toFixed(1)
        }
      };
    });

    res.json({
      topProducts: sortedProducts.slice(0, 10),
      recommendations,
      analyticsMetadata: {
        periodAnalyzed: '90 days',
        totalProductsAnalyzed: products.length,
        dataPoints: sales.length,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      message: error.message,
      debug: {
        salesFound: typeof sales !== 'undefined' ? sales.length : 0,
        productsFound: typeof products !== 'undefined' ? products.length : 0
      }
    });
  }
};

exports.bulkCreateProducts = async (req, res) => {
  console.log('bulkCreateProducts function called'); // Debug log

  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      console.log('Invalid payload: products must be a non-empty array'); // Debug log
      return res.status(400).json({
        message: 'Invalid request: products must be a non-empty array'
      });
    }

    console.log('Received products payload:', JSON.stringify(products, null, 2)); // Debug log

    const validationResults = products.map((product, index) => {
      try {
        const requiredFields = ['name', 'category', 'price', 'cost', 'stock'];
        const missingFields = requiredFields.filter(field => !product[field]);

        if (missingFields.length > 0) {
          return {
            isValid: false,
            index,
            error: `Missing required fields: ${missingFields.join(', ')}`
          };
        }

        const numericFields = ['price', 'cost', 'stock'];
        const invalidNumericFields = numericFields.filter(field =>
          isNaN(Number(product[field])) || Number(product[field]) < 0
        );

        if (invalidNumericFields.length > 0) {
          return {
            isValid: false,
            index,
            error: `Invalid numeric values for: ${invalidNumericFields.join(', ')}`
          };
        }

        return {
          isValid: true,
          product: {
            name: product.name,
            category: product.category,
            price: Number(product.price),
            cost: Number(product.cost),
            stock: Number(product.stock),
            description: product.description || ''
          }
        };
      } catch (error) {
        return {
          isValid: false,
          index,
          error: error.message
        };
      }
    });

    const validationErrors = validationResults.filter(result => !result.isValid);
    if (validationErrors.length > 0) {
      console.log('Validation errors:', JSON.stringify(validationErrors, null, 2)); // Debug log
      return res.status(400).json({
        message: 'Validation failed for some products',
        errors: validationErrors
      });
    }

    const validatedProducts = validationResults.map(result => result.product);

    console.log('Validated products:', JSON.stringify(validatedProducts, null, 2)); // Debug log

    try {
      const createdProducts = await Product.insertMany(validatedProducts, { ordered: false });

      console.log(`Successfully created ${createdProducts.length} products`);

      res.status(201).json({
        success: true,
        message: `Successfully created ${createdProducts.length} products`,
        products: createdProducts
      });
    } catch (bulkError) {
      console.error('Bulk creation error:', bulkError); // Debug log
      return res.status(500).json({
        success: false,
        message: 'Failed to create products in bulk',
        error: bulkError.message,
        details: bulkError.errors ? Object.keys(bulkError.errors).map(key => ({
          field: key,
          message: bulkError.errors[key].message
        })) : null
      });
    }

  } catch (error) {
    console.error('Bulk creation error:', error); // Debug log
    res.status(400).json({
      success: false,
      message: 'Error creating products',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined
    });
  }
};
