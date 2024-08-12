const User = require("../models/User");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");

// handles errors
const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: "", password: "" };

  // incorrect email
  if (err.message === "incorrect email") {
    errors.email = "That email is not registered";
  }

  // incorrect password
  if (err.message === "incorrect password") {
    errors.password = "That password is incorrect";
  }

  // Duplicate error code
  if (err.code === 11000) {
    errors.email = "This email is already registered";
    return errors;
  }

  // Validation errors
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }
  return errors;
};

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, "process.env.JWT_SECRET", {
    expiresIn: maxAge,
  });
};

module.exports.register_get = (req, res) => {
  res.render("register");
};

// Configuration de Multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage }).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "cv", maxCount: 1 },
]);

// Inscription
exports.register_post = async (req, res) => {
  try {
      const { firstname, lastname, email, password, repeat_password } = req.body;

      console.log('Mot de passe lors de l\'inscription:', password);

      if (!password || password !== repeat_password) {
          return res.status(400).json({ error: "Les mots de passe ne correspondent pas." });
      }

      const newUser = new User({
          firstname,
          lastname,
          email: email.trim(),
          password: password
      });

      await newUser.save();
      console.log('Utilisateur enregistré avec succès:', newUser);

      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ success: true, message: "Inscription réussie", token });

  } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({ error: "Erreur lors de l'enregistrement de l'utilisateur." });
  }
};

module.exports.login_get = (req, res) => {
  res.render('login', { pageClass: 'login-page' });
};

// Connexion
exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.findOne({ email: email.trim() });

      if (!user) {
          return res.status(400).json({ error: "Utilisateur non trouvé." });
      }

      const match = await bcrypt.compare(password, user.password);

      if (match) {
          const token = jwt.sign({ id: user._id }, 'azerty', { expiresIn: '1d' });

          res.cookie('jwt', token, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 });
        
          // Stocker l'email et la photo de profil dans la session
          req.session.user = {
              email: user.email,
              profilePicture: user.profilePicture // Assurez-vous que ce champ existe dans votre schéma utilisateur
          };

          return res.status(200).json({ 
            success: true, 
            message: "Connexion réussie",  // Ajoutez cette ligne pour envoyer un message de succès
            redirectUrl: '/dashboard' 
        });
      } else {
          return res.status(400).json({ error: "Mot de passe incorrect." });
      }
  } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return res.status(500).json({ error: "Erreur lors de la connexion." });
  }
};
module.exports.dashboard_get = (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("dashboard", { user: req.session.user });
};

module.exports.myprofil_get = (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("myprofil", { user: req.session.user });
};

module.exports.creatjob = (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("creatjob", { user: req.session.user });
};