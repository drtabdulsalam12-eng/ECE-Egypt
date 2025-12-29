const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/verify-code', userController.verifyCode);
router.post('/resend-code', userController.resendVerificationCode);
router.post('/add-friend', protect, userController.addFriend);
router.get('/profile-by-token', protect, userController.getProfileByToken);
router.get('/profile/:id', protect, userController.getUserProfile);
router.post('/update-profile', protect, userController.updateUserProfile);
router.post('/update-profile-info', protect, userController.updateProfileInfo);
router.get('/profile-status/:id', userController.getProfileStatus);
router.delete('/me', protect, userController.deleteAccount);

module.exports = router;
