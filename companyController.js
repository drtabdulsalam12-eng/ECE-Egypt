// ======================================
// Controller للشركات
// ======================================

const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/emailService');

// ======================================
// دالة لإنشاء JWT Token
// ======================================

const generateToken = (companyId) => {
  return jwt.sign(
    { id: companyId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // صالح لمدة 7 أيام
  );
};

// ======================================
// حذف حساب الشركة
// DELETE /api/companies/me
// ======================================

exports.deleteAccount = async (req, res) => {
  try {
    const companyId = req.user._id;
    await Company.findByIdAndDelete(companyId);
    res.status(200).json({ success: true, message: 'تم حذف الحساب بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// تسجيل شركة جديدة
// POST /api/companies/register
// ======================================

exports.registerCompany = async (req, res) => {
  try {
    console.log('📝 طلب تسجيل شركة جديدة');
    console.log('📦 البيانات المستلمة:', JSON.stringify(req.body, null, 2));

    const {
      companyName,
      email,
      phone,
      password,
      governorate,
      field,
      employeesCount,
      logo
    } = req.body;

    // التحقق من وجود الحقول المطلوبة مع رسائل خطأ واضحة
    const missingFields = [];
    if (!companyName) missingFields.push('companyName (اسم الشركة)');
    if (!email) missingFields.push('email (البريد الإلكتروني)');
    if (!phone) missingFields.push('phone (رقم الهاتف)');
    if (!password) missingFields.push('password (كلمة المرور)');
    if (!governorate) missingFields.push('governorate (المحافظة)');
    if (!field) missingFields.push('field (مجال العمل)');
    if (!employeesCount) missingFields.push('employeesCount (عدد الموظفين)');

    if (missingFields.length > 0) {
      console.log('❌ حقول مفقودة:', missingFields);
      return res.status(400).json({
        success: false,
        message: `الحقول التالية مطلوبة: ${missingFields.join(', ')}`,
        missingFields: missingFields
      });
    }

    // التحقق من عدم وجود شركة بنفس البريد
    const existingCompany = await Company.findOne({ email });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'الشركة موجودة بالفعل بنفس البريد الإلكتروني'
      });
    }

    // إنشاء شركة جديدة
    const company = new Company({
      companyName,
      email,
      phone,
      password,
      governorate,
      field,
      employeesCount,
      logo: logo || null
    });

    // إنشاء كود التحقق
    const verificationCode = company.generateVerificationCode();

    // حفظ الشركة في قاعدة البيانات
    await company.save();

    // إرسال كود التحقق عبر البريد الإلكتروني
    const emailSent = await sendVerificationEmail(email, companyName, verificationCode, 'company');

    if (!emailSent) {
      console.warn('لم يتم إرسال البريد الإلكتروني، لكن تم إنشاء الشركة');
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء حساب الشركة بنجاح. تم إرسال كود التحقق إلى بريدك الإلكتروني',
      companyId: company._id,
      nextStep: 'verify-email',
      profileCompletionRequired: true,
      verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    });

  } catch (error) {
    console.error('خطأ في تسجيل الشركة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التسجيل',
      error: error.message
    });
  }
};

// ======================================
// التحقق من كود البريد الإلكتروني
// POST /api/companies/verify-code
// ======================================

exports.verifyCode = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني وكود التحقق مطلوبان'
      });
    }

    // البحث عن الشركة
    const company = await Company.findOne({ email });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    // التحقق من صحة الكود
    console.log(`🔍 Company verification - Stored: ${company.verificationCode}, Provided: ${verificationCode}`);
    if (String(company.verificationCode) !== String(verificationCode)) {
      return res.status(400).json({
        success: false,
        message: 'كود التحقق غير صحيح'
      });
    }

    // تفعيل الحساب (إذا لم يكن مفعلاً)
    company.isVerified = true;
    company.verificationCode = undefined; // حذف الكود بعد التحقق
    company.lastLoginAt = new Date(); // تسجيل وقت الدخول
    await company.save();

    // إنشاء JWT Token
    const token = generateToken(company._id);

    res.status(200).json({
      success: true,
      message: 'تم التحقق بنجاح',
      token,
      nextStep: 'search',
      company: {
        id: company._id,
        companyName: company.companyName,
        email: company.email,
        userType: 'company',
        profileCompletion: company.profileCompletion,
        lastLoginAt: company.lastLoginAt
      }
    });

  } catch (error) {
    console.error('خطأ في التحقق:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق',
      error: error.message
    });
  }
};

