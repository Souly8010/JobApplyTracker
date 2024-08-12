const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const authenRoutes = require('./routes/authenRoutes');
const { requireAuth, checkUser } = require('./js/authMiddleware');
const session = require('express-session');
const Job = require('./models/Job');
const path = require('path');
require('dotenv').config({ path: './jwt.env' });

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: 'azerty',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // Mettre à true si vous utilisez HTTPS
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Fichiers statiques pour les téléchargements
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// View engine
app.set('view engine', 'ejs');

// Database connection
const dbURI = 'mongodb+srv://souly8010:Jett108001%40%21@project.8bvfvng.mongodb.net/';
mongoose.connect(dbURI)
  .then((result) => console.log('Connected to DB'))
  .catch((err) => console.log('DB Connection Error:', err));

// Appliquer le middleware checkUser à toutes les routes
app.use('*', checkUser);

// Routes non protégées
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.redirect('/dashboard'); // Si l'utilisateur est authentifié, vous pouvez le rediriger vers le tableau de bord ou une autre page
});
// Routes protégées ou spécifiques à l'authentification
app.use('/', authenRoutes);

app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

// Route pour afficher le tableau de bord avec les jobs
app.get('/dashboard', requireAuth, async (req, res) => {
  try {
      console.log("Avant de récupérer les jobs");
      const jobs = await Job.find().sort({ createdAt: 1 });
      console.log("Jobs récupérés:", jobs);
      res.render('dashboard', { user: res.locals.user, jobs: jobs, pageClass: 'dashboard-page'});
  } catch (error) {
      console.error("Erreur lors du chargement des jobs:", error);
      res.status(500).send("Erreur lors du chargement du tableau de bord");
  }
});

// Route pour afficher la page de création de job
app.get('/creatjob', requireAuth, (req, res) => {
  res.render('creatjob');
});

// Route pour gérer la création du job
app.post('/creatjob', requireAuth, async (req, res) => {
  try {
      const { jobTitle, website, employerName, employerEmail, phone, address, comment } = req.body;
      console.log('Données reçues:', req.body);

      const newJob = new Job({
          title: jobTitle,
          website: website,
          employerName: employerName,
          employerEmail: employerEmail,
          phone: phone,
          address: address,
          comment: comment,
          status: 'en attente', // Par défaut
          createdAt: new Date()
      });

      await newJob.save(); // Sauvegarder le job dans la base de données
      res.redirect('/dashboard'); // Rediriger vers le dashboard après création
  } catch (error) {
      console.error('Erreur lors de la création du job :', error);
      res.status(500).send('Erreur lors de la création du job');
  }
});

// Route pour mettre à jour le statut d'un job
app.post('/updateStatus/:id', requireAuth, async (req, res) => {
  try {
      const jobId = req.params.id;
      const newStatus = req.body.status;
      await Job.findByIdAndUpdate(jobId, { status: newStatus }); // Mise à jour du statut du job
      res.redirect('/dashboard'); // Redirige vers le dashboard après mise à jour
  } catch (error) {
      console.error('Erreur lors de la mise à jour du statut :', error);
      res.status(500).send('Erreur lors de la mise à jour du statut');
  }
});

// Route pour supprimer un job
app.post('/deletejob/:id', requireAuth, async (req, res) => {
  try {
      const jobId = req.params.id;
      await Job.findByIdAndDelete(jobId); // Supprime le job de la base de données
      res.redirect('/dashboard'); // Redirige vers le dashboard après suppression
  } catch (error) {
      console.error('Erreur lors de la suppression du job :', error);
      res.status(500).send('Erreur lors de la suppression du job');
  }
});

// Route pour afficher le profil utilisateur
app.get('/myprofil', requireAuth, (req, res) => {
    res.render('myprofil', { user: req.session.user });
});

// Lancement du serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
