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
  adminCode: { type: String }, // For admin verification
  rememberMe: { type: Boolean, default: false },
  isFirstLogin: { 
    type: Boolean, 
    default: true // Changed from false to true - all new users should have first login
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

// Hash password before saving - ensure password is string
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password.toString(), salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Simplify comparePassword method to use bcrypt directly
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Compare the raw password with the stored hash
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
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
