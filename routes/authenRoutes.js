const { Router } = require('express');
const authController = require('../controllers/authController');
const { requireAuth, checkUser } = require('../js/authMiddleware');
const router = Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'profilPictures') {
            cb(null, 'uploads/profilPictures/');
        } else if (file.fieldname === 'cv') {
            cb(null, 'uploads/cvs/');
        }
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Route pour le téléchargement de la photo de profil
router.post('/uploadProfilePicture', upload.single('profilePicture'), (req, res) => {
    // Après le téléchargement, stockez le chemin dans la base de données
    const filePath = '/uploads/profilePictures/' + req.file.filename;
    
    // Par exemple, mettre à jour l'utilisateur connecté
    User.findByIdAndUpdate(req.session.user._id, { profilePicture: filePath }, (err, result) => {
        if (err) {
            return res.status(500).send("Erreur lors de la mise à jour de la photo de profil.");
        }
        req.session.user.profilePicture = filePath; // Mettre à jour la session utilisateur
        res.redirect('/profile'); // Rediriger vers une page de profil ou autre
    });
});

// Route pour la déconnexion
router.get('/logout', (req, res) => {
    console.log('Déconnexion en cours...');
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur lors de la déconnexion:', err);
            return res.redirect('/');
        }
        res.clearCookie('connect.sid'); // Optionnel, pour s'assurer que le cookie de session est également supprimé
        console.log('Déconnecté avec succès, redirection vers /login');
        return res.redirect('/login'); // Redirige vers la page de connexion
    });
});

// Routes publiques
router.get('/login', authController.login_get);
router.get('/register', authController.register_get);

// Routes protégées
// router.get('/dashboard', requireAuth, authController.dashboard_get);
router.get('/myprofil', requireAuth, authController.myprofil_get);
router.get('/creatjob', requireAuth, authController.creatjob);

// Auth routes
router.post('/login', authController.login_post);
router.post('/register', upload.fields([{ name: 'profilePicture', maxCount: 1 }, { name: 'cv', maxCount: 1 }]), authController.register_post);
module.exports = router;