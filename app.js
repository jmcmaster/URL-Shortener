require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const Hashids = require("hashids");
const bodyParser = require("body-parser");
const { URL, Counter } = require("./schemas");

// Connect Database
const { DB_USER, DB_PASS, DB_HOST, PORT } = process.env;
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
const port = PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Define Routes
app.get("/", function(req, res) {
  res.sendFile("views/index.html", {
    root: __dirname
  });
});

app.get("/:hash", (req, res) => {
  const baseid = req.params.hash;

  const hashids = new Hashids();
  const id = hashids.decode(baseid);

  URL.findOne({ _id: id }, function(err, doc) {
    if (doc) {
      res.redirect(doc.url);
    } else {
      console.log("entry not found");
      res.redirect("/");
    }
  });
});

app.post("/shorten", (req, res) => {
  const urlData = req.body.url;

  if (!urlData) {
    res.send("Error: Request requires a URL");
    return;
  }

  URL.findOne({ url: urlData }, function(err, doc) {
    const hashids = new Hashids();
    if (doc) {
      console.log("entry found in db!");
      res.send({
        url: urlData,
        hash: hashids.encode(doc._id),
        status: 200,
        statusTxt: "OK"
      });
    } else {
      console.log("entry not found");
      const url = new URL({ url: urlData });
      url.save(function(err) {
        if (err) {
          console.error(err);
        }
        res.send({
          url: urlData,
          hash: hashids.encode(url._id),
          status: 200,
          statusTxt: "OK"
        });
      });
    }
  });
});

// Start listeneing for requests
app.listen(port, () => console.log(`Listening on port ${port}!`));
