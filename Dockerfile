FROM node:16-alpine AS builder
WORKDIR /opt/app

COPY package*.json ./
COPY tsconfig.json ./
COPY ./prisma ./prisma

RUN npm install

# Copy source code and compile TypeScript files to JavaScript
COPY ./src ./src
RUN npm run build

FROM node:16-alpine
WORKDIR /opt/app

COPY --from=builder /opt/app/dist ./dist
COPY ./prisma ./prisma
COPY package*.json ./

RUN npm install --omit=dev
CMD ["npm", "run", "start:prod"]
