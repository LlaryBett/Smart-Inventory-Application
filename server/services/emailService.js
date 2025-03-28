const axios = require('axios');

exports.sendWelcomeEmail = async (user, tempPassword) => {
  const url = 'https://api.brevo.com/v3/smtp/email';
  
  const data = {
    sender: {
      name: process.env.SENDER_NAME,
      email: process.env.SENDER_EMAIL
    },
    to: [{ email: user.email }],
    subject: 'Welcome to Inventory System - Account Details',
    htmlContent: `
      <h1>Welcome to the Inventory Management System</h1>
      <p>Hello ${user.name},</p>
      <p>Your account has been created with the following details:</p>
      <p>Email: ${user.email}</p>
      <p>Temporary Password: ${tempPassword}</p>
      <p>Role: ${user.role}</p>
      <p>Please log in and change your password immediately.</p>
      <p>Best regards,<br>Admin Team</p>
    `
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('Welcome email sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending welcome email:', error.response?.data || error.message);
    throw error;
  }
};

exports.sendLowStockAlert = async (product) => {
  const url = 'https://api.brevo.com/v3/smtp/email';
  
  const data = {
    sender: {
      name: process.env.SENDER_NAME,
      email: process.env.SENDER_EMAIL
    },
    to: [{ email: process.env.ADMIN_EMAIL }],
    subject: 'Low Stock Alert',
    htmlContent: `
      <h1>Low Stock Alert</h1>
      <p>Product: ${product.name}</p>
      <p>Current Stock: ${product.stock}</p>
      <p>Please reorder soon.</p>
    `
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('Low stock alert sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending low stock alert:', error.response?.data || error.message);
    throw error;
  }
};

exports.sendPasswordResetEmail = async (user, tempPassword) => {
  const url = 'https://api.brevo.com/v3/smtp/email';

  const data = {
    sender: {
      name: process.env.SENDER_NAME,
      email: process.env.SENDER_EMAIL
    },
    to: [{ email: user.email }],
    subject: 'Password Reset - Inventory System',
    htmlContent: `
      <h1>Password Reset</h1>
      <p>Hello ${user.name},</p>
      <p>Your password has been reset. Your temporary password is:</p>
      <p><strong>${tempPassword}</strong></p>
      <p>Please log in and change your password immediately.</p>
      <p>Best regards,<br>Admin Team</p>
    `
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('Password reset email sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending password reset email:', error.response?.data || error.message);
    throw error;
  }
};

exports.sendEventNotification = async (user, events) => {
  const url = 'https://api.brevo.com/v3/smtp/email';
  
  console.log('Preparing email notification for:', {
    userName: user.name,
    userEmail: user.email,
    eventsCount: events.length
  });

  const eventsHtml = events.map(event => `
    <div style="margin-bottom: 15px;">
      <h3 style="color: #2563eb;">${event.title}</h3>
      <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${event.time || 'Not specified'}</p>
      <p><strong>Type:</strong> ${event.type}</p>
      ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
    </div>
  `).join('');

  const emailData = {
    sender: {
      name: process.env.SENDER_NAME,
      email: process.env.SENDER_EMAIL
    },
    to: [{ email: user.email }],
    subject: 'Upcoming Events Reminder',
    htmlContent: `
      <h1>Your Upcoming Events</h1>
      <p>Hello ${user.name},</p>
      <p>Here are your upcoming events:</p>
      ${eventsHtml}
      <p>Best regards,<br>Admin Team</p>
    `
  };

  console.log('Email payload:', {
    to: emailData.to,
    subject: emailData.subject,
    sender: emailData.sender,
    apiKey: process.env.BREVO_API_KEY ? 'Present' : 'Missing'
  });

  try {
    const response = await axios.post(url, emailData, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('Brevo API Response:', {
      statusCode: response.status,
      data: response.data
    });
    return response.data;
  } catch (error) {
    console.error('Brevo API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};
