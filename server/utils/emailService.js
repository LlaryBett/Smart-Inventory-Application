const sendLowStockAlert = async ({ products, threshold }) => {
  try {
    const data = {
      sender: {
        name: process.env.SENDER_NAME || 'Inventory System',
        email: process.env.SENDER_EMAIL
      },
      to: [{ email: process.env.ADMIN_EMAIL }],
      subject: '⚠️ Low Stock Alert',
      htmlContent: `
        <div style="font-family: 'Arial', sans-serif; background-color: #f4f4f4; color: #333; padding: 20px; border-radius: 10px;">
          <h2 style="color: #e74c3c;">Low Stock Alert</h2>
          <p>The following products are below the threshold of ${threshold} units:</p>
          <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 15px 0;">
            ${products.map(p => `
              <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                <strong style="color: #2c3e50;">${p.name}</strong> (${p.category})<br>
                Current stock: <span style="color: #e74c3c; font-weight: bold;">${p.stock}</span>
              </div>
            `).join('')}
          </div>
          <p style="color: #7f8c8d; margin-top: 20px;">Please take necessary action to restock these items.</p>
        </div>
      `
    };

    console.log('Sending low stock alert for', products.length, 'products');

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
      const errorData = await response.json();
      throw new Error(`Email API error: ${response.status}, ${JSON.stringify(errorData)}`);
    }

    console.log('Low stock alert sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send low stock alert:', error);
    throw error;
  }
};

const sendEventNotification = async (emails, events) => {
  try {
    console.log('Received events for email:', events); // Debug log

    const eventDetails = events.map(event => {
      const eventDate = new Date(event.date);
      return `
        <div style="padding: 20px; margin-bottom: 20px; background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
          <h2 style="color: #3498db; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 5px;">${event.title}</h2>
          <p style="margin: 10px 0; font-size: 16px; color: #555;"><strong>Description:</strong> ${event.description || 'No description provided'}</p>
          <p style="margin: 10px 0; font-size: 16px; color: #555;"><strong>Date:</strong> ${eventDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p style="margin: 10px 0; font-size: 16px; color: #555;"><strong>Time:</strong> ${event.time || 'Not specified'}</p>
          <p style="margin: 10px 0; font-size: 16px; color: #555;"><strong>Type:</strong> ${event.type}</p>
        </div>
      `;
    }).join('');

    const data = {
      sender: {
        name: process.env.SENDER_NAME || 'Inventory System',
        email: process.env.SENDER_EMAIL
      },
      to: emails.map(email => ({ email })),
      subject: '🔔 Upcoming Events Notification',
      htmlContent: `
        <div style="font-family: 'Arial', sans-serif; background-color: #f4f4f4; color: #333; padding: 20px; border-radius: 10px;">
          <h1 style="color: #2c3e50; border-bottom: 3px solid #2c3e50; padding-bottom: 10px; margin-bottom: 20px;">📅 Upcoming Events</h1>
          ${eventDetails}
          <p style="margin-top: 30px; color: #777; font-size: 14px; font-style: italic;">This is an automated notification from your inventory management system.</p>
          <div style="margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Smart Inventory System. All rights reserved.
          </div>
        </div>
      `
    };

    console.log('Sending email with data:', {
      sender: data.sender,
      recipients: data.to.length,
      eventsCount: events.length
    }); // Debug log

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
      const errorData = await response.json();
      throw new Error(`Email API error: ${response.status}, ${JSON.stringify(errorData)}`);
    }

    console.log('Event notification email sent successfully');
  } catch (error) {
    console.error('Failed to send event notification:', error);
    throw error;
  }
};

module.exports = {
  sendLowStockAlert,
  sendEventNotification
};
