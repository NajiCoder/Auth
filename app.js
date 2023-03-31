require('dotenv').config();
// Require packages
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// Level 2 encryption with secret_keys
// const encrypt = require("mongoose-encryption");
// Level 3 encryption with hashing
// const md5 = require('md5');

// Level 4 encryption with bycrypt
const bcrypt = require('bcrypt');
// create 10 salt rounds
const saltRounds = 10;
const ejs = require('ejs');

// Create the app
const app = express();

// Set up EJS
app.set('view engine', 'ejs');

app.use(express.static("public"));

// Set up body-parser
app.use(bodyParser.urlencoded({extended: true}));


// Connect to the MongoDB database
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

// Create a schema for articles
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});



const User = new mongoose.model("User", userSchema);


app.get("/", function(req, res){
    res.render("home");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", async function(req, res) {


  try {
    // Create a bycrypt.hash() method to hash the password
    const hash = await bcrypt.hash(req.body.password, saltRounds);

    const newUser = new User({
      email: req.body.username,
      // hash the password
      password: hash

    });
    const savedUser = await newUser.save();
    if (savedUser) {
      res.render("secrets");
    }
  } catch (err) {
    console.error(err);
  };
});

app.route("/login")

.get(function(req, res){
    res.render("login");
})

.post(async function(req, res){
    try {
        const user = await User.findOne({ email: req.body.username });
        console.log("User:", user);
        if (!user) {
          // User not found in the database
          return res.render("login", { error: "Invalid email or password" });
        }
        // Use bycrypt.compare() to compare the password
        const passwordMatch = await bcrypt.compare(req.body.password, user.password);
        console.log(passwordMatch);
        if (!passwordMatch) {
          // Password does not match
          return res.render("login", { error: "Invalid email or password" });
        }
        // Email and password match, set session and redirect to secrets
        // req.session.user = user;
        res.render("secrets");
      } catch (err) {
        console.error(err);
        res.render("error", { error: "An error occurred" });
      }
});


app.listen(3000, function(){
    console.log("server running on port 3000");
})