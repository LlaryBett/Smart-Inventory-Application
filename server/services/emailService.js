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
