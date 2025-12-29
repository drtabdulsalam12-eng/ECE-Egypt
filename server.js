const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const User = require('./models/User');
const userRoutes = require('./routes/userRoutes');
const companyRoutes = require('./routes/companyRoutes');
const app = express();

// ======================================
// Middleware
// ======================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// مراقبة الطلبات للتأكد من وصولها من الهاتف
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// ======================================
// إعداد Multer (للملفات الأخرى)
// ======================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/uploads/certificates/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// ======================================
// Routing
// ======================================
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);

// ======================================
// API Endpoints
// ======================================
app.get('/api/config/emailjs', (req, res) => {
    res.json({
        publicKey: process.env.EMAILJS_PUBLIC_KEY || ''
    });
});

// ======================================
// مسار رفع الصورة الشخصية (Avatar)
// ======================================
app.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, error: 'البريد الإلكتروني مطلوب' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'الملف مطلوب' });
        }

        const avatarUrl = `/uploads/certificates/${req.file.filename}`;

        const user = await User.findOneAndUpdate(
            { email },
            { avatar: avatarUrl },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
        }

        res.json({ success: true, message: 'تم رفع الصورة الشخصية بنجاح', avatar: avatarUrl });
    } catch (error) {
        console.error('❌ خطأ في رفع الصورة الشخصية:', error);
        res.status(500).json({ success: false, error: 'خطأ في رفع الصورة الشخصية' });
    }
});

// ======================================
// مسار رفع البطاقة الشخصية (الرقم القومي)
// ======================================
app.post('/upload-id-card', upload.single('idCard'), async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, error: 'البريد الإلكتروني مطلوب' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'الملف مطلوب' });
        }

        const idCardData = {
            fileName: req.file.originalname,
            fileUrl: `/uploads/certificates/${req.file.filename}`,
            uploadedAt: new Date()
        };

        const user = await User.findOneAndUpdate(
            { email },
            { idCard: idCardData },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
        }

        res.json({ success: true, message: 'تم رفع البطاقة بنجاح', idCard: idCardData });
    } catch (error) {
        console.error('❌ خطأ في رفع البطاقة:', error);
        res.status(500).json({ success: false, error: 'خطأ في رفع البطاقة' });
    }
});

// ======================================
// مسار تحديث البيانات الأساسية (الخطوة 1)
// ======================================
app.post('/update-step-1', upload.single('idCard'), async (req, res) => {
    try {
        const { email, nationalId, birthDate, age, governorate } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'البريد الإلكتروني مطلوب' });
        }

        let updateData = {
            nationalId,
            governorate
        };

        if (req.file) {
            updateData.idCard = {
                fileName: req.file.originalname,
                fileUrl: `/uploads/certificates/${req.file.filename}`,
                uploadedAt: new Date()
            };
        }

        const user = await User.findOneAndUpdate(
            { email },
            updateData,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
        }

        res.json({ 
            success: true, 
            message: 'تم تحديث البيانات بنجاح',
            user: {
                id: user._id,
                email: user.email,
                nationalId: user.nationalId,
                governorate: user.governorate,
                idCard: user.idCard
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث البيانات:', error);
        res.status(500).json({ success: false, error: 'حدث خطأ في تحديث البيانات' });
    }
});

// ======================================
// مسار حفظ المهارات واللغات
// ======================================
app.post('/save-skill-language', async (req, res) => {
    try {
        const { email, type, name, proficiency_level, native_language } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'البريد الإلكتروني مطلوب' });
        }

        let updateAction = {};

        if (type === 'skill') {
            // استخدام $addToSet لضمان عدم تكرار نفس المهارة في المصفوفة
            updateAction = { $addToSet: { skills: name } };
            console.log(`🛠️ إضافة مهارة: ${name} للمستخدم: ${email}`);
        } else {
            // إضافة كائن لغة جديد
            updateAction = { 
                $push: { 
                    languages: { 
                        name: name, 
                        proficiency_level: proficiency_level, 
                        native_language: native_language 
                    } 
                } 
            };
            console.log(`🌐 إضافة لغة: ${name} للمستخدم: ${email}`);
        }

        const user = await User.findOneAndUpdate(
            { email: email },
            updateAction,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'المستخدم غير موجود في قاعدة البيانات' });
        }

        res.json({ success: true, message: 'تم الحفظ بنجاح' });
    } catch (error) {
        console.error('❌ خطأ في الحفظ:', error);
        res.status(500).json({ success: false, error: 'حدث خطأ داخلي في السيرفر' });
    }
});

// ======================================
// 2. مسارات الشهادات (كما هي)
// ======================================
app.post('/upload-certificate', upload.single('certificate_file'), async (req, res) => {
    try {
        const { email, cert_name, issuing_authority, issue_date } = req.body;
        const certificateData = {
            name: cert_name,
            issuer: issuing_authority,
            date: issue_date,
            fileUrl: req.file ? `/uploads/certificates/${req.file.filename}` : null
        };
        const user = await User.findOneAndUpdate({ email }, { $push: { certificates: certificateData } }, { new: true });
        res.json({ success: true, certificate: certificateData });
    } catch (error) {
        res.status(500).json({ success: false, error: 'خطأ في الرفع' });
    }
});

app.delete('/delete-certificate', async (req, res) => {
    try {
        const { email, certName } = req.body;
        await User.findOneAndUpdate({ email }, { $pull: { certificates: { name: certName } } });
        res.json({ success: true, message: 'تم الحذف' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'خطأ في الحذف' });
    }
});

// ======================================
// الاتصال والتشغيل (متوافق مع Replit)
// ======================================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ متصل بـ MongoDB');
        app.listen(PORT, () => {
            console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
        });
    })
    .catch(err => console.error('❌ خطأ في قاعدة البيانات:', err));

module.exports = app;
