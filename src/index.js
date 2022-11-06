require("dotenv").config();
const express = require("express");
const request = require("request");
const ejs = require("ejs");
const { cleanUrl } = require("./cleanUrl");
const path = require("path");
const { createClient } = require("redis");

const redis = createClient({
  url: process.env.REDIS,
});

redis.on("error", (err) => console.log("Redis Client Error", err));

redis.connect().then(() => console.log("Redis, connected"));

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "../public")));

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
  const existing = await redis.get("short:" + short);

  if (existing != null) {
    res.status(400).send({
      status: 400,
      message: "Short url already exists",
      error_code: 3,
    });
    return;
  }

  await redis.set("short:" + short, cleanedUrl);

  res.status(200).send({
    status: 200,
    short: short,
  });
});

app.get("/:url", async (req, res) => {
  const short = req.params.url;
  const url = await redis.get("short:" + short);
  if (url) res.redirect("https://" + url);
  else
    res.status(404).send({
      status: 404,
      message: "Short url not found",
      error_code: 4,
    });
});

app.get("/api/:url", async (req, res) => {
  const short = req.params.url;
  const url = await redis.get("short:" + short);
  if (url) res.send(JSON.stringify(url));
  else res.status(404).send(JSON.stringify(null));
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

app.listen(process.env.PORT ?? 8000, () => {
  console.log("listening");
});
