const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'cashier_in', 'cashier_out', 'other'], // Correct enum values
    default: 'other'
  },
  department: { type: String, default: '' },
  rememberMe: { type: Boolean, default: false },
  isFirstLogin: { 
    type: Boolean, 
    default: function() {
      return this.role !== 'admin'; // Admins should not have first login flag set to true
    }
  },
  lastLogin: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  id: { type: String, required: true, unique: true }, // Ensure ID is required
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Required false since admin can self-register
  }
}, {
  timestamps: true
});

// Pre-save hook to hash the password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); // Only hash if modified
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  console.log('Entered password:', enteredPassword);
  console.log('Stored hashed password:', this.password);
  
  const result = await bcrypt.compare(enteredPassword, this.password);
  console.log('Password match result:', result); // Should be true or false
  return result;
};

// Add setRolePermissions method to the schema
userSchema.methods.setRolePermissions = function() {
  switch (this.role) {
    case 'admin':
      this.permissions = ['read', 'write', 'delete', 'manage_users', 'manage_settings'];
      break;
    case 'cashier_in':
      this.permissions = ['read', 'write', 'manage_sales'];
      break;
    case 'cashier_out':
      this.permissions = ['read', 'write', 'manage_purchases'];
      break;
    default:
      this.permissions = ['read'];
  }
};

module.exports = mongoose.model('User', userSchema);
