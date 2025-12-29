document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('personalInfoForm');

    const profilePhotoInput = document.getElementById('profilePhoto');
    const profilePhotoArea = document.getElementById('profilePhotoArea');
    const profilePhotoPreview = document.getElementById('profilePhotoPreview');
    const profilePhotoImage = document.getElementById('profilePhotoImage');
    const removeProfilePhotoBtn = document.getElementById('removeProfilePhoto');
    let profilePhotoFile = null;

    profilePhotoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            profilePhotoFile = file;
            const reader = new FileReader();
            reader.onload = function(e) {
                profilePhotoImage.src = e.target.result;
                profilePhotoArea.style.display = 'none';
                profilePhotoPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    removeProfilePhotoBtn.addEventListener('click', function() {
        profilePhotoFile = null;
        profilePhotoInput.value = '';
        profilePhotoArea.style.display = 'block';
        profilePhotoPreview.style.display = 'none';
        profilePhotoImage.src = '';
    });


    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const token = localStorage.getItem('token');
        const userEmail = JSON.parse(localStorage.getItem('user')).email;
        const manualEntryData = JSON.parse(localStorage.getItem('manualEntryData'));

        // إرسال البطاقة الشخصية إلى السيرفر أولاً
        if (manualEntryData) {
            const idCardFileBase64 = localStorage.getItem('idCardFile');
            const idCardFileName = localStorage.getItem('idCardFileName');
            
            if (idCardFileBase64) {
                try {
                    const formDataFile = new FormData();
                    
                    // تحويل Base64 إلى Blob
                    const arr = idCardFileBase64.split(',');
                    const mime = arr[0].match(/:(.*?);/)[1];
                    const bstr = atob(arr[1]);
                    let n = bstr.length;
                    const u8arr = new Uint8Array(n);
                    while(n--) {
                        u8arr[n] = bstr.charCodeAt(n);
                    }
                    const idCardBlob = new Blob([u8arr], { type: mime });
                    
                    formDataFile.append('idCard', idCardBlob, idCardFileName || 'id-card');
                    formDataFile.append('email', userEmail);
                    formDataFile.append('nationalId', manualEntryData.nationalId);
                    formDataFile.append('governorate', manualEntryData.governorate);

                    await fetch('/update-step-1', {
                        method: 'POST',
                        body: formDataFile
                    });
                    
                    // تنظيف localStorage
                    localStorage.removeItem('idCardFile');
                    localStorage.removeItem('idCardFileName');
                } catch (idError) {
                    console.log('معلومة: لم يتم إرسال البطاقة', idError);
                }
            }
        }

        // إرسال الصورة الشخصية كـ avatar
        if (profilePhotoFile) {
            try {
                const formDataAvatar = new FormData();
                formDataAvatar.append('avatar', profilePhotoFile);
                formDataAvatar.append('email', userEmail);

                const avatarResponse = await fetch('/upload-avatar', {
                    method: 'POST',
                    body: formDataAvatar
                });

                const avatarData = await avatarResponse.json();
                if (!avatarData.success) {
                    console.warn('تحذير: لم يتم رفع الصورة الشخصية بنجاح');
                }
            } catch (avatarError) {
                console.log('معلومة: لم يتم إرسال الصورة الشخصية', avatarError);
            }
        }

        // جمع البيانات من النموذج
        const formData = {
            residence: document.getElementById('residence').value,
            gender: document.getElementById('gender').value,
            postalCode: document.getElementById('postalCode').value,
            educationLevel: document.getElementById('educationLevel').value,
            college: document.getElementById('university').value,
            highSchool: document.getElementById('highSchool').value,
            fieldOfStudy: document.getElementById('fieldOfStudy').value,
            desiredSalary: parseFloat(document.getElementById('desiredSalary').value) || 0,
            workPeriodFromHour: document.getElementById('workPeriodFromHour').value,
            workPeriodFromPeriod: document.getElementById('workPeriodFromPeriod').value,
            workPeriodToHour: document.getElementById('workPeriodToHour').value,
            workPeriodToPeriod: document.getElementById('workPeriodToPeriod').value,
            workHours: parseInt(document.getElementById('workHours').value) || 0
        };
        
        fetch('/api/users/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                step: 2,
                data: formData
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('✅ تم حفظ البيانات بنجاح!');
                window.location.href = 'Certificates.html';
            } else {
                alert('❌ حدث خطأ: ' + (data.error || data.message || 'فشل حفظ البيانات'));
            }
        })
        .catch(error => {
            console.error('خطأ:', error);
            alert('❌ حدث خطأ في حفظ البيانات');
        });
    });

});
