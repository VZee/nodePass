// load what we need for local and google logins
var LocalStrategy = require("passport-local").Strategy;
var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

// load the user model
var User = require("../app/models/user");

// load the auth variables
var configAuth = require("./auth");

// expose this function to the app using module.exports
module.exports = function(passport){

    // =========================================================================
    // passport session setup 
    // =========================================================================
    // serialize the user for the session
    passport.serializeUser(function(user, done){
        done(null, user.id);
    });

    // deserialize the user
    passport.deserializeUser(function(id, done){
        User.findById(id, function(err, user){
            done(err, user);
        });
    });


    // =========================================================================
    // local signup 
    // =========================================================================
    passport.use("local-signup", new LocalStrategy({
        usernameField : "email",
        passwordField : "password",
        passReqToCallback : true 
    },
    function(req, email, password, done){
        process.nextTick(function(){
            // find a user whose email is the same as the forms email
            //  see if the user trying to login already exists
            User.findOne({"local.email": email }, function(err, existingUser){
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // see if there is already a user with that email
                if (existingUser)
                    return done(null, false, req.flash("signupMessage", "That email is already taken."));
                
                //  if the user is logged in and is connecting a new local account
                if(req.user){
                    var user = req.user;
                    user.local.email = email;
                    user.local.password = user.generateHash(password);
                    user.save(function(err) {
                        if (err)
                            throw err;

                        return done(null, user);
                    });
                } 

                // if there is no user with that email, create the user, set the local credentials and save
                else{
                    var newUser = new User();

                    newUser.local.email = email;
                    newUser.local.password = newUser.generateHash(password);

                    newUser.save(function(err){
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }
            });    
        });
    }));


    // =========================================================================
    // local login
    // =========================================================================
    passport.use("local-login", new LocalStrategy({
        usernameField : "email",
        passwordField : "password",
        passReqToCallback : true
    },
    function(req, email, password, done){ 
        // find a user whose email is the same as the forms email
        // check to see if the user trying to login already exists
        process.nextTick(function()){
        User.findOne({"local.email" :  email }, function(err, user){
                // if there are any errors, return the error before anything else
                if (err)
                    return done(err);

                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash("loginMessage", "User not found. Please sign up as a new user.")); 

                // if the user is found but the password is wrong
                if (!user.validPassword(password))
                    return done(null, false, req.flash("loginMessage", "Password is incorrect. Please reenter your password.")); 

                // return the user
                else
                    return done(null, user);
            });
        }
    }));


    // =========================================================================
    // Google login
    // =========================================================================
    passport.use(new GoogleStrategy({
        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        callbackURL: configAuth.googleAuth.callbackURL,
        passReqToCallback : true
    },
    function(req, token, refreshToken, profile, done){
        // make the code asynchronous - User.findOne won't fire until we have all our data back from Google
        process.nextTick(function(){
            // check if the user is already logged in
            if (!(req.user)){
                // find the user in the database based on their google id
                User.findOne({"google.id": profile.id }, function(err, user){

                    // if there is an error
                    if (err)
                        return done(err);

                    // if the user is found
                    if (user){
                        //if the user was linked at one point
                        if (!user.google.token){
                            user.google.token = token;
                            user.google.name  = profile.displayName;
                            user.google.email = profile.emails[0].value;

                            user.save(function(err) {
                                if (err)
                                    throw err;

                                return done(null, user);
                            });
                        }

                        return done(null, user); 
                    }
                    
                    else{
                        // if there is no user found with that google id, create them
                        var newUser = new User();

                        // set the google information and pull the first email
                        newUser.google.id = profile.id;           
                        newUser.google.token = token;                   
                        newUser.google.name = profile.displayName;
                        newUser.google.email = profile.emails[0].value; 

                        // save the user
                        newUser.save(function(err) {
                            if (err)
                                throw err;

                            return done(null, newUser);
                        });
                    }
                });
            }
             
            else{
                // link accounts since the user exists and is logged in
                var user = req.user; // pull the user out of the session

                // set the google information and pull the first email
                user.google.id = profile.id;           
                user.google.token = token;                   
                user.google.name = profile.displayName;
                user.google.email = profile.emails[0].value; 

                // save the user
                user.save(function(err) {
                    if (err)
                        throw err;

                    return done(null, user);
                });
            }
        });
    }));
}