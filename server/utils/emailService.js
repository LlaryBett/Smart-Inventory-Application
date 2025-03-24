const sendLowStockAlert = async (products) => {
  try {
    const productsList = products.map(p => 
      `<tr>
        <td>${p.name}</td>
        <td>${p.stock}</td>
        <td>${p.category}</td>
      </tr>`
    ).join('');

    const data = {
      sender: {
        name: process.env.SENDER_NAME,
        email: process.env.SENDER_EMAIL
      },
      to: [{
        email: process.env.SENDER_EMAIL
      }],
      subject: 'Low Stock Alert - Multiple Products',
      htmlContent: `
        <h2>Low Stock Alert</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th>Product</th>
              <th>Current Stock</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            ${productsList}
          </tbody>
        </table>
        <p>Please restock these items soon.</p>
      `
    };

    const response = await fetch('https://api.sendinblue.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('Low stock alert email sent successfully');
  } catch (error) {
    console.error('Failed to send low stock alert:', error);
  }
};

module.exports = { sendLowStockAlert };
