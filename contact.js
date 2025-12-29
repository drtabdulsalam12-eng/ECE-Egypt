document.addEventListener('DOMContentLoaded', function() {
    const contactButton = document.getElementById('contactButton');
    const contactModal = document.getElementById('contactModal');
    const closeModal = document.getElementById('closeModal');

    if (contactButton && contactModal) {
        contactButton.addEventListener('click', function() {
            contactModal.classList.add('active');
        });

        closeModal.addEventListener('click', function() {
            contactModal.classList.remove('active');
        });

        contactModal.addEventListener('click', function(e) {
            if (e.target === contactModal) {
                contactModal.classList.remove('active');
            }
        });
    }
});
