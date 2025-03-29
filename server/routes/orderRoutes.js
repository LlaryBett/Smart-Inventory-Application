router.post('/', auth, (req, res, next) => {
  console.log('Order creation route triggered');
  next();
}, orderController.createOrder);

router.put('/:id/status', auth, (req, res, next) => {
  console.log('Order status update route triggered');
  next();
}, orderController.updateOrderStatus);
