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
// require mongoose-findorcreate
const findOrCreate = require('mongoose-findorcreate');
// Level 6 Using passport-google-oauth20 package
// require google-oauth20
const GoogleStrategy = require('passport-google-oauth20').Strategy;

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
  password: String,
  // add googleId to the userSchema
  googleId: String,
  // Add scret field 
  secret : String,
});

// Add passportLocalMongoose to the userSchema as a plugin
userSchema.plugin(passportLocalMongoose);
// Add mongoose-findorcreate to the userSchema as a plugin
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

// Create a new user with passport-local-mongoose
passport.use(User.createStrategy());

// change from local authentication to any authentication
// Serialize and deserialize the user with passport
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});


// set app google strategy, after setting up passport and session
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_sSECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    }); 
  } 
));

app.get("/", function(req, res){
    res.render("home");
});

// Create a route for the auth/google
app.get("/auth/google", passport.authenticate("google", {scope: ["profile"]})); // authenticate with google strategy

// Create a route for the auth/google/secrets
app.get("/auth/google/secrets", passport.authenticate("google", {failureRedirect: "/login"}), function(req, res){
  // Successful authentication, redirect to secrets.
  res.redirect("/secrets");
});


// create a route for the secrets page
app.get("/secrets", async function(req, res){

  try {
    // Check the Db to and check all secrets fields
  const foundUsersSecrets = await User.find({"secret": {$ne:null}});
  if (foundUsersSecrets){
    res.render("secrets", {userWithSecrets : foundUsersSecrets});
  };
  } catch (err) {
    res.send(err);
  };
  
});

// Create a route for the submit page
app.route("/submit")

.get(function(req, res){
  // check if the user is authenticated
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
})

.post(async function(req, res){
  const submitedSecret = req.body.secret;
  const currentUser = req.user

  const foundUser = await User.findById(currentUser.id);
  if (foundUser){
    foundUser.secret = submitedSecret;
    await foundUser.save();
    res.redirect("/secrets");
  }

  console.log(req.user);
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
      passport.authenticate("local")(req, res, function(){ // authenticate with local strategy
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