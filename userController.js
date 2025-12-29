// ======================================
// Controller للمستخدمين (الباحثين عن عمل)
// ======================================

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/emailService');

// ======================================
// دالة لإنشاء JWT Token
// ======================================

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // صالح لمدة 7 أيام
  );
};

// ======================================
// حذف الحساب
// DELETE /api/users/me
// ======================================

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ success: true, message: 'تم حذف الحساب بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// إضافة صديق
// POST /api/users/add-friend
// ======================================

exports.addFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user._id;

    if (userId.toString() === friendId) {
      return res.status(400).json({ success: false, message: 'لا يمكنك إضافة نفسك كصديق' });
    }

    const user = await User.findById(userId);
    if (user.friends.includes(friendId)) {
      return res.status(400).json({ success: false, message: 'هذا المستخدم موجود بالفعل في قائمة أصدقائك' });
    }

    user.friends.push(friendId);
    await user.save();

    res.status(200).json({ success: true, message: 'تم إضافة الصديق بنجاح' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// الحصول على ملف المستخدم باستخدام التوكن (للأمان)
// GET /api/users/profile-by-token
// ======================================

exports.getProfileByToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password -verificationCode');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// تسجيل مستخدم جديد
// POST /api/users/register
// ======================================

exports.registerUser = async (req, res) => {
  try {
    console.log('📝 طلب تسجيل مستخدم جديد');
    console.log('📦 البيانات المستلمة:', JSON.stringify(req.body, null, 2));

    const {
      name,
      nationalId,
      email,
      phone,
      password,
      gender,
      postalCode,
      college,
      highSchool,
      governorate,
      desiredSalary,
      workFrom,
      workTo,
      skills,
      languages,
      certificates
    } = req.body;

    // التحقق من وجود الحقول المطلوبة مع رسائل خطأ واضحة
    // ملاحظة: nationalId و governorate اختيارية في التسجيل الأولي
    const missingFields = [];
    if (!name) missingFields.push('name (الاسم)');
    if (!email) missingFields.push('email (البريد الإلكتروني)');
    if (!phone) missingFields.push('phone (رقم الهاتف)');
    if (!password) missingFields.push('password (كلمة المرور)');

    if (missingFields.length > 0) {
      console.log('❌ حقول مفقودة:', missingFields);
      return res.status(400).json({
        success: false,
        message: `الحقول التالية مطلوبة: ${missingFields.join(', ')}`,
        missingFields: missingFields
      });
    }

    // التحقق من عدم وجود مستخدم بنفس البريد أو الرقم القومي
    const existingUser = await User.findOne({
      $or: [{ email }, { nationalId }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'المستخدم موجود بالفعل بنفس البريد الإلكتروني أو الرقم القومي'
      });
    }

    // حساب ساعات العمل تلقائياً إذا تم توفير workFrom و workTo
    let workHours = 0;
    if (workFrom && workTo) {
      const [fromHour, fromMin] = workFrom.split(':').map(Number);
      const [toHour, toMin] = workTo.split(':').map(Number);
      workHours = (toHour + toMin / 60) - (fromHour + fromMin / 60);
    }

    // إنشاء مستخدم جديد (يتم إضافة gender و postalCode لاحقاً من Personal_info)
    const user = new User({
      name,
      nationalId,
      email,
      phone,
      password,
      gender: gender || 'male',
      postalCode: postalCode || '',
      college,
      highSchool,
      governorate,
      desiredSalary,
      workFrom,
      workTo,
      workHours,
      skills: skills || [],
      languages: languages || [],
      certificates: certificates || [],
      isProfileCompleted: false
    });

    // إنشاء كود التحقق
    const verificationCode = user.generateVerificationCode();

    // حفظ المستخدم في قاعدة البيانات
    await user.save();

    // إرسال كود التحقق عبر البريد الإلكتروني
    const emailSent = await sendVerificationEmail(email, name, verificationCode, 'user');

    if (!emailSent) {
      // حتى لو فشل إرسال البريد، نعيد الكود في الرد (للتطوير)
      console.warn('لم يتم إرسال البريد الإلكتروني، لكن تم إنشاء المستخدم');
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح. تم إرسال كود التحقق إلى بريدك الإلكتروني',
      userId: user._id,
      nextStep: 'verify-email',
      profileCompletionRequired: true,
      verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    });

  } catch (error) {
    console.error('خطأ في تسجيل المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التسجيل',
      error: error.message
    });
  }
};

