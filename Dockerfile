FROM node:10.16.0
RUN npm cache clean --force
RUN npm set registry https://registry.npm.taobao.org
RUN npm install -g pm2
COPY package.json /app/
WORKDIR /app
RUN npm install
COPY . /app

CMD [ "npm", "run", "deploy" ]