// ======================================
// تسجيل الدخول
// POST /api/companies/login
// ======================================

exports.loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني وكلمة المرور مطلوبان'
      });
    }

    // البحث عن الشركة
    const company = await Company.findOne({ email });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'هذا البريد الإلكتروني غير مسجل كشركة لدينا، يرجى إنشاء حساب شركة أولاً'
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await company.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'كلمة المرور غير صحيحة'
      });
    }

    // إنشاء كود تحقق جديد في كل مرة يتم فيها تسجيل الدخول
    const verificationCode = company.generateVerificationCode();
    
    // نستخدم حقل جديد للتحقق من الدخول بدلاً من تغيير isVerified
    company.verificationCode = verificationCode;
    // التأكد من حفظ التغييرات في قاعدة البيانات
    await Company.findByIdAndUpdate(company._id, { verificationCode: verificationCode });

    // إرسال الكود
    const emailSent = await sendVerificationEmail(email, company.companyName, verificationCode, 'company');

    res.status(200).json({
      success: true,
      message: 'تم إرسال كود التحقق إلى بريد الشركة. يرجى إدخاله لإتمام تسجيل الدخول',
      requiresVerification: true,
      email: company.email,
      userType: 'company'
    });

  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الدخول',
      error: error.message
    });
  }
};

// ======================================
// الحصول على بيانات الشركة
// GET /api/companies/profile/:id
// ======================================

exports.getCompanyProfile = async (req, res) => {
  try {
    const companyId = req.params.id;

    const company = await Company.findById(companyId).select('-password -verificationCode');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    res.status(200).json({
      success: true,
      company
    });

  } catch (error) {
    console.error('خطأ في جلب بيانات الشركة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب البيانات',
      error: error.message
    });
  }
};

// ======================================
// إعادة إرسال كود التحقق
// POST /api/companies/resend-code
// ======================================

exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مطلوب'
      });
    }

    const company = await Company.findOne({ email });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    if (company.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'الحساب مفعل بالفعل'
      });
    }

    // إنشاء كود جديد
    const verificationCode = company.generateVerificationCode();
    
    // حفظ الكود الجديد في قاعدة البيانات
    await Company.findByIdAndUpdate(company._id, { verificationCode });

    // إرسال الكود فعلياً عبر البريد الإلكتروني
    console.log(`📧 Re-sending verification email to company: ${email}`);
    const emailSent = await sendVerificationEmail(email, company.companyName, verificationCode, 'company');

    if (!emailSent) {
      console.warn('⚠️ فشل إرسال البريد الإلكتروني للشركة، لكن تم تحديث الكود');
    }

    res.status(200).json({
      success: true,
      message: 'تم إرسال كود التحقق مرة أخرى إلى بريد الشركة',
      verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    });

  } catch (error) {
    console.error('خطأ في إعادة إرسال الكود:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إعادة إرسال الكود',
      error: error.message
    });
  }
};

// ======================================
// تحديث بيانات ملف الشركة (خطوات متعددة)
// POST /api/companies/update-profile
// ======================================

exports.updateCompanyProfile = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { step, data } = req.body;

    console.log(`📝 تحديث الخطوة ${step} للشركة ${companyId}`);
    console.log('📦 البيانات المستلمة:', JSON.stringify(data, null, 2));

    if (!step || !data) {
      return res.status(400).json({
        success: false,
        message: 'الخطوة والبيانات مطلوبة'
      });
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    // تحديث البيانات حسب الخطوة
    switch(step) {
      case 1:
        company.logo = data.logo;
        company.startDate = data.startDate;
        company.businessNature = data.businessNature;
        company.website = data.website;
        company.phone = data.phone;
        company.address = data.address;
        company.workingHours = data.workingHours;
        company.workingDays = data.workingDays;
        company.description = data.description;
        break;
      case 2:
        company.employees = data.employees;
        break;
      case 3:
        company.managers = data.managers;
        break;
      case 4:
      case 5:
        Object.assign(company, data);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'خطوة غير صحيحة'
        });
    }

    company.profileCompletion.step = Math.min(step + 1, 5);
    
    await company.save();

    console.log(`✅ تم حفظ الخطوة ${step} بنجاح`);

    // حساب درجة الثقة
    const trustScore = company.calculateTrustScore();
    company.profileCompletion.trustScore = trustScore;
    company.profileCompletion.isComplete = trustScore === 100;
    
    if (trustScore === 100) {
      company.profileCompletion.step = 5;
    }

    await company.save();

    res.status(200).json({
      success: true,
      message: `تم استكمال الخطوة ${step} بنجاح`,
      profileCompletion: {
        step: company.profileCompletion.step,
        trustScore: trustScore,
        isComplete: trustScore === 100
      }
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث البيانات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث البيانات',
      error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ في الخادم'
    });
  }
};

