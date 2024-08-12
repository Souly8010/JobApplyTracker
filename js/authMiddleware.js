const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        jwt.verify(token, 'azerty', (err, decodedToken) => {
            if (err) {
                console.log('JWT erreur:', err.message);
                res.redirect('/login');
            } else {
                req.userId = decodedToken.id;
                console.log("Utilisateur authentifié, ID:", req.userId);  // Log ici
                next();
            }
        });
    } else {
        console.log("Pas de token, redirection vers /login");  // Log ici
        res.redirect('/login');
    }
};

const checkUser = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, 'azerty', async (err, decodedToken) => {
            if (err) {
                res.locals.user = null;
                next();
            } else {
                try {
                    let user = await User.findById(decodedToken.id);
                    if (user) {
                        res.locals.user = user;
                    } else {
                        res.locals.user = null;
                    }
                    next();
                } catch (err) {
                    console.log(err);
                    res.locals.user = null;
                    next();
                }
            }
        });
    } else {
        res.locals.user = null;
        next();
    }
};

module.exports = { requireAuth, checkUser };
