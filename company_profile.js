document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token || localStorage.getItem('userType') !== 'company') {
        window.location.href = 'Auth.html';
        return;
    }

    loadProfileStatus();
    setupNavigation();
    setupImagePreview();
    setupWorkingHoursDropdown();
});

function setupWorkingHoursDropdown() {
    // لا حاجة لهذه الدالة الآن مع time inputs
}

let currentStep = 1;
let employees = [];
let managers = [];

function setupNavigation() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    nextBtn.addEventListener('click', async () => {
        const success = await saveStepData(currentStep);
        if (success) {
            if (currentStep < 3) {
                goToStep(currentStep + 1);
            } else {
                showMessage('تم استكمال جميع البيانات بنجاح!', 'success');
                setTimeout(() => window.location.href = 'Search.html', 2000);
            }
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    });
}

function goToStep(step) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');
    
    document.querySelectorAll('.progress-step').forEach(el => {
        const s = parseInt(el.dataset.step);
        if (s === step) el.className = 'progress-step active';
        else if (s < step) el.className = 'progress-step completed';
        else el.className = 'progress-step';
    });

    currentStep = step;
    document.getElementById('prevBtn').style.display = step === 1 ? 'none' : 'block';
    document.getElementById('nextBtn').textContent = step === 3 ? 'إنهاء' : 'متابعة';
}

async function saveStepData(step) {
    showLoading(true);
    let data = {};

    if (step === 1) {
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

        // التحقق الصارم من الحقول الإجبارية
        if (!logoPreview) { showMessage('لوجو الشركة إجباري', 'error'); showLoading(false); return false; }
        if (!startDate) { showMessage('تاريخ النشاط إجباري', 'error'); showLoading(false); return false; }
        if (!website) { showMessage('الموقع الإلكتروني إجباري', 'error'); showLoading(false); return false; }
        if (!phone || phone.length !== 11) { showMessage('رقم الهاتف يجب أن يكون 11 رقماً', 'error'); showLoading(false); return false; }
        if (!address) { showMessage('العنوان الكامل إجباري', 'error'); showLoading(false); return false; }
        if (!workingHoursFrom || !workingHoursTo) { showMessage('ساعات العمل إجبارية', 'error'); showLoading(false); return false; }
        if (!workingDays) { showMessage('أيام العمل إجبارية', 'error'); showLoading(false); return false; }
        if (!description) { showMessage('النبذة التعريفية إجبارية', 'error'); showLoading(false); return false; }

        data = {
            logo: logoPreview,
            startDate,
            businessNature,
            website,
            phone,
            address,
            workingHours,
            workingDays,
            description,
            commercialRegister: document.getElementById('commercialRegister').value,
            licenses: document.getElementById('licenses').value,
            additionalSocial: document.getElementById('additionalSocial').value
        };
    } else if (step === 2) {
        if (employees.length === 0) { showMessage('يجب إضافة موظف واحد على الأقل', 'error'); showLoading(false); return false; }
        data = { employees };
    } else if (step === 3) {
        if (managers.length === 0) { showMessage('يجب إضافة مسؤول واحد على الأقل', 'error'); showLoading(false); return false; }
        
        // التحقق من هواتف المسؤولين
        for(let manager of managers) {
            if (manager.phone.length !== 11) {
                showMessage(`رقم هاتف المسؤول (${manager.position}) يجب أن يكون 11 رقماً`, 'error');
                showLoading(false);
                return false;
            }
        }
        data = { managers };
    }

    try {
        const response = await fetch('/api/companies/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ step, data })
        });

        const result = await response.json();
        if (result.success) {
            return true;
        } else {
            showMessage(result.message, 'error');
            return false;
        }
    } catch (error) {
        showMessage('حدث خطأ في الاتصال بالسيرفر', 'error');
        return false;
    } finally {
        showLoading(false);
    }
}


async function loadProfileStatus() {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
        const response = await fetch(`/api/companies/profile-status/${user.id || user._id}`);
        const data = await response.json();
        if (data.success) {
            if (data.profileCompletion.step > 1 && data.profileCompletion.step <= 3) {
                goToStep(data.profileCompletion.step);
            }
        }
    } catch (e) { console.error(e); }
}


