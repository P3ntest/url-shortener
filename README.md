# Url Shortener 🦫

Selfhosted Url Shortener: [Live example](u.p3ntest.dev)

Build with express and mongoDb

## Hosting
The project is dockerized. User `docker build . -t p3ntest/url` to build the image.

## Environment Variables

Name | Default Value | Description
 --- | :---: | ---
MONGO | - | Url of the MongoDB to connect to
GOOGLE_KEY | - | Google ReCaptcha Site Key
GOOGLE_SECRET | - | Google ReCaptcha Site Secret
PORT | `8000` | Port of the express server

## Developing

Please fork and clone the repository to start editing.

Url Shortener is a npm project.

1. Install with npm `npm install`
2. Start a development server with `npm run start:dev`
