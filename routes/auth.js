const bcrypt = require('bcrypt');
const saltRounds = 10;
const express = require('express');
const router = express.Router();

const User = require("../models/User.model");

// GET Signup page 
router.get("/signup", (req, res, next) => {
    res.render("auth/signup")
});

//POST Signup
router.post("/signup", (req, res, next) => {
    const { username, password } = req.body;

    User.findOne({username})
        .then(foundUser => {
            if(foundUser){
                // send an error notification
                res.render("auth/signup", { errorMessage: "Username exists"})
            }
            else{
                bcrypt.hash(password, saltRounds) //use to encrypt password
                    .then((hash) => {
                        console.log('hash', hash)
                        return User.create({ username, password: hash})
                    })
                    .then(user => {
                        res.redirect('/profile')
                    })
            }
        })
        .catch(err => console.log(err))
});

//GET the profile page
router.get("/profile", (req, res, next) => {
    res.render("auth/profile");
});

module.exports = router;