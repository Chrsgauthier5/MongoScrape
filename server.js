const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
var exphbs = require("express-handlebars");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
const axios = require("axios"); // get requests
const cheerio = require("cheerio"); // scraping

// Require all models
const db = require("./models");

const PORT = 3000;

// Initialize Express
const app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Handlebars
app.set("views", "./views");
app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "main"
    }));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/craigslistScraper";

mongoose.connect(MONGODB_URI);


// Routes

app.get("/", function (req, res) {

    res.render("index");
});

app.get("/saved", function (req, res) {
    db.Post.find({ saved: true })
        .then(function (savedPosts) {
            console.log(savedPosts)
            res.render("saved", {
                saved: savedPosts
            });
        });
});

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("https://nh.craigslist.org/d/video-gaming/search/vga").then(function (response) {
        // Load the HTML into cheerio and save it to a variable
        // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
        const $ = cheerio.load(response.data);
        // With cheerio, find each p-tag with the "title" class
        // (i: iterator. element: the current element)
        $("li.result-row").each(function (i, element) {

            let results = {};

            // Save the text of the element in a "title" variable
            results.title = $(element).find("a.result-title").html();
            results.link = $(element).find("a").attr("href");
            results.price = $(element).find("span.result-price").html();
            results.location = $(element).find("span.result-hood").html();
            results.timePosted = $(element).find("time.result-date").attr("title");

            // if (title.split(" ").indexOf("Nintendo") > 0) {}
            // ^ optional way to filter results based on presence of keyword.

            db.Post.create(results)
                .then(dbPost => {
                    console.log(dbPost);
                })   // View the added result in the console
                .catch(err => {
                    console.log(err);
                });
            // If an error occurred, log it

        });
        res.send("Scrape Complete")

    });
});


// Route for getting all Craigslist posts from the db
app.get("/posts", function (req, res) {
    // Grab every document in the posts collection
    db.Post.find({})
        .then(function (dbPost) {
            // If we were able to successfully find video game Posts, send them back to the client
            res.json(dbPost);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.get("/savedPosts", function (req, res) {
    db.Post.find({ saved: true })
        .then(function (savedResults) {
            res.json(savedResults);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/posts/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Post.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        .then(function (dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
app.post("/posts/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});


app.post("/saved/:id", function (req, res) {
    db.Post.update({ _id: req.params.id }, { $set: { saved: true } })
        .then(function (data) {
            res.json(data);
        });
});
app.post("/deleted/:id", function (req, res) {
    db.Post.update({ _id: req.params.id }, { $set: { saved: false } })
        .then(function (data) {
            res.json(data);
        });
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
