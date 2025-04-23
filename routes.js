const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const passport = require("passport");

const {
    homePage,
    register,
    registerPage,
    login,
    loginPage,
    logout,
} = require("./controllers/userController");

// Middleware проверки авторизации
const ifNotLoggedin = (req, res, next) => {
    if (req.isAuthenticated()) return res.redirect('/home');
    next();
};

const ifLoggedin = (req, res, next) => {
    if (!req.isAuthenticated()) return res.redirect('/login');
    next();
};

// Роуты
router.get('/', ifLoggedin, homePage);
router.get('/home', ifLoggedin, homePage);

router.get("/login", ifNotLoggedin, loginPage);
router.post("/login",
    ifNotLoggedin,
    [
        body("_email", "Invalid email address")
            .notEmpty()
            .trim()
            .isEmail(),
        body("_password", "Password must be at least 4 characters")
            .notEmpty()
            .trim()
            .isLength({ min: 4 }),
    ],
    login
);

router.get("/signup", ifNotLoggedin, registerPage);
router.post("/signup",
    ifNotLoggedin,
    [
        body("_name", "Name must be at least 3 characters")
            .notEmpty()
            .trim()
            .isLength({ min: 3 }),
        body("_email", "Invalid email address")
            .notEmpty()
            .trim()
            .isEmail(),
        body("_password", "Password must be at least 4 characters")
            .notEmpty()
            .trim()
            .isLength({ min: 4 }),
    ],
    register
);

// Выход
router.get('/logout', logout);

// GitHub OAuth2
router.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => res.redirect('/home')
);

// Google OAuth
router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => res.redirect('/home'));

module.exports = router;