// ======================================
// التحقق من كود البريد الإلكتروني
// POST /api/users/verify-code
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

    // البحث عن المستخدم
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من صحة الكود
    console.log(`🔍 User verification - Stored: ${user.verificationCode}, Provided: ${verificationCode}`);
    if (String(user.verificationCode) !== String(verificationCode)) {
      return res.status(400).json({
        success: false,
        message: 'كود التحقق غير صحيح'
      });
    }

    // تفعيل الحساب (إذا لم يكن مفعلاً)
    user.isVerified = true;
    user.verificationCode = undefined; // حذف الكود بعد التحقق
    user.lastLoginAt = new Date(); // تسجيل وقت الدخول
    
    // إذا لم يكن لديه isProfileCompleted محدد، تعيين false (للمستخدمين القدامى)
    if (user.isProfileCompleted === undefined || user.isProfileCompleted === null) {
      user.isProfileCompleted = false;
    }
    
    // استخدام findByIdAndUpdate بدلاً من save لتجنب مشاكل التحقق
    const updatedUser = await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      verificationCode: undefined,
      lastLoginAt: user.lastLoginAt,
      isProfileCompleted: user.isProfileCompleted
    }, { new: true });

    // إنشاء JWT Token
    const token = generateToken(user._id);

    // حساب درجة الثقة
    const trustScore = updatedUser.calculateTrustScore();

    res.status(200).json({
      success: true,
      message: 'تم التحقق بنجاح',
      token,
      nextStep: 'search',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        userType: 'jobseeker',
        isProfileCompleted: updatedUser.isProfileCompleted || false,
        profileCompletion: {
          step: updatedUser.profileCompletion.step,
          trustScore: trustScore,
          isComplete: trustScore === 100
        },
        lastLoginAt: updatedUser.lastLoginAt
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
// POST /api/users/login
// ======================================

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني وكلمة المرور مطلوبان'
      });
    }

    // البحث عن المستخدم
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'هذا البريد الإلكتروني غير مسجل لدينا، يرجى إنشاء حساب جديد أولاً'
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'كلمة المرور غير صحيحة'
      });
    }

    // إنشاء كود تحقق جديد في كل مرة يتم فيها تسجيل الدخول
    const verificationCode = user.generateVerificationCode();
    
    // نستخدم حقل جديد للتحقق من الدخول بدلاً من تغيير isVerified
    user.verificationCode = verificationCode;
    // التأكد من حفظ التغييرات في قاعدة البيانات
    await User.findByIdAndUpdate(user._id, { verificationCode: verificationCode });

    // إرسال الكود
    const emailSent = await sendVerificationEmail(email, user.name, verificationCode, 'user');

    res.status(200).json({
      success: true,
      message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني. يرجى إدخاله لإتمام تسجيل الدخول',
      requiresVerification: true,
      email: user.email,
      userType: 'jobseeker'
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
// الحصول على بيانات المستخدم
// GET /api/users/profile/:id
// ======================================

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select('-password -verificationCode');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب البيانات',
      error: error.message
    });
  }
};

// ======================================
// إعادة إرسال كود التحقق
// POST /api/users/resend-code
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

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'الحساب مفعل بالفعل'
      });
    }

    // إنشاء كود جديد
    const verificationCode = user.generateVerificationCode();
    
    // حفظ الكود الجديد في قاعدة البيانات
    await User.findByIdAndUpdate(user._id, { verificationCode });

    // إرسال الكود فعلياً عبر البريد الإلكتروني
    console.log(`📧 Re-sending verification email to: ${email}`);
    const emailSent = await sendVerificationEmail(email, user.name, verificationCode, 'user');

    if (!emailSent) {
      console.warn('⚠️ فشل إرسال البريد الإلكتروني، لكن تم تحديث الكود في قاعدة البيانات');
    }

    res.status(200).json({
      success: true,
      message: 'تم إرسال كود التحقق مرة أخرى إلى بريدك الإلكتروني',
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
// تحديث بيانات الملف الشخصي (خطوات متعددة)
// POST /api/users/update-profile
// ======================================

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { step, data } = req.body;

    if (!step || !data) {
      return res.status(400).json({
        success: false,
        message: 'الخطوة والبيانات مطلوبة'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // تحديث البيانات حسب الخطوة
    switch(step) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        Object.assign(user, data);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'خطوة غير صحيحة'
        });
    }

    user.profileCompletion.step = Math.min(step + 1, 5);
    
    await user.save();

    // حساب درجة الثقة
    const trustScore = user.calculateTrustScore();
    user.profileCompletion.trustScore = trustScore;
    user.profileCompletion.isComplete = trustScore === 100;
    
    if (trustScore === 100) {
      user.profileCompletion.step = 5;
    }

    await user.save();

    // تحديث isProfileCompleted إذا اكتمل الملف الشخصي
    if (trustScore === 100) {
      await User.findByIdAndUpdate(userId, { isProfileCompleted: true });
    }

    res.status(200).json({
      success: true,
      message: `تم استكمال الخطوة ${step} بنجاح`,
      profileCompletion: {
        step: user.profileCompletion.step,
        trustScore: trustScore,
        isComplete: trustScore === 100
      },
      isProfileCompleted: trustScore === 100
    });

  } catch (error) {
    console.error('خطأ في تحديث البيانات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث البيانات',
      error: error.message
    });
  }
};

// ======================================
// الحصول على حالة اكتمال الملف الشخصي
// GET /api/users/profile-status/:id
// ======================================

exports.getProfileStatus = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const trustScore = user.calculateTrustScore();

    res.status(200).json({
      success: true,
      profileCompletion: {
        step: user.profileCompletion.step,
        trustScore: trustScore,
        isComplete: trustScore === 100
      }
    });

  } catch (error) {
    console.error('خطأ في جلب حالة الملف الشخصي:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب البيانات',
      error: error.message
    });
  }
};

// ======================================
// تحديث معلومات الملف الشخصي (الاسم والصورة)
// POST /api/users/update-profile-info
// ======================================

exports.updateProfileInfo = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, avatar } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'الاسم مطلوب'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        name: name.trim(),
        ...(avatar && { avatar })
      },
      { new: true }
    ).select('-password -verificationCode');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات الملف الشخصي بنجاح',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('خطأ في تحديث بيانات الملف الشخصي:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث البيانات',
      error: error.message
    });
  }
};
