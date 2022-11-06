FROM node:19-alpine3.15

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

EXPOSE 8000

CMD [ "node", "." ]