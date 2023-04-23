FROM node:16-alpine

WORKDIR /app

COPY . .

RUN apk add --update --no-cache openssl1.1-compat
RUN yarn install
RUN yarn generate
