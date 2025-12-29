const API_BASE = '/api';
let currentEmail = '';
let currentUserType = 'jobseeker';
let flowMode = 'login'; // 'login' أو 'register' لتمييز مسار التوجيه

document.addEventListener('DOMContentLoaded', function() {
    initEmailJS();
    setupTabs();
    setupForms();
    setupUserTypeChange();
});

async function initEmailJS() {
    try {
        const response = await fetch('/api/config/emailjs');
        const config = await response.json();
        if (typeof emailjs !== 'undefined') {
            emailjs.init({ publicKey: config.publicKey });
        }
    } catch (error) {
        console.error('خطأ في تحميل إعدادات EmailJS:', error);
    }
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            // تحديث وضع التدفق بناءً على التبويب المختار
            flowMode = tabName === 'register' ? 'register' : 'login';

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none'; // التأكد من إخفاء التبويبات الأخرى
            });

            button.classList.add('active');
            const activeTab = document.getElementById(`${tabName}-tab`);
            activeTab.classList.add('active');
            activeTab.style.display = 'block';
        });
    });
}

function setupUserTypeChange() {
    const registerTypeRadios = document.querySelectorAll('input[name="register-user-type"]');
    const nameLabel = document.getElementById('name-label');

    registerTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            nameLabel.textContent = e.target.value === 'company' ? 'اسم الشركة' : 'الاسم الكامل';
        });
    });
}

function setupForms() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('verification-form').addEventListener('submit', handleVerification);
    document.getElementById('resend-code').addEventListener('click', handleResendCode);
}

// --- 1. معالجة تسجيل الدخول ---
async function handleLogin(e) {
    e.preventDefault();
    flowMode = 'login'; // تأكيد أننا في مسار تسجيل الدخول

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const userType = document.querySelector('input[name="login-user-type"]:checked').value;

    currentUserType = userType;
    currentEmail = email;

    showLoading(true);

    try {
        const endpoint = userType === 'company' ? '/companies/login' : '/users/login';
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.status === 404 || (data && data.message && data.message.includes('غير موجود'))) {
            showMessage('هذا الحساب غير موجود، يرجى إنشاء حساب جديد أولاً', 'error');
            return;
        }

        if (data.success) {
            if (data.requiresVerification) {
                switchToVerificationTab();
                showMessage('يرجى إدخال كود التحقق المرسل إليك', 'success');
            } else {
                saveUserDataAndRedirect(data, 'Search.html');
            }
        } else {
            showMessage(data.message || 'خطأ في بيانات الدخول', 'error');
        }
    } catch (error) {
        console.error('خطأ:', error);
        showMessage('حدث خطأ في الاتصال بالخادم', 'error');
    } finally {
        showLoading(false);
    }
}

// --- 2. معالجة إنشاء حساب جديد ---
async function handleRegister(e) {
    e.preventDefault();
    flowMode = 'register'; // تأكيد أننا في مسار التسجيل

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-password-confirm').value;
    const userType = document.querySelector('input[name="register-user-type"]:checked').value;

    if (password !== confirmPassword) {
        showMessage('كلمات المرور غير متطابقة', 'error');
        return;
    }

    currentUserType = userType;
    currentEmail = email;

    showLoading(true);

    try {
        const endpoint = userType === 'company' ? '/companies/register' : '/users/register';
        const requestBody = userType === 'company' 
            ? { companyName: name, email, phone, password } 
            : { name, email, phone, password };

        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.success) {
            switchToVerificationTab();
            if (data.verificationCode) console.log('OTP:', data.verificationCode);
            showMessage('تم إنشاء الحساب، يرجى التحقق من الكود', 'success');
        } else {
            showMessage(data.message || 'حدث خطأ في التسجيل', 'error');
        }
    } catch (error) {
        showMessage('خطأ في الاتصال بالخادم', 'error');
    } finally {
        showLoading(false);
    }
}

// --- 3. معالجة كود التحقق والتوجيه النهائي ---
async function handleVerification(e) {
    e.preventDefault();
    const verificationCode = document.getElementById('verification-code').value;

    showLoading(true);

    try {
        const endpoint = currentUserType === 'company' ? '/companies/verify-code' : '/users/verify-code';
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail, verificationCode })
        });

        const data = await response.json();

        if (data.success) {
            let finalTarget = 'Search.html'; // التوجه الافتراضي (للدخول)

            if (flowMode === 'register') {
                // إذا كان مستخدم جديد، يتم توجيهه حسب نوعه
                finalTarget = (currentUserType === 'company') ? 'Company.html' : 'Manual_entry.html';
            }

            saveUserDataAndRedirect(data, finalTarget);
        } else {
            showMessage(data.message || 'كود التحقق غير صحيح', 'error');
        }
    } catch (error) {
        showMessage('حدث خطأ أثناء التحقق', 'error');
    } finally {
        showLoading(false);
    }
}

// دالة مساعدة لحفظ البيانات والتوجيه
function saveUserDataAndRedirect(data, targetUrl) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userType', currentUserType);
    localStorage.setItem('user', JSON.stringify(data.user || data.company));

    showMessage('تمت العملية بنجاح! جاري التوجيه...', 'success');
    setTimeout(() => {
        window.location.href = targetUrl;
    }, 1500);
}

// دالة للانتقال لواجهة التحقق
function switchToVerificationTab() {
    document.querySelectorAll('.tab-content').forEach(t => {
        t.classList.remove('active');
        t.style.display = 'none';
    });
    const vTab = document.getElementById('verification-tab');
    vTab.style.display = 'block';
    vTab.classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
}

// الدوال المساعدة للرسائل والتحميل
function showLoading(show) {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function showMessage(message, type) {
    const existing = document.querySelector('.message-box');
    if (existing) existing.remove();

    const box = document.createElement('div');
    box.className = `message-box ${type}`;
    box.textContent = message;
    document.body.appendChild(box);

    setTimeout(() => box.classList.add('show'), 100);
    setTimeout(() => {
        box.classList.remove('show');
        setTimeout(() => box.remove(), 300);
    }, 3500);
}

async function handleResendCode(e) {
    e.preventDefault();
    showLoading(true);
    try {
        const endpoint = currentUserType === 'company' ? '/companies/resend-code' : '/users/resend-code';
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail })
        });
        const data = await response.json();
        showMessage(data.success ? 'تم إعادة إرسال الكود' : 'فشل إعادة الإرسال', data.success ? 'success' : 'error');
    } catch (error) {
        showMessage('خطأ في الاتصال', 'error');
    } finally {
        showLoading(false);
    }
}