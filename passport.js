const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const db = require('./utils/dbConnection');

// Сериализация: сохраняем user.id в сессии
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Десериализация: по id получаем данные пользователя из базы
passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0]);
  } catch (err) {
    done(err);
  }
});

// GitHub OAuth
passport.use(new GitHubStrategy({
  clientID: 'Ov23lirIuplIXcSP6f1Z',
  clientSecret: '961c8b52e90df1f017d2303f6f067a93524a1d9e',
  callbackURL: 'http://localhost:3001/auth/github/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;

    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) return done(null, existingUsers[0]);

    const newUser = {
      name: profile.displayName || profile.username,
      email,
      password: ''
    };

    const [result] = await db.query('INSERT INTO users SET ?', newUser);
    newUser.id = result.insertId;
    return done(null, newUser);
  } catch (err) {
    return done(err);
  }
}));

// Google OAuth
passport.use(new GoogleStrategy({
  clientID: '755429604828-ne7cut8rhdd8qcq6bclmqbokt7eob2pi.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'http://localhost:3001/auth/google/callback',
  passReqToCallback: true
},
async (request, accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.email;

    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) return done(null, existingUsers[0]);

    const newUser = {
      name: profile.displayName,
      email,
      password: ''
    };

    const [result] = await db.query('INSERT INTO users SET ?', newUser);
    newUser.id = result.insertId;
    return done(null, newUser);
  } catch (err) {
    return done(err);
  }
}));