// ======================================
// تحميل السجل التجاري (PDF)
// POST /api/companies/upload-commercial-register
// ======================================

exports.uploadCommercialRegister = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'يرجى اختيار ملف PDF للسجل التجاري'
      });
    }

    const companyId = req.user._id;
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    company.commercialRegisterPDF = {
      filename: req.file.originalname,
      filepath: req.file.path,
      uploadedAt: new Date()
    };

    await company.save();

    res.status(200).json({
      success: true,
      message: 'تم تحميل السجل التجاري بنجاح',
      file: company.commercialRegisterPDF
    });

  } catch (error) {
    console.error('خطأ في تحميل السجل التجاري:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحميل السجل التجاري',
      error: error.message
    });
  }
};

// ======================================
// تحميل التراخيص (PDFs)
// POST /api/companies/upload-licenses
// ======================================

exports.uploadLicenses = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'يرجى اختيار ملفات PDF للتراخيص'
      });
    }

    const companyId = req.user._id;
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.originalname,
      filepath: file.path,
      uploadedAt: new Date()
    }));

    company.licensesPDFs = company.licensesPDFs || [];
    company.licensesPDFs.push(...uploadedFiles);

    await company.save();

    res.status(200).json({
      success: true,
      message: 'تم تحميل التراخيص بنجاح',
      files: company.licensesPDFs
    });

  } catch (error) {
    console.error('خطأ في تحميل التراخيص:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحميل التراخيص',
      error: error.message
    });
  }
};

// ======================================
// الحصول على حالة اكتمال ملف الشركة
// GET /api/companies/profile-status/:id
// ======================================

exports.getCompanyProfileStatus = async (req, res) => {
  try {
    const companyId = req.params.id;

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    const trustScore = company.calculateTrustScore();

    res.status(200).json({
      success: true,
      profileCompletion: {
        step: company.profileCompletion.step,
        trustScore: trustScore,
        isComplete: trustScore === 100
      }
    });

  } catch (error) {
    console.error('خطأ في جلب حالة ملف الشركة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب البيانات',
      error: error.message
    });
  }
};

// ======================================
// الحصول على بيانات الشركة للتعديل
// GET /api/companies/profile-data/:id
// ======================================

exports.getCompanyProfileData = async (req, res) => {
  try {
    const companyId = req.params.id;
    const company = await Company.findById(companyId).select('-password -verificationCode');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        logo: company.logo,
        startDate: company.startDate,
        businessNature: company.businessNature,
        website: company.website,
        phone: company.phone,
        address: company.address,
        workingHours: company.workingHours,
        workingDays: company.workingDays,
        description: company.description,
        additionalSocial: company.additionalSocial
      }
    });

  } catch (error) {
    console.error('خطأ في جلب بيانات الشركة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب البيانات',
      error: error.message
    });
  }
};

// ======================================
// تحديث بيانات الشركة (التعديل الكامل)
// POST /api/companies/update-company-info
// ======================================

exports.updateCompanyInfo = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { logo, startDate, businessNature, website, phone, address, workingHours, workingDays, description, additionalSocial } = req.body;

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'الشركة غير موجودة'
      });
    }

    // تحديث البيانات
    if (logo) company.logo = logo;
    if (startDate) company.startDate = startDate;
    if (businessNature) company.businessNature = businessNature;
    if (website) company.website = website;
    if (phone) company.phone = phone;
    if (address) company.address = address;
    if (workingHours) company.workingHours = workingHours;
    if (workingDays) company.workingDays = workingDays;
    if (description) company.description = description;
    if (additionalSocial !== undefined) company.additionalSocial = additionalSocial;

    await company.save();

    res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات الشركة بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث بيانات الشركة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث البيانات',
      error: error.message
    });
  }
};
