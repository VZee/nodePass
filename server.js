// ===============================================================
// set up 
// ===============================================================
var express = require("express");
var app = express();
var port = process.env.PORT || 8080;
var mongoose = require("mongoose");
var passport = require("passport");
var flash = require("connect-flash");

var morgan = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");

// ===============================================================
// configuration 
// ===============================================================
mongoose.connect(configDB.url);         
require("./config/passport")(passport); 

// ===============================================================
// set up the express application
// ===============================================================
app.use(morgan("dev"));         
app.use(cookieParser());        
app.use(bodyParser().json());   
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");  

// ===============================================================
// required for passport
// ===============================================================
app.use(session({secret: "testingSessionSecret"})); 
app.use(passport.initialize());
app.use(passport.session());    
app.use(flash());              

// ===============================================================
// routes 
// ===============================================================
require("./app/routes.js")(app, passport); 

// ===============================================================
// launch 
// ===============================================================
app.listen(port);
console.log("Running on port " + port);