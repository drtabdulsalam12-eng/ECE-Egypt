const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
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
  nationalId: {
    type: String,
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    trim: true
  },
  userType: {
    type: String,
    enum: ['jobseeker', 'company'],
    default: 'jobseeker'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  verificationCode: {
    type: String
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    default: 'male'
  },
  postalCode: {
    type: String,
    default: '',
    trim: true
  },
  college: String,
  highSchool: String,
  governorate: String,
  residence: String,
  educationLevel: String,
  fieldOfStudy: String,
  desiredSalary: Number,
  workFrom: String,
  workTo: String,
  workHours: Number,
  skills: [String],
  languages: [String],
  certificates: [{
    name: String,
    issuer: String,
    date: String,
    fileUrl: String
  }],
  avatar: {
    type: String,
    default: null
  },
  profileCompletion: {
    step: { type: Number, default: 1 },
    isComplete: { type: Boolean, default: false },
    trustScore: { type: Number, default: 0 }
  },
  isProfileCompleted: {
    type: Boolean,
    default: false
  },
  idCard: {
    fileName: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: null }
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

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  return code;
};

userSchema.methods.calculateTrustScore = function() {
  let score = 0;
  let totalFields = 0;
  
  const fieldsToCheck = ['name', 'email', 'nationalId', 'phone', 'college', 'highSchool', 'governorate', 'residence', 'educationLevel', 'fieldOfStudy', 'desiredSalary', 'workHours', 'skills', 'languages', 'certificates'];
  
  fieldsToCheck.forEach(field => {
    totalFields++;
    if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : true)) {
      score++;
    }
  });
  
  const finalScore = Math.round((score / totalFields) * 100);
  this.profileCompletion.trustScore = finalScore;
  return finalScore;
};

module.exports = mongoose.model('User', userSchema);
