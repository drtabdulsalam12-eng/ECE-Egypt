// ======================================
// خدمة البريد الإلكتروني باستخدام Nodemailer
// ======================================

const nodemailer = require('nodemailer');

// إعداد الـ Transporter لـ Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// ======================================
// دالة لإنشاء قالب البريد الإلكتروني (HTML)
// ======================================

const getEmailTemplate = (name, verificationCode, userType = 'user') => {
  const userTypeText = userType === 'company' ? 'الشركة' : 'المستخدم';
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          background: linear-gradient(135deg, #1e88e5 0%, #00bcd4 100%);
          padding: 20px;
          direction: rtl;
          text-align: right;
        }
        
        .container {
          max-width: 500px;
          margin: 0 auto;
          background: white;
          border-radius: 15px;
          box-shadow: 0 10px 40px rgba(30, 136, 229, 0.25);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #1e88e5 0%, #00bcd4 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        
        .header p {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .content {
          padding: 40px 20px;
        }
        
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        
        .greeting strong {
          color: #1e88e5;
        }
        
        .message {
          background: #e3f2fd;
          border-right: 4px solid #1e88e5;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          font-size: 14px;
          color: #333;
          line-height: 1.6;
        }
        
        .verification-section {
          background: #f5f5f5;
          border-radius: 10px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
        }
        
        .verification-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .verification-code {
          background: linear-gradient(135deg, #1e88e5 0%, #00bcd4 100%);
          color: white;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 8px;
          padding: 20px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          margin: 15px 0;
        }
        
        .code-validity {
          font-size: 12px;
          color: #e74c3c;
          margin-top: 10px;
          font-weight: bold;
        }
        
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          border-right: 4px solid #ffc107;
          padding: 12px;
          margin: 20px 0;
          border-radius: 5px;
          font-size: 13px;
          color: #856404;
          line-height: 1.5;
        }
        
        .footer {
          background: #f9f9f9;
          padding: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        
        .footer a {
          color: #1e88e5;
          text-decoration: none;
        }
        
        .footer a:hover {
          text-decoration: underline;
        }
        
        .divider {
          height: 1px;
          background: #eee;
          margin: 20px 0;
        }
        
        .highlight {
          color: #1e88e5;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 ECE-Egypt</h1>
          <p>منصة التوظيف الإلكترونية</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            أهلاً وسهلاً بك يا <strong>${name}</strong>،<br>
            شكراً لتسجيلك في منصة ECE-Egypt!
          </div>
          
          <div class="message">
            لقد طلبت تفعيل حسابك الجديد. الرجاء استخدام كود التحقق أدناه لإكمال عملية التسجيل.
          </div>
          
          <div class="verification-section">
            <div class="verification-label">🔑 كود التحقق الخاص بك</div>
            <div class="verification-code">${verificationCode}</div>
            <div class="code-validity">⏱️ الكود صالح لمدة 10 دقائق فقط</div>
          </div>
          
          <div class="warning">
            ⚠️ <strong>تنبيه أمان:</strong><br>
            لا تشارك هذا الكود مع أحد. فريق ECE-Egypt لن يطلب منك هذا الكود عبر البريد أو الرسائل.
          </div>
          
          <div class="divider"></div>
          
          <div class="greeting">
            عند إدخالك لكود التحقق، سيتم تفعيل حسابك وسيكون بإمكانك:
          </div>
          
          <ul style="direction: rtl; text-align: right; color: #333; line-height: 2; font-size: 14px;">
            <li>✅ تحديث بيانات ملفك الشخصي</li>
            <li>✅ البحث عن الوظائف المناسبة لك</li>
            <li>✅ التقديم على الوظائف المختلفة</li>
            <li>✅ التواصل مع أصحاب الشركات</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>
            إذا لم تقم بطلب هذا الكود، يرجى تجاهل هذه الرسالة.<br>
            <br>
            <a href="https://ece-egypt.com">زيارة موقعنا</a> | 
            <a href="https://ece-egypt.com/contact">تواصل معنا</a>
            <br>
            <br>
            © 2025 ECE-Egypt. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ======================================
// دالة إرسال رسالة التحقق
// ======================================

const sendVerificationEmail = async (email, name, verificationCode, userType = 'user') => {
  try {
    console.log('📧 محاولة إرسال رسالة التحقق عبر Nodemailer...');
    console.log('📨 إلى:', email);
    console.log('👤 الاسم:', name);
    console.log('🔑 كود التحقق:', verificationCode);
    
    // التحقق من وجود بيانات الاعتماد
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ بيانات البريد الإلكتروني غير مكتملة في Secrets');
      console.warn('تأكد من إضافة EMAIL_USER و EMAIL_PASS');
      return false;
    }
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ECE-Egypt" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 كود التحقق من حسابك - ECE-Egypt',
      html: getEmailTemplate(name, verificationCode, userType),
      text: `كود التحقق الخاص بك هو: ${verificationCode}`
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ تم إرسال البريد الإلكتروني بنجاح!');
    console.log('📤 معرف الرسالة:', info.messageId);
    
    return true;
    
  } catch (error) {
    console.error('❌ خطأ في إرسال البريد الإلكتروني:');
    console.error('رسالة الخطأ:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.error('⚠️ خطأ في بيانات اعتماد Gmail:');
      console.error('تأكد من أن EMAIL_USER و EMAIL_PASS صحيحان');
      console.error('قد تحتاج إلى استخدام App Password بدلاً من كلمة المرور العادية');
    }
    
    // عدم إيقاف التطبيق إذا فشل الإرسال
    console.warn('⚠️ استمرار التطبيق حتى مع فشل إرسال البريد');
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  getEmailTemplate
};
