FROM node:16

WORKDIR /opt/app

COPY prisma ./prisma/
COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build
RUN npm run prisma:generate

CMD ["npm", "run", "start:prod"]
