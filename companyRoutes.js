const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const companyController = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');

// إعداد multer لتحميل الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/companies/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // قبول ملفات PDF فقط
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('يجب أن يكون الملف PDF'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // حد أقصى 5MB
});

router.post('/register', companyController.registerCompany);
router.post('/login', companyController.loginCompany);
router.post('/verify-code', companyController.verifyCode);
router.post('/resend-code', companyController.resendVerificationCode);
router.get('/profile/:id', protect, companyController.getCompanyProfile);
router.post('/update-profile', protect, companyController.updateCompanyProfile);
router.get('/profile-status/:id', companyController.getCompanyProfileStatus);
router.get('/profile-data/:id', protect, companyController.getCompanyProfileData);
router.post('/update-company-info', protect, companyController.updateCompanyInfo);
router.post('/upload-commercial-register', protect, upload.single('file'), companyController.uploadCommercialRegister);
router.post('/upload-licenses', protect, upload.array('files', 5), companyController.uploadLicenses);
router.delete('/me', protect, companyController.deleteAccount);

module.exports = router;
