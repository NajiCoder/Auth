require('dotenv').config();
// Require packages
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// Level 5 Using passport package
// require express-session
const session = require('express-session');
// require passport
const passport = require('passport');
// require passport-local-mongoose
const passportLocalMongoose = require('passport-local-mongoose');

// Create the app
const app = express();

// Set up EJS
app.set('view engine', 'ejs');

app.use(express.static("public"));

// Set up body-parser
app.use(bodyParser.urlencoded({extended: true}));

// Set up express-session
app.use(session({
  // Use a secret key
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

// Initialize passport
app.use(passport.initialize());
// Use passport to manage the session
app.use(passport.session());



// Connect to the MongoDB database
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

// Create a schema for articles
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// Add passportLocalMongoose to the userSchema as a plugin
userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);

// Create a new user with passport-local-mongoose
passport.use(User.createStrategy());

// Serialize and deserialize the user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/", function(req, res){
    res.render("home");
});

// create a route for the secrets page
app.get("/secrets", function(req, res){
  // check if the user is authenticated
  if (req.isAuthenticated()){
    res.render("secrets"); 
  } else {
    res.redirect("/login");
  }
});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", async function(req, res) {

  try {
    // Create a new user with passport-local-mongoose
    const newUser = await User.register({username: req.body.username}, req.body.password);
    // check if the user is created
    if (newUser) {
      // Authenticate the user
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    } else {
      res.send("User not created");
    };
  } catch (err) {
    res.send(err);
  }
  
});

app.route("/login")

.get(function(req, res){
    res.render("login");
})

.post(function(req, res){
    // Create a user
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    // Use passport to login the user
    req.login(user, function(err){
        if (err){
            console.log(err);
        } else {
            // Authenticate the user
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

// Create a route for the logout
app.get("/logout", function(req, res){
    // Use passport to logout the user
    // add a callback function to logout
    req.logout(function(err){
      if (err){
        console.log(err);
      } else {
        res.redirect("/");
      }});
});


app.listen(3000, function(){
    console.log("server running on port 3000");
})