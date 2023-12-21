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

    User.findOne({ username }) //check to see if user already exists
        .then(foundUser => {
            if(foundUser){
                // If user already exists, send an error notification
                res.render(
                    "auth/signup",
                    { errorMessage: "Username invalid. Please try a different username." }
                    );
            }
            else{
                bcrypt.hash(password, saltRounds) //to encrypt password
                    .then((hashedPassword) => {
                        console.log('Password hash of new user:', hashedPassword)
                        return User.create({ username, password: hashedPassword})
                    })
                    .then(createdUser => {
                        console.log(`New user ${createdUser.username} has been successfully created and added to the database.`)
                        req.session.currentUser = createdUser;
                        res.redirect('/profile')
                    })
                    .catch(error => {
                        console.log('Error creating user: ', error);
                        next(error);
                    });
                    // Extra code to find and list all users currently stored
                    // in the database after the new user has been successfully created.
                    // I probably need async await here because things are not
                    // processed chronologically and the list of users is displayed before the
                    // user is added to the database. I can confirm this because the console.log
                    // with the password hash is printed after the list of users in the database
                    // I updated the console.log below to reflect this
                    User.find()
                        .then(allUsers => {
                            console.log(`There were already ${allUsers.length} users in the database before the new user was created.`);
                            console.log(`Those ${allUsers.length} users are:`, allUsers);
                            console.log(`With the addition of the new user, there are now ${allUsers.length + 1} users total in the database.`);
                        })
                        .catch(error => {
                            console.log('Error displaying all users in the database: ', error);
                            next(error);
                        });   
            }
        })
        .catch(error => {
            console.log('Error finding user: ', error);
            next(error);
        });
});

// GET route to display the login form to users
router.get('/login', (req, res) => {
    res.render('auth/login')
});

// POST login route ==> to process form data
router.post('/login', (req, res, next) => {
    console.log('SESSION =====> ', req.session);
    const { username, password } = req.body;

    if (username === '' || password === '') {
        console.log("Either a username, a password or both have not been entered.")
        res.render('auth/login', { errorMessage: 'Please enter both a usernamen and password to login.' });
        return;
    };

    User.findOne({ username })
    .then(foundUser => {
        console.log('Found user:', foundUser)
      if (!foundUser) {
        console.log("Username not registered in database.");
        res.render('auth/login', { errorMessage: 'Invalid username or password. Please try again.' });
        return;
      }
      else if (bcrypt.compareSync(password, foundUser.password)) {
        //******* SAVE THE USER IN THE SESSION ********//
        req.session.currentUser = foundUser;
        console.log(`${foundUser.username} has successfully logged in.`)
        res.redirect('/profile');
      }
      else {
        console.log("Incorrect password. ");
        res.render('auth/login', { errorMessage: 'User not found and/or incorrect password.' });
      }
    })
    .catch(error => {
        console.log('Error logging user in: ', error);
        next(error);
    });
});

//GET the profile page
router.get("/profile", (req, res, next) => {
    res.render("user/profile", { userInSession: req.session.currentUser });
});

//POST to log the user out
router.post('/logout', (req, res, next) => {
    req.session.destroy(err => {
      if (err) next(err);
      console.log('The user has successfully logged out.')
      res.redirect('/');
    });
  });

module.exports = router;