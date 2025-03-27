const Sale = require('../models/Sale');
const Product = require('../models/Product');

class PredictiveAnalytics {
  // Calculate product performance score based on multiple factors
  static async calculateProductScore(productId, sales) {
    try {
      if (!sales || sales.length === 0) {
        return { score: 0 };
      }

      // Total quantity sold
      const totalQuantity = sales.reduce((sum, sale) => {
        const productInSale = sale.products.find(p => 
          p.product && p.product._id && p.product._id.toString() === productId.toString()
        );
        return sum + (productInSale?.quantity || 0);
      }, 0);

      // Sales frequency (how often the product is bought)
      const uniqueDays = new Set(sales.map(sale => 
        new Date(sale.date).toDateString()
      )).size;
      const salesFrequency = uniqueDays / 90; // Normalize to 90 days

      // Calculate recent sales trend
      const recentSales = sales.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      ).slice(0, 30); // Last 30 sales
      const recentSalesWeight = recentSales.length > 0 ? 1.5 : 1;

      // Calculate final score
      const score = (totalQuantity * 0.5) + 
                    (salesFrequency * 30) + 
                    (recentSales.length * recentSalesWeight);

      return {
        score,
        metrics: {
          totalQuantity,
          salesFrequency,
          recentSalesCount: recentSales.length
        }
      };
    } catch (error) {
      console.error('Error calculating product score:', error);
      return { score: 0 };
    }
  }

  // Calculate sales growth trend
  static calculateSalesGrowth(sales) {
    if (sales.length < 2) return 0;

    const sortedSales = sales.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstHalf = sortedSales.slice(0, Math.floor(sales.length / 2));
    const secondHalf = sortedSales.slice(Math.floor(sales.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, sale) => sum + sale.totalAmount, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, sale) => sum + sale.totalAmount, 0) / secondHalf.length;

    return ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  }

  // Calculate how often customers reorder the same product
  static calculateReorderRate(sales) {
    const customerPurchases = {};
    sales.forEach(sale => {
      const customerId = sale.customer ? sale.customer.toString() : null;
      if (customerId) {
        customerPurchases[customerId] = (customerPurchases[customerId] || 0) + 1;
      }
    });

    const repeatCustomers = Object.values(customerPurchases).filter(purchases => purchases > 1).length;
    return sales.length > 0 ? (repeatCustomers / Object.keys(customerPurchases).length) * 100 : 0;
  }

  // Predict future sales
  static async predictFutureSales(productId) {
    try {
      const recentSales = await Sale.find({
        'products.product': productId,
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });

      const dailySales = new Array(30).fill(0);
      recentSales.forEach(sale => {
        const dayIndex = 29 - Math.floor((Date.now() - sale.date) / (24 * 60 * 60 * 1000));
        if (dayIndex >= 0) {
          dailySales[dayIndex] += 1;
        }
      });

      // Simple moving average prediction
      const movingAverage = dailySales.reduce((sum, sales) => sum + sales, 0) / 30;
      const trend = this.calculateTrend(dailySales);

      return {
        predictedDailySales: movingAverage + trend,
        confidence: this.calculateConfidence(dailySales, movingAverage)
      };
    } catch (error) {
      console.error('Error predicting future sales:', error);
      throw error;
    }
  }

  static calculateTrend(dailySales) {
    const firstHalf = dailySales.slice(0, 15);
    const secondHalf = dailySales.slice(15);
    const firstHalfAvg = firstHalf.reduce((sum, sales) => sum + sales, 0) / 15;
    const secondHalfAvg = secondHalf.reduce((sum, sales) => sum + sales, 0) / 15;
    return secondHalfAvg - firstHalfAvg;
  }

  static calculateConfidence(dailySales, average) {
    const variance = dailySales.reduce((sum, sales) => sum + Math.pow(sales - average, 2), 0) / 30;
    const standardDeviation = Math.sqrt(variance);
    return Math.max(0, Math.min(100, 100 * (1 - (standardDeviation / average))));
  }
}

module.exports = PredictiveAnalytics;
