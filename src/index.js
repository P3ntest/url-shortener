require("dotenv").config();
const express = require("express");
const request = require("request");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

mongoose.connect(process.env.MONGO);

const UrlShortening = mongoose.model("url", {
  originalUrl: String,
  shortUrl: String,
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  ejs.renderFile(
    "./src/index.html",
    { captcha_key: process.env.GOOGLE_KEY },
    (err, data) => {
      if (err) {
        console.log(err);
      } else {
        res.send(data);
      }
    }
  );
});

app.post("/url", async (req, res) => {
  const captcha = await verifyCaptcha(req);
  if (!captcha) {
    res.status(409).send("Captcha failed");
    return;
  }

  let { url, short } = req.body;

  if (!short) {
    //generate random 5 character string
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    short = "";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
});

app.get("/a", (req, res) => {
  res.redirect("google.com");
});

async function verifyCaptcha(req) {
  return new Promise((resolve, reject) => {
    if (
      req.body["g-recaptcha-response"] === undefined ||
      req.body["g-recaptcha-response"] === "" ||
      req.body["g-recaptcha-response"] === null
    ) {
      resolve(false);
    }

    var verificationUrl =
      "https://www.google.com/recaptcha/api/siteverify?secret=" +
      process.env.GOOGLE_SECRET +
      "&response=" +
      req.body["g-recaptcha-response"] +
      "&remoteip=" +
      req.connection.remoteAddress;
    request(verificationUrl, function (error, response, body) {
      body = JSON.parse(body);
      // Success will be true or false depending upon captcha validation.
      if (body.success !== undefined && !body.success) {
        resolve(false);
      }
      resolve(true);
    });
  });
}

app.listen(3000);