function addEmployee() {
    const job = document.getElementById('tempJobTitle').value;
    const salary = document.getElementById('tempSalary').value;
    const duration = document.getElementById('tempDuration').value;
    const workHours = document.getElementById('tempWorkHours').value;

    if (!job) return;

    employees.push({ jobTitle: job, salary, workDuration: duration, workHours });
    renderList('employeesList', employees, 'jobTitle');
    
    document.getElementById('tempJobTitle').value = '';
    document.getElementById('tempSalary').value = '';
    document.getElementById('tempDuration').value = '';
    document.getElementById('tempWorkHours').value = '';
}

function addManager() {
    const name = document.getElementById('tempManagerName').value;
    const pos = document.getElementById('tempManagerPosition').value;
    const phone = document.getElementById('tempManagerPhone').value;
    const email = document.getElementById('tempManagerEmail').value;

    if (!name || !pos) return;

    managers.push({ name, position: pos, phone, email });
    renderList('managersList', managers, 'name');

    document.getElementById('tempManagerName').value = '';
    document.getElementById('tempManagerPosition').value = '';
    document.getElementById('tempManagerPhone').value = '';
    document.getElementById('tempManagerEmail').value = '';
}

function renderList(containerId, list, mainKey) {
    const container = document.getElementById(containerId);
    container.innerHTML = list.map((item, index) => {
        let details = '';
        if (containerId === 'employeesList') {
            details = `<p style="margin: 5px 0; font-size: 12px; color: var(--text-light);">
                💰 ${item.salary || '-'} | ⏱️ ${item.workDuration || '-'} ${item.workHours ? `| 🕐 ${item.workHours}` : ''}
            </p>`;
        } else if (containerId === 'managersList') {
            details = `<p style="margin: 5px 0; font-size: 12px; color: var(--text-light);">
                🏷️ ${item.position || '-'} | 📞 ${item.phone || '-'} | 📧 ${item.email || '-'}
            </p>`;
        }
        return `
            <div class="dynamic-list-item">
                <strong>${item[mainKey]}</strong>
                ${details}
                <button type="button" class="btn-remove-small" onclick="removeItem('${containerId}', ${index})" style="float: left;">حذف</button>
            </div>
        `;
    }).join('');
}

function removeItem(containerId, index) {
    if (containerId === 'employeesList') employees.splice(index, 1);
    else managers.splice(index, 1);
    renderList(containerId, containerId === 'employeesList' ? employees : managers, containerId === 'employeesList' ? 'jobTitle' : 'position');
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

// ======================================
// دوال رفع ملفات PDF
// ======================================

function triggerFileUpload(inputId) {
    document.getElementById(inputId).click();
}

async function uploadCommercialRegister(fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) return;

    const file = fileInput.files[0];
    
    // التحقق من نوع الملف
    if (file.type !== 'application/pdf') {
        showMessage('يجب أن يكون الملف PDF', 'error');
        return;
    }

    // التحقق من حجم الملف (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('حجم الملف لا يجب أن يتجاوز 5MB', 'error');
        return;
    }

    showLoading(true);

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/companies/upload-commercial-register', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('commercialRegister').value = file.name;
            showMessage('✅ تم رفع السجل التجاري بنجاح', 'success');
        } else {
            showMessage(data.message || 'خطأ في رفع الملف', 'error');
        }
    } catch (error) {
        console.error('خطأ:', error);
        showMessage('خطأ في رفع الملف', 'error');
    } finally {
        showLoading(false);
        fileInput.value = '';
    }
}

async function uploadLicenses(fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) return;

    const files = fileInput.files;
    
    // التحقق من جميع الملفات
    for (let file of files) {
        if (file.type !== 'application/pdf') {
            showMessage('جميع الملفات يجب أن تكون PDF', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showMessage('حجم كل ملف لا يجب أن يتجاوز 5MB', 'error');
            return;
        }
    }

    showLoading(true);

    try {
        const formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }

        const response = await fetch('/api/companies/upload-licenses', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            const fileNames = Array.from(files).map(f => f.name).join(', ');
            document.getElementById('licenses').value = fileNames;
            showMessage('✅ تم رفع التراخيص بنجاح', 'success');
        } else {
            showMessage(data.message || 'خطأ في رفع الملفات', 'error');
        }
    } catch (error) {
        console.error('خطأ:', error);
        showMessage('خطأ في رفع الملفات', 'error');
    } finally {
        showLoading(false);
        fileInput.value = '';
    }
}