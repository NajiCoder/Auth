// Require packages
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const exp = require('constants');

// Create the app
const app = express();

// Set up EJS
app.set('view engine', 'ejs');

app.use(express.static("public"));

// Set up body-parser
app.use(bodyParser.urlencoded({extended: true}));




app.listen(3000, function(){
    console.log("server running on port 3000");
})