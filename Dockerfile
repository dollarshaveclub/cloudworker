FROM node:12

WORKDIR /usr/src/app
COPY . .

RUN npm install
RUN npm install -g

ENTRYPOINT [ "cloudworker" ]