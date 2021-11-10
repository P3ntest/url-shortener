require("dotenv").config();
const express = require("express");
const request = require("request");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { cleanUrl } = require("./cleanUrl");

const app = express();

mongoose.connect(process.env.MONGO);

const UrlShortening = mongoose.model("url", {
  originalUrl: String,
  shortUrl: String,
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));

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
    res.status(409).send({
      status: 409,
      message: "Invalid Captcha",
      error_code: 1,
    });
    return;
  }

  let { url, short } = req.body;

  const cleanedUrl = cleanUrl(url);

  if (!cleanedUrl) {
    res.status(400).send({
      error: "Invalid URL",
      status: 400,
      error_code: 2,
    });
    return;
  }

  const existingUrl = await UrlShortening.findOne({
    originalUrl: cleanedUrl,
  }).exec();

  //Start of the if statements

  if (existingUrl && !short) {
    //if short is not provided and url already exists use existing

    res.status(200).send({
      status: 200,
      short: existingUrl.shortUrl,
    });
    return;
  }

  //We know we have to generate a new short url

  if (!short) {
    //Make sure we have a short
    // If user did not provide short url generate one
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    short = "";
    for (let i = 0; i < 5; i++) {
      short += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  // Check if short exists ==> error
  const existingShort = await UrlShortening.findOne({
    shortUrl: short,
  }).exec();
  if (existingShort != null) {
    res.status(400).send({
      status: 400,
      message: "Short url already exists",
      error_code: 3,
    });
    return;
  }

  const newUrl = new UrlShortening({
    originalUrl: cleanedUrl,
    shortUrl: short,
  }).save();

  res.status(200).send({
    status: 200,
    short: short,
  });
});

app.get("/:url", (req, res) => {
  const short = req.params.url;
  UrlShortening.findOne({ shortUrl: short }, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      if (data) {
        res.redirect("http://" + data.originalUrl);
      } else {
        res.status(404).send({
          status: 404,
          message: "Short url not found",
          error_code: 4,
        });
      }
    }
  });
});

app.get("/view/:url", (req, res) => {
  const short = req.params.url;
  UrlShortening.findOne({ shortUrl: short }, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      if (data) {
        res.send(data.originalUrl);
      } else {
        res.status(404).send({
          status: 404,
          message: "Short url not found",
          error_code: 4,
        });
      }
    }
  });
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

app.listen(process.env.PORT ?? 8000);
