module.exports = function(app, passport){
    // =====================================
    // route for home page - load the index.ejs file
    // =====================================
    app.get('/', function(req, res){
        res.render("index.ejs");
    });


    // =====================================
    // route for login - show the login form, render the page, and pass in any flash data (if needed)
    // =====================================
    app.get("/login", function(req, res){
        res.render("login.ejs", {message: req.flash("loginMessage")}); 
    });


    // =====================================
    // process the login form
    // =====================================
    app.post("/login", passport.authenticate("local-login",{
        successRedirect : "/profile", 
        failureRedirect : "/login", 
        failureFlash : true 
    }));


    // =====================================
    // signup - show the form, render the page, and pass in any flash data (if needed)
    // =====================================
    app.get("/signup", function(req, res){
        res.render("signup.ejs", {message: req.flash("signupMessage")});
    });


    // =====================================
    // process the signup form
    // =====================================
    app.post("/signup", passport.authenticate("local-signup",{
        successRedirect : "/profile", 
        failureRedirect : "/signup", 
        failureFlash : true 
    }));


    // =====================================
    // route for the profile page - verify the user is logged in
    // =====================================
    app.get("/profile", isLoggedIn, function(req, res){
        res.render("profile.ejs",{
            user : req.user 
        });
    });


    // =====================================
    // route for logout
    // =====================================
    app.get("/logout", function(req, res){
        req.logout();
        res.redirect('/');
    });


    // =====================================
    // google routes - send to google to authenticate
    // =====================================
    app.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}));

    // callback after google authentication
    app.get("/auth/google/callback", passport.authenticate("google", {
        successRedirect: "/profile",
        failureRedirect: '/'
    }));


    // =============================================================================
    // authorizing - connecting other accounts if user is already logged in
    // =============================================================================
    // locally 
    app.get("/connect/local", function(req, res){
        res.render("connect-local.ejs", {message: req.flash("loginMessage")});
    });
    app.post("/connect/local", passport.authenticate("local-signup", {
        successRedirect: "/profile",       
        failureRedirect: "/connect/local", 
        failureFlash: true 
    }));

    // google - send to google to do the authentication
    app.get("/connect/google", passport.authorize("google", {scope: ["profile", "email"]}));

    // the callback after google has authorized the user
    app.get("/connect/google/callback", passport.authorize("google", {
        successRedirect : "/profile",
        failureRedirect : '/'       
    }));


// =====================================
// route middleware to make sure a user is logged in
// =====================================
function isLoggedIn(req, res, next){
    if (req.isAuthenticated())
        return next();

    // if the user is not logged in redirect them to the home page
    res.redirect('/');
}