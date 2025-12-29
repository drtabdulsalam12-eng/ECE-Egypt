document.addEventListener('DOMContentLoaded', function() {
    const addSkillBtn = document.getElementById('addSkillBtn');
    const addLanguageBtn = document.getElementById('addLanguageBtn');
    const skillForm = document.getElementById('skillForm');
    const languageForm = document.getElementById('languageForm');
    const saveSkillBtn = document.getElementById('saveSkillBtn');
    const saveLanguageBtn = document.getElementById('saveLanguageBtn');
    const skillNameInput = document.getElementById('skillName');
    const languageNameSelect = document.getElementById('languageName');
    const nativeLanguageInput = document.getElementById('nativeLanguage');
    const proficiencySelect = document.getElementById('proficiency');
    const itemsList = document.getElementById('itemsList');
    const countSpan = document.getElementById('count');
    const maxLimitWarning = document.getElementById('maxLimitWarning');

    let savedItems = [];
    const MAX_ITEMS = 7;

    // وظيفة جلب البريد الإلكتروني من localStorage
    function getEmail() {
        let email = localStorage.getItem('userEmail');
        if (!email || email === 'null' || email === '') {
            email = prompt("من فضلك أدخلي بريدك الإلكتروني لحفظ المهارات واللغات:");
            if (email) {
                email = email.trim();
                localStorage.setItem('userEmail', email);
            }
        }
        return email;
    }

    // تحديث عدد العناصر
    function updateCount() {
        countSpan.textContent = savedItems.length;
        if (savedItems.length >= MAX_ITEMS) {
            maxLimitWarning.style.display = 'block';
            maxLimitWarning.textContent = `⚠️ وصلت إلى الحد الأقصى (${MAX_ITEMS} عناصر)`;
            addSkillBtn.disabled = true;
            addLanguageBtn.disabled = true;
        } else {
            maxLimitWarning.style.display = 'none';
            addSkillBtn.disabled = false;
            addLanguageBtn.disabled = false;
        }
    }

    // عرض العنصر في القائمة
    function displayItem(item, index) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-display';
        itemDiv.style.cssText = 'background: #f9f9f9; border: 1px solid #ddd; padding: 12px; margin: 10px 0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;';
        
        let itemText = '';
        if (item.type === 'skill') {
            itemText = `<strong>مهارة:</strong> ${item.name}`;
        } else {
            itemText = `<strong>لغة:</strong> ${item.name} - <em>إجادة: ${item.proficiency_level}</em>`;
        }
        
        const detailsSpan = document.createElement('span');
        detailsSpan.innerHTML = itemText;
        detailsSpan.style.flex = '1';
        
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.cssText = 'display: flex; gap: 8px;';
        
        const editBtn = document.createElement('button');
        editBtn.textContent = 'تعديل';
        editBtn.className = 'btn btn-secondary';
        editBtn.style.padding = '6px 12px';
        editBtn.onclick = () => editItem(index);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'حذف';
        deleteBtn.className = 'btn btn-secondary';
        deleteBtn.style.padding = '6px 12px';
        deleteBtn.style.background = '#f44336';
        deleteBtn.style.color = 'white';
        deleteBtn.onclick = () => deleteItem(index);
        
        buttonsDiv.appendChild(editBtn);
        buttonsDiv.appendChild(deleteBtn);
        
        itemDiv.appendChild(detailsSpan);
        itemDiv.appendChild(buttonsDiv);
        
        return itemDiv;
    }

    // تحديث قائمة العناصر
    function refreshList() {
        itemsList.innerHTML = '';
        savedItems.forEach((item, index) => {
            itemsList.appendChild(displayItem(item, index));
        });
        updateCount();
    }

    // حذف عنصر
    function deleteItem(index) {
        if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
            savedItems.splice(index, 1);
            refreshList();
        }
    }

    // تعديل عنصر
    function editItem(index) {
        const item = savedItems[index];
        
        if (item.type === 'skill') {
            skillNameInput.value = item.name;
            skillForm.style.display = 'block';
            addSkillBtn.style.display = 'none';
            saveSkillBtn.textContent = 'تحديث المهارة';
            saveSkillBtn.onclick = function() {
                const name = skillNameInput.value.trim();
                if (!name) {
                    alert("يرجى كتابة اسم المهارة أولاً");
                    return;
                }
                savedItems[index].name = name;
                skillNameInput.value = '';
                skillForm.style.display = 'none';
                addSkillBtn.style.display = 'block';
                saveSkillBtn.textContent = 'حفظ المهارة';
                saveSkillBtn.onclick = () => saveSkill();
                refreshList();
            };
        } else {
            languageNameSelect.value = item.name;
            nativeLanguageInput.value = item.native_language || '';
            proficiencySelect.value = item.proficiency_level;
            languageForm.style.display = 'block';
            addLanguageBtn.style.display = 'none';
            saveLanguageBtn.textContent = 'تحديث اللغة';
            saveLanguageBtn.onclick = function() {
                const language = languageNameSelect.value.trim();
                const proficiency = proficiencySelect.value.trim();
                const nativeLanguage = nativeLanguageInput.value.trim();
                
                if (!language || !proficiency || !nativeLanguage) {
                    alert("يرجى ملء جميع الحقول");
                    return;
                }
                
                savedItems[index] = { 
                    type: 'language', 
                    name: language,
                    proficiency_level: proficiency,
                    native_language: nativeLanguage
                };
                languageNameSelect.value = '';
                nativeLanguageInput.value = '';
                proficiencySelect.value = '';
                languageForm.style.display = 'none';
                addLanguageBtn.style.display = 'block';
                saveLanguageBtn.textContent = 'حفظ اللغة';
                saveLanguageBtn.onclick = () => saveLanguage();
                refreshList();
            };
        }
    }

    // وظيفة الإرسال للسيرفر
    async function sendToServer(payload) {
        const email = getEmail();
        if (!email) {
            alert("❌ البريد الإلكتروني مطلوب");
            return false;
        }

        payload.email = email;

        try {
            const response = await fetch('/save-skill-language', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`خطأ HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error("Error:", error);
            alert("❌ فشل الاتصال بالسيرفر!");
            return false;
        }
    }

    // حفظ المهارة
    function saveSkill() {
        const name = skillNameInput.value.trim();
        if (!name) {
            alert("يرجى كتابة اسم المهارة أولاً");
            return;
        }

        if (savedItems.length >= MAX_ITEMS) {
            alert(`⚠️ وصلت إلى الحد الأقصى (${MAX_ITEMS} عناصر)`);
            return;
        }

        sendToServer({ type: 'skill', name: name }).then(success => {
            if (success) {
                savedItems.push({ type: 'skill', name: name });
                skillNameInput.value = '';
                skillForm.style.display = 'none';
                addSkillBtn.style.display = 'block';
                refreshList();
            }
        });
    }

    // حفظ اللغة
    function saveLanguage() {
        const language = languageNameSelect.value.trim();
        const proficiency = proficiencySelect.value.trim();
        const nativeLanguage = nativeLanguageInput.value.trim();
        
        if (!language || !proficiency || !nativeLanguage) {
            alert("يرجى ملء جميع الحقول");
            return;
        }

        if (savedItems.length >= MAX_ITEMS) {
            alert(`⚠️ وصلت إلى الحد الأقصى (${MAX_ITEMS} عناصر)`);
            return;
        }

        sendToServer({ 
            type: 'language', 
            name: language,
            proficiency_level: proficiency,
            native_language: nativeLanguage
        }).then(success => {
            if (success) {
                savedItems.push({ 
                    type: 'language', 
                    name: language,
                    proficiency_level: proficiency,
                    native_language: nativeLanguage
                });
                languageNameSelect.value = '';
                nativeLanguageInput.value = '';
                proficiencySelect.value = '';
                languageForm.style.display = 'none';
                addLanguageBtn.style.display = 'block';
                refreshList();
            }
        });
    }

    // ========== زر إضافة مهارة جديدة ==========
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', function() {
            skillForm.style.display = 'block';
            addSkillBtn.style.display = 'none';
        });
    }

    // ========== زر حفظ المهارة ==========
    if (saveSkillBtn) {
        saveSkillBtn.addEventListener('click', saveSkill);
    }

    // ========== زر إضافة لغة جديدة ==========
    if (addLanguageBtn) {
        addLanguageBtn.addEventListener('click', function() {
            languageForm.style.display = 'block';
            addLanguageBtn.style.display = 'none';
        });
    }

    // ========== زر حفظ اللغة ==========
    if (saveLanguageBtn) {
        saveLanguageBtn.addEventListener('click', saveLanguage);
    }

    // ========== أزرار الإلغاء ==========
    const cancelBtns = document.querySelectorAll('.cancel-btn');
    cancelBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const parentForm = btn.closest('.item-form');
            if (parentForm) {
                parentForm.style.display = 'none';
                
                if (parentForm.id === 'skillForm' && addSkillBtn) {
                    addSkillBtn.style.display = 'block';
                    skillNameInput.value = '';
                    saveSkillBtn.textContent = 'حفظ المهارة';
                }
                if (parentForm.id === 'languageForm' && addLanguageBtn) {
                    addLanguageBtn.style.display = 'block';
                    languageNameSelect.value = '';
                    nativeLanguageInput.value = '';
                    proficiencySelect.value = '';
                    saveLanguageBtn.textContent = 'حفظ اللغة';
                }
            }
        });
    });

    // تحميل البيانات الأولية
    refreshList();
});
