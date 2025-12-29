document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'Auth.html';
        return;
    }

    await loadProfileData();
    setupFormSubmit();
});

async function loadProfileData() {
    showLoading(true);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/profile-by-token', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        if (data.success && data.user) {
            const user = data.user;
            
            // البيانات الأساسية
            document.getElementById('fullName').value = user.name || '';
            document.getElementById('email').value = user.email || '';
            
            // البيانات الشخصية
            document.getElementById('governorate').value = user.governorate || '';
            document.getElementById('residence').value = user.residence || '';
            document.getElementById('postalCode').value = user.postalCode || '';
            
            // البيانات التعليمية
            document.getElementById('educationLevel').value = user.educationLevel || '';
            document.getElementById('college').value = user.college || '';
            document.getElementById('highSchool').value = user.highSchool || '';
            document.getElementById('fieldOfStudy').value = user.fieldOfStudy || '';
            
            // تفاصيل الوظيفة
            document.getElementById('desiredSalary').value = user.desiredSalary || '';
            
            // تحويل الوقت من صيغة HH:MM إلى dropdown
            if (user.workFrom) {
                const fromH = user.workFrom.split(':')[0];
                document.getElementById('workFromHour').value = fromH;
            }
            if (user.workTo) {
                const toH = user.workTo.split(':')[0];
                document.getElementById('workToHour').value = toH;
            }
            document.getElementById('workHours').value = user.workHours || '';
            
            // المهارات
            if (user.skills && user.skills.length > 0) {
                currentSkills = [...user.skills];
                renderSkills();
            }
            
            // اللغات
            if (user.languages && user.languages.length > 0) {
                currentLanguages = user.languages.map(lang => 
                    typeof lang === 'string' ? { name: lang, proficiency_level: '' } : lang
                );
                renderLanguages();
            }
            
            // الشهادات
            if (user.certificates && user.certificates.length > 0) {
                currentCertificates = user.certificates;
                renderCertificates();
            }
            
            // الصورة الشخصية
            if (user.avatar) {
                document.getElementById('photoPreview').innerHTML = `
                    <img src="${user.avatar}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary-blue);">
                `;
                document.getElementById('photoPreview').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        alert('حدث خطأ في تحميل بيانات الحساب');
    } finally {
        showLoading(false);
    }
}

function setupFormSubmit() {
    const form = document.getElementById('editProfileForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveChanges();
    });
}

async function saveChanges() {
    showLoading(true);
    
    const fullName = document.getElementById('fullName').value.trim();
    if (!fullName) {
        alert('الرجاء إدخال الاسم الكامل');
        showLoading(false);
        return;
    }

    try {
        const token = localStorage.getItem('token');
        
        // تحويل قيم الساعات من dropdowns إلى صيغة HH:MM
        const fromHour = document.getElementById('workFromHour').value || '00';
        const toHour = document.getElementById('workToHour').value || '00';
        const workFrom = `${fromHour}:00`;
        const workTo = `${toHour}:00`;

        // البيانات الأساسية والشخصية والتعليمية
        const profileData = {
            name: fullName,
            governorate: document.getElementById('governorate').value,
            residence: document.getElementById('residence').value,
            postalCode: document.getElementById('postalCode').value,
            educationLevel: document.getElementById('educationLevel').value,
            college: document.getElementById('college').value,
            highSchool: document.getElementById('highSchool').value,
            fieldOfStudy: document.getElementById('fieldOfStudy').value,
            desiredSalary: parseFloat(document.getElementById('desiredSalary').value) || 0,
            workFrom: workFrom,
            workTo: workTo,
            workHours: parseFloat(document.getElementById('workHours').value) || 0,
            skills: currentSkills,
            languages: currentLanguages
        };

        // تحديث البيانات الأساسية
        await fetch('/api/users/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                step: 2,
                data: profileData
            })
        });

        // رفع الشهادات الجديدة
        for (let cert of currentCertificates) {
            if (cert.file) {
                const formData = new FormData();
                formData.append('certificate_file', cert.file);
                formData.append('cert_name', cert.name);
                formData.append('issuing_authority', 'المستخدم');
                formData.append('issue_date', new Date().toISOString().split('T')[0]);

                await fetch('/upload-certificate', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
            }
        }

        // تحديث الصورة إذا تم تحديثها
        const photoInput = document.getElementById('profilePhoto');
        if (photoInput.files && photoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                await fetch('/api/users/update-profile-info', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: fullName,
                        avatar: e.target.result
                    })
                });
            };
            reader.readAsDataURL(photoInput.files[0]);
        }

        alert('✅ تم حفظ التعديلات بنجاح!');
        setTimeout(() => window.location.href = 'Profile.html', 1500);
        
    } catch (error) {
        console.error('خطأ:', error);
        alert('❌ حدث خطأ في حفظ التعديلات');
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}
