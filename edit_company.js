document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token || localStorage.getItem('userType') !== 'company') {
        window.location.href = 'Auth.html';
        return;
    }

    setupImagePreview();
    loadCompanyData();
    setupFormSubmit();
});

async function loadCompanyData() {
    showLoading(true);
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
        const response = await fetch(`/api/companies/profile-data/${user.id || user._id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const result = await response.json();
        if (result.success && result.data) {
            const data = result.data;
            
            // ملء الحقول
            document.getElementById('startDate').value = data.startDate ? data.startDate.split('T')[0] : '';
            document.getElementById('businessNature').value = data.businessNature || 'online';
            document.getElementById('website').value = data.website || '';
            document.getElementById('officialPhone').value = data.phone || '';
            document.getElementById('fullAddress').value = data.address || '';
            document.getElementById('workingDays').value = data.workingDays || '';
            document.getElementById('companyDescription').value = data.description || '';
            document.getElementById('additionalSocial').value = data.additionalSocial || '';
            
            // معالجة أوقات العمل
            if (data.workingHours) {
                const timeMatch = data.workingHours.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
                if (timeMatch) {
                    document.getElementById('workingHoursFrom').value = timeMatch[1];
                    document.getElementById('workingHoursTo').value = timeMatch[2];
                }
            }
            
            // تحميل الصورة
            if (data.logo) {
                document.getElementById('logoPreview').innerHTML = data.logo;
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        showMessage('خطأ في تحميل البيانات', 'error');
    } finally {
        showLoading(false);
    }
}

function setupImagePreview() {
    const logoInput = document.getElementById('companyLogo');
    logoInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('logoPreview').innerHTML = `<img src="${e.target.result}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;">`;
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

function setupFormSubmit() {
    const form = document.getElementById('editCompanyForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveChanges();
    });
}

async function saveChanges() {
    showLoading(true);
    const user = JSON.parse(localStorage.getItem('user'));
    
    const logoPreview = document.getElementById('logoPreview').innerHTML;
    const startDate = document.getElementById('startDate').value;
    const businessNature = document.getElementById('businessNature').value;
    const website = document.getElementById('website').value;
    const phone = document.getElementById('officialPhone').value;
    const address = document.getElementById('fullAddress').value;
    const workingHoursFrom = document.getElementById('workingHoursFrom').value;
    const workingHoursTo = document.getElementById('workingHoursTo').value;
    const workingHours = `${workingHoursFrom} - ${workingHoursTo}`;
    const workingDays = document.getElementById('workingDays').value;
    const description = document.getElementById('companyDescription').value;
    const additionalSocial = document.getElementById('additionalSocial').value;

    // التحقق من الحقول الإجبارية
    if (!startDate || !website || !phone || phone.length !== 11 || !address || !workingHoursFrom || !workingHoursTo || !workingDays || !description) {
        showMessage('يرجى ملء جميع الحقول الإجبارية', 'error');
        showLoading(false);
        return;
    }

    try {
        const response = await fetch('/api/companies/update-company-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                logo: logoPreview,
                startDate,
                businessNature,
                website,
                phone,
                address,
                workingHours,
                workingDays,
                description,
                additionalSocial
            })
        });

        const result = await response.json();
        if (result.success) {
            showSuccess('تم حفظ التعديلات بنجاح!');
            setTimeout(() => window.location.href = 'Search.html', 2000);
        } else {
            showMessage(result.message || 'خطأ في حفظ التعديلات', 'error');
        }
    } catch (error) {
        console.error('خطأ:', error);
        showMessage('حدث خطأ في الاتصال بالسيرفر', 'error');
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}

function showMessage(message, type) {
    const msg = document.createElement('div');
    msg.className = `message-box ${type} show`;
    msg.textContent = message;
    msg.style.position = 'fixed';
    msg.style.top = '20px';
    msg.style.right = '20px';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

function showSuccess(message) {
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successMessage').style.display = 'block';
}
