const express = require('express');
const session = require("express-session");
const app = express();
const path = require('path');
const crypto = require('node:crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET_KEY;
if (isProduction && !sessionSecret) throw new Error('SESSION_SECRET is required in production');
if (isProduction && !process.env.MONGODB_CONNECTION) throw new Error('MONGODB_CONNECTION is required in production');
if (isProduction && !process.env.JWT_SECRET_KEY) throw new Error('JWT_SECRET_KEY is required in production');
if (isProduction) app.set('trust proxy', 1);

/* ------------- public folder ---------------- */
app.use(express.static(__dirname + '/public'));
/* ------------- view engine ------------------ */
app.set('view engine', 'ejs');
/* ------------- session ---------------------- */
app.use(session({
    secret: sessionSecret || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        maxAge: 1000 * 60 * 60 * 24 * 3, // three days to be expired
    }
}));
// Stripe requires the original request bytes to validate webhook signatures.
app.use('/api/v1.0/stripe/webhook', express.raw({ type: 'application/json' }));
/* -------------- using form data -------------- */
app.use(express.urlencoded({extended: true}));
/* -------------- using json data --------------- */
app.use(express.json());



const apiRouter = require('./route/api');
app.use("/api/v1.0/",apiRouter);



/* ---------------- start server --------------- */
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log("server start at port ", 'localhost:' + port);
    });
}

module.exports = app;
