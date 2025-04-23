const { validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const dbConnection = require("../utils/dbConnection");

// Домашняя страница
exports.homePage = async (req, res, next) => {
    try {
        const userID = req.session.userID || (req.user && req.user.id);
        if (!userID) return res.redirect('/login');

        const [rows] = await dbConnection.execute("SELECT * FROM `users` WHERE `id` = ?", [userID]);
        if (rows.length !== 1) return res.redirect('/logout');

        res.render('home', { user: rows[0] });
    } catch (err) {
        next(err);
    }
};

// Страница регистрации
exports.registerPage = (req, res) => {
    res.render("register");
};

// Регистрация пользователя
exports.register = async (req, res, next) => {
    const errors = validationResult(req);
    const { _name, _email, _password } = req.body;

    if (!errors.isEmpty()) {
        return res.render('register', {
            error: errors.array()[0].msg
        });
    }

    try {
        const [existing] = await dbConnection.execute("SELECT * FROM `users` WHERE `email` = ?", [_email]);
        if (existing.length > 0) {
            return res.render('register', {
                error: 'Email already in use.'
            });
        }

        const hashPass = await bcrypt.hash(_password, 12);
        const [result] = await dbConnection.execute(
            "INSERT INTO `users`(`name`, `email`, `password`) VALUES (?, ?, ?)",
            [_name, _email, hashPass]
        );

        if (result.affectedRows !== 1) {
            return res.render('register', {
                error: 'Registration failed.'
            });
        }

        res.render("register", {
            msg: 'Successfully registered. You can now log in.'
        });
    } catch (err) {
        next(err);
    }
};

// Страница входа
exports.loginPage = (req, res) => {
    res.render("login");
};

// Вход пользователя
exports.login = async (req, res, next) => {
    const errors = validationResult(req);
    const { _email, _password } = req.body;

    if (!errors.isEmpty()) {
        return res.render('login', {
            error: errors.array()[0].msg
        });
    }

    try {
        const [row] = await dbConnection.execute("SELECT * FROM `users` WHERE `email` = ?", [_email]);
        if (row.length !== 1) {
            return res.render('login', {
                error: 'Email not found.'
            });
        }

        const user = row[0];
        const isMatch = await bcrypt.compare(_password, user.password);
        if (!isMatch) {
            return res.render('login', {
                error: 'Incorrect password.'
            });
        }

        // Важно: чтобы работал passport.isAuthenticated()
        req.login(user, (err) => {
            if (err) return next(err);
            req.session.userID = user.id;
            return res.redirect('/home');
        });

    } catch (err) {
        next(err);
    }
};

// Выход
exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
            if (err) return next(err);
            res.redirect('/login');
        });
    });
};