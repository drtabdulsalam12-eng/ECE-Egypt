const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'اسم الشركة مطلوب'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  taxNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  commercialRegister: {
    type: String,
    unique: true,
    sparse: true
  },
  address: String,
  governorate: String,
  industry: String,
  logo: String,
  website: String,
  startDate: Date,
  mapLocation: {
    latitude: Number,
    longitude: Number
  },
  businessNature: String,
  workingHours: String,
  workingDays: String,
  description: String,
  licenses: [String],
  commercialRegisterPDF: {
    filename: String,
    filepath: String,
    uploadedAt: Date
  },
  licensesPDFs: [
    {
      filename: String,
      filepath: String,
      uploadedAt: Date
    }
  ],
  employees: [
    {
      jobTitle: String,
      salary: String,
      workDuration: String,
      workHours: String
    }
  ],
  managers: [
    {
      name: String,
      position: String,
      phone: String,
      email: String
    }
  ],
  profileCompletion: {
    step: { type: Number, default: 1 },
    isComplete: { type: Boolean, default: false },
    trustScore: { type: Number, default: 0 }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: null
  }
});

companySchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

companySchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

companySchema.methods.generateVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  return code;
};

companySchema.methods.calculateTrustScore = function() {
  let score = 0;
  let totalFields = 0;
  
  const basicFields = ['companyName', 'email', 'phone', 'address', 'governorate', 'industry', 'logo', 'website', 'startDate', 'businessNature', 'workingHours', 'workingDays', 'description'];
  
  basicFields.forEach(field => {
    totalFields++;
    if (this[field]) {
      score++;
    }
  });
  
  if (this.employees && this.employees.length > 0) {
    score++;
  }
  totalFields++;
  
  if (this.managers && this.managers.length > 0) {
    score++;
  }
  totalFields++;
  
  return Math.round((score / totalFields) * 100);
};

module.exports = mongoose.model('Company', companySchema);
