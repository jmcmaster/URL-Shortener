require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const { URL, Counter } = require("./schemas");

// Connect Database
const { DB_USER, DB_PASS, DB_HOST } = process.env;
const dbPromise = mongoose.connect(
  `mongodb://${DB_USER}:${DB_PASS}@${DB_HOST}`,
  { useNewUrlParser: true }
);

dbPromise.then(function(db) {
  console.log("Connected!");
  URL.deleteMany({}, function() {
    console.log("URL collection removed");
  });
  Counter.deleteMany({}, function() {
    console.log("Counter collection removed");
    const counter = new Counter({ _id: "url_count", count: 10000 });
    counter.save(function(err) {
      if (err) {
        return console.error(err);
      }
      console.log("counter inserted");
    });
  });
});

dbPromise.catch(function(err) {
  console.log(err);
});

// Create Server
const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Define Routes
app.get("/", function(req, res) {
  res.sendFile("views/index.html", {
    root: __dirname
  });
});

app.post("/shorten", (req, res) => {
  if (!req.body.url) {
    res.send("Error: Request requires a URL");
    return;
  }

  const record = new URL({ url: req.body.url });
  record.save().then(() => console.log("Saved!"));
  res.send(record);
});

app.get("/:id", (req, res) => {
  const record = URL.findById(req.param("id"), (err, url) => {
    if (err) {
      res.send(err.message);
      return;
    }
    res.send(url.url);
  });
});

// Start listeneing for requests
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
