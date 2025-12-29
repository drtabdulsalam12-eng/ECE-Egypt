// ======================================
// Middleware للتحقق من JWT Token
// ======================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');

// ======================================
// التحقق من وجود وصحة JWT Token
// ======================================

exports.protect = async (req, res, next) => {
  try {
    let token;

    // التحقق من وجود Token في الـ headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // استخراج Token من header
      token = req.headers.authorization.split(' ')[1];
    }

    // التحقق من وجود Token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح لك بالوصول. الرجاء تسجيل الدخول'
      });
    }

    try {
      // فك تشفير Token والتحقق من صحته
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // البحث عن المستخدم أو الشركة بناءً على ID في Token
      let user = await User.findById(decoded.id).select('-password -verificationCode');
      
      if (!user) {
        user = await Company.findById(decoded.id).select('-password -verificationCode');
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }

      // التحقق من أن الحساب مفعل
      if (!user.isVerified) {
        return res.status(401).json({
          success: false,
          message: 'الرجاء تفعيل حسابك أولاً'
        });
      }

      // إضافة بيانات المستخدم إلى request للاستخدام في Controllers
      req.user = user;
      next();

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'رمز المصادقة غير صحيح أو منتهي الصلاحية'
      });
    }

  } catch (error) {
    console.error('خطأ في middleware التحقق:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في التحقق من الصلاحيات'
    });
  }
};

// ======================================
// التحقق من أن المستخدم هو نفسه صاحب الحساب
// ======================================

exports.authorizeOwner = (req, res, next) => {
  // التحقق من أن ID في الـ params يطابق ID المستخدم المسجل
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح لك بالوصول إلى هذا المورد'
    });
  }
  next();
};
