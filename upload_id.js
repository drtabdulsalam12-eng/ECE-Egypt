document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('idCardForm');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('idCardInput');
    const previewArea = document.getElementById('previewArea');
    const previewImage = document.getElementById('previewImage');
    const removeBtn = document.getElementById('removeImage');
    const extractedData = document.getElementById('extractedData');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');

    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '#002B5C';
        uploadArea.style.backgroundColor = '#F5FBFF';
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '#B3D9FF';
        uploadArea.style.backgroundColor = '';
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '#B3D9FF';
        uploadArea.style.backgroundColor = '';

        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    fileInput.addEventListener('change', handleFileSelect);

    removeBtn.addEventListener('click', function() {
        fileInput.value = '';
        previewArea.style.display = 'none';
        uploadArea.style.display = 'block';
        extractedData.style.display = 'none';
        errorMessage.style.display = 'none';
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!fileInput.files[0]) {
            showError('يرجى رفع صورة البطاقة الشخصية');
            return;
        }

        const formData = new FormData();
        formData.append('id_card', fileInput.files[0]);

        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        extractedData.style.display = 'none';

        fetch('/process-id', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            loadingMessage.style.display = 'none';

            if (data.success) {
                document.getElementById('nationalId').textContent = data.national_id;
                document.getElementById('birthDate').textContent = data.birth_date;
                document.getElementById('age').textContent = data.age;
                document.getElementById('governorate').textContent = data.governorate;

                extractedData.style.display = 'block';

                setTimeout(() => {
                    window.location.href = 'Certificates.html';
                }, 2000);
            } else {
                showError(data.error);
            }
        })
        .catch(error => {
            loadingMessage.style.display = 'none';
            showError('حدث خطأ في معالجة الصورة. يرجى المحاولة مرة أخرى.');
        });
    });

    function handleFileSelect() {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                previewArea.style.display = 'block';
                uploadArea.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
});
