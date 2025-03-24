const Purchase = require('../models/Purchase');

exports.getPurchases = async (req, res) => {
  try {
    const { searchTerm, category, startDate, endDate, paymentStatus } = req.query;
    let query = {};
    
    if (searchTerm) {
      query.$or = [
        { productName: { $regex: searchTerm, $options: 'i' } },
        { supplier: { $regex: searchTerm, $options: 'i' } },
        { invoiceNumber: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    if (category) query.category = category;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const purchases = await Purchase.find(query).sort({ date: -1 });
    
    // Calculate metrics
    const metrics = {
      totalCost: purchases.reduce((acc, p) => acc + p.totalCost, 0),
      pendingPayments: purchases
        .filter(p => p.paymentStatus === 'pending')
        .reduce((acc, p) => acc + p.totalCost, 0),
      totalPurchases: purchases.length,
      averageCost: purchases.length > 0 ? 
        purchases.reduce((acc, p) => acc + p.totalCost, 0) / purchases.length : 0
    };

    res.json({ purchases, metrics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPurchase = async (req, res) => {
  try {
    const purchaseData = {
      ...req.body,
      id: `PUR-${Date.now()}`,
      totalCost: req.body.quantity * req.body.unitCost
    };
    
    const purchase = new Purchase(purchaseData);
    await purchase.save();
    res.status(201).json(purchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = {
      ...req.body,
      totalCost: req.body.quantity * req.body.unitCost
    };

    const purchase = await Purchase.findOneAndUpdate(
      { id },
      updatedData,
      { new: true }
    );
    
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    
    res.json(purchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await Purchase.findOneAndDelete({ id });
    
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.importPurchases = async (req, res) => {
  try {
    const purchases = req.body;
    const savedPurchases = await Purchase.insertMany(
      purchases.map(purchase => ({
        ...purchase,
        id: purchase.id || `PUR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        totalCost: purchase.quantity * purchase.unitCost
      }))
    );
    res.status(201).json(savedPurchases);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
