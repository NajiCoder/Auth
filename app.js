require('dotenv').config();
// Require packages
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");
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

// Add encyption to the schema, Before creating the Model
userSchema.plugin(encrypt,{ secret: process.env.SECRET_KEY, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);


app.get("/", function(req, res){
    res.render("home");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.route("/login")

.get(function(req, res){
    res.render("login");
})

.post(async function(req, res){
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
          // User not found in the database
          return res.render("login", { error: "Invalid email or password" });
        }
        const passwordMatch = await User.findOne({password: req.body.password});
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


app.post("/register", async function(req, res) {
    try {
      const newUser = new User({
        email: req.body.username,
        password: req.body.password
      });
      const savedUser = await newUser.save();
      if (savedUser) {
        res.render("secrets");
      }
    } catch (err) {
      console.error(err);
    }
});



app.listen(3000, function(){
    console.log("server running on port 3000");
})