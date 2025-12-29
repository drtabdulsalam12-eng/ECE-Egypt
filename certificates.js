document.addEventListener('DOMContentLoaded', function() {
    const addCertBtn = document.getElementById('addCertificateBtn');
    const certFormContainer = document.getElementById('certificateForm');
    const newCertForm = document.getElementById('newCertificateForm');
    const certsList = document.getElementById('certificatesList');
    const submitBtn = document.getElementById('submitBtn');

    // وظيفة لفتح/إغلاق النموذج
    addCertBtn.onclick = () => {
        certFormContainer.style.display = 'block';
        addCertBtn.style.display = 'none';
    };

    document.getElementById('cancelCertBtn').onclick = () => {
        certFormContainer.style.display = 'none';
        addCertBtn.style.display = 'block';
        newCertForm.reset();
    };

    // معالجة الضغط على حفظ الشهادة
    newCertForm.onsubmit = async (e) => {
        e.preventDefault();

        // 1. محاولة جلب البريد من الذاكرة
        let userEmail = localStorage.getItem('userEmail');

        // 2. إذا لم يجد البريد، يظهر رسالة (Prompt) لإدخاله
        if (!userEmail || userEmail === 'null') {
            userEmail = prompt("يرجى إدخال البريد الإلكتروني المسجل لإتمام عملية الحفظ:");

            if (userEmail && userEmail.trim() !== "") {
                localStorage.setItem('userEmail', userEmail.trim());
            } else {
                alert("عذراً، يجب إدخال البريد الإلكتروني لنتمكن من حفظ شهاداتك.");
                return; // يتوقف ولا يكمل الحفظ
            }
        }

        const formData = new FormData(newCertForm);
        formData.append('email', userEmail); // إضافة البريد للبيانات المرسلة

        // تغيير حالة الزر
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الحفظ...';

        try {
            const response = await fetch('/upload-certificate', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // إضافة الشهادة للقائمة المرئية
                addCertToUI(
                    formData.get('cert_name'), 
                    formData.get('issuing_authority'), 
                    formData.get('issue_date')
                );

                newCertForm.reset();
                alert('✅ تم حفظ الشهادة بنجاح!');
            } else {
                alert('❌ فشل الحفظ: ' + (data.error || 'حدث خطأ في السيرفر'));
            }
        } catch (err) {
            console.error(err);
            alert('❌ فشل الاتصال بالسيرفر. تأكد من جودة الإنترنت.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'حفظ الشهادة';
        }
    };

    // دالة رسم الشهادة في القائمة
    function addCertToUI(name, issuer, date) {
        const div = document.createElement('div');
        div.className = 'certificate-item';
        div.style.cssText = 'display:flex; justify-content:space-between; padding:12px; border:1px solid #ddd; margin-bottom:10px; border-radius:8px; align-items:center; background:#fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);';

        div.innerHTML = `
            <div>
                <strong style="color:#2c3e50;">${name}</strong><br>
                <small style="color:#7f8c8d;">${issuer} | ${date}</small>
            </div>
            <button type="button" class="del-btn" style="background:#e74c3c; color:#fff; border:none; padding:5px 12px; border-radius:4px; cursor:pointer;">حذف</button>
        `;

        div.querySelector('.del-btn').onclick = () => {
            if(confirm('هل تريد حذف هذه الشهادة من القائمة؟')) div.remove();
        };
        certsList.appendChild(div);
    }

    // زر الانتقال للخطوة التالية
    document.getElementById('continueBtn').onclick = () => {
        window.location.href = 'Skills_language.html';
    };
});