const express = require('express');
const app = express();

const userModel = require('./models/user');
const postModel = require('./models/post');

const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Home page
app.get('/', (req, res) => {
    res.render("index");
});


// Login page
app.get('/login', (req, res) => {
    res.render("login");
});


// Register
app.post('/register', async (req, res) => {

    let { email, password, username, name, age } = req.body;

    let user = await userModel.findOne({ email });

    if (user) {
        return res.status(500).send("User already registered");
    }

    bcrypt.genSalt(10, (err, salt) => {

        bcrypt.hash(password, salt, async (err, hash) => {

            let user = await userModel.create({
                username,
                email,
                age,
                name,
                password: hash
            });

            let token = jwt.sign(
                {
                    email: user.email,
                    userid: user._id
                },
                "shhhhhhh"
            );

            res.cookie("token", token);

            res.redirect("/profile");
        });
    });
});


// Login
app.post('/login', async (req, res) => {

    let { email, password } = req.body;

    let user = await userModel.findOne({ email });

    if (!user) {
        return res.status(500).send("Something went wrong");
    }

    bcrypt.compare(password, user.password, (err, result) => {

        if (result) {

            let token = jwt.sign(
                {
                    email: user.email,
                    userid: user._id
                },
                "shhhhhhh"
            );

            res.cookie("token", token);

            res.redirect("/profile");

        } else {

            res.redirect("/login");

        }
    });
});


// Protected profile
app.get('/profile', isLoggedIn, async (req, res) => {

    let user = await userModel.findOne({
        email: req.user.email
    });

    res.render("profile", { user });

});


// Logout
app.get('/logout', (req, res) => {

    res.cookie("token", "");

    res.redirect("/login");

});


// Authentication middleware
function isLoggedIn(req, res, next) {

    if (!req.cookies.token) {
        return res.redirect("/login");
    }

    try {

        let data = jwt.verify(
            req.cookies.token,
            "shhhhhhh"
        );

        req.user = data;

        next();

    } catch (err) {

        res.redirect("/login");

    }
}


app.listen(3000);