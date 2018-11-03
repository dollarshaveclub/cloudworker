FROM node:11-alpine 

WORKDIR /usr/src/app
COPY . .

RUN npm install -g

ENTRYPOINT [ "cloudworker" ]