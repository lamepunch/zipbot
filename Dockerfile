FROM node:16-alpine AS builder
WORKDIR /opt/app

COPY package*.json ./
COPY tsconfig.json ./
COPY ./prisma ./prisma

RUN npm install
RUN npm run prisma:generate

# Copy source code and compile TypeScript files to JavaScript
COPY ./src ./src
RUN npm run build

FROM node:16-alpine
WORKDIR /opt/app

COPY --from=builder /opt/app/dist ./dist
COPY package*.json ./

RUN npm install --omit=dev
CMD ["npm", "run", "start:prod"]
