# ECE-Egypt Job Portal Backend API

نظام خلفي متكامل لتطبيق التوظيف الإلكتروني ECE-Egypt، مبني باستخدام Node.js و Express و MongoDB.

## 🚀 الميزات

- ✅ تسجيل المستخدمين (الباحثين عن عمل)
- ✅ تسجيل الشركات
- ✅ نظام التحقق عبر البريد الإلكتروني (EmailJS)
- ✅ مصادقة آمنة باستخدام JWT
- ✅ تشفير كلمات المرور (bcrypt)
- ✅ قاعدة بيانات MongoDB Atlas
- ✅ واجهة API RESTful كاملة

## 📋 المتطلبات

- Node.js 20 أو أحدث
- حساب MongoDB Atlas (مجاني)
- حساب EmailJS (مجاني)

## 🔧 الإعداد السريع

### 1. إعداد MongoDB Atlas

1. سجل في [MongoDB Atlas](https://cloud.mongodb.com)
2. أنشئ Cluster جديد
3. اذهب إلى **Network Access** → **Add IP Address**
4. اختر **Allow Access from Anywhere** (0.0.0.0/0)
5. احصل على Connection String من **Connect** → **Connect your application**

### 2. إعداد EmailJS

1. سجل في [EmailJS](https://www.emailjs.com/)
2. أنشئ Service جديد
3. أنشئ Template للتحقق (يجب أن يحتوي على `{{verification_code}}`)
4. احصل على:
   - Service ID
   - Template ID
   - Public Key

### 3. إضافة المتغيرات السرية في Replit

أضف المتغيرات التالية في **Replit Secrets**:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ece-egypt
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_TEMPLATE_ID=template_xxxxxxx
EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
JWT_SECRET=your_very_long_and_secure_secret_key_here
```

### 4. تشغيل المشروع

المشروع سيعمل تلقائياً على Replit! فقط انقر على زر **Run**.

## 📚 API Documentation

### المستخدمين (Jobseekers)

#### تسجيل مستخدم جديد
```http
POST /api/users/register
Content-Type: application/json

{
  "name": "أحمد محمد",
  "nationalId": "12345678901234",
  "email": "ahmed@example.com",
  "phone": "01012345678",
  "password": "password123",
  "governorate": "القاهرة",
  "college": "جامعة القاهرة",
  "highSchool": "مدرسة الشهيد الثانوية",
  "skills": ["JavaScript", "React"],
  "languages": ["العربية", "English"]
}
```

#### التحقق من الكود
```http
POST /api/users/verify-code
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "verificationCode": "123456"
}
```

#### تسجيل الدخول
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "password123"
}
```

### الشركات (Companies)

#### تسجيل شركة جديدة
```http
POST /api/companies/register
Content-Type: application/json

{
  "companyName": "شركة التقنية الحديثة",
  "email": "info@company.com",
  "phone": "01012345678",
  "password": "password123",
}
```

#### التحقق والدخول
نفس endpoints المستخدمين ولكن على `/api/companies`

## 🔐 الأمان

- جميع كلمات المرور مشفرة باستخدام bcrypt
- JWT tokens صالحة لمدة 7 أيام
- التحقق من البريد الإلكتروني إجباري
- معالجة شاملة للأخطاء
- حماية CORS مفعلة

## 🛠️ التقنيات المستخدمة

- **Node.js** - بيئة التشغيل
- **Express** - إطار عمل الويب
- **MongoDB** - قاعدة البيانات
- **Mongoose** - ODM
- **bcryptjs** - تشفير كلمات المرور
- **jsonwebtoken** - JWT tokens
- **EmailJS** - إرسال البريد الإلكتروني
- **CORS** - حماية الطلبات

## 📁 هيكل المشروع

```
├── server.js              # السيرفر الرئيسي
├── models/
│   ├── User.js           # نموذج المستخدم
│   └── Company.js        # نموذج الشركة
├── controllers/
│   ├── userController.js
│   └── companyController.js
├── routes/
│   ├── userRoutes.js
│   └── companyRoutes.js
└── package.json
```

## 🐛 حل المشاكل

### خطأ الاتصال بـ MongoDB
تأكد من:
1. إضافة `0.0.0.0/0` في Network Access
2. صحة MONGO_URI في Secrets
3. استبدال `<password>` في Connection String بكلمة المرور الفعلية

### عدم وصول البريد الإلكتروني
تأكد من:
1. صحة بيانات EmailJS في Secrets
2. وجود `{{verification_code}}` في Template
3. التحقق من Spam/Junk folder

## 📝 الترخيص

ISC License

## 👥 المساهمة

المساهمات مرحب بها! يرجى فتح Issue أو Pull Request.

---

**تم التطوير بـ ❤️ بواسطة ECE-Egypt Team**
