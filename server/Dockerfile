FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm config set registry https://mirror-npm.runflare.com && npm config set strict-ssl false && npm install --omit=dev --no-audit --no-fund
COPY src ./src
COPY seed ./seed
ENV NODE_ENV=production DATA_FILE=/data/roadmap.json PORT=8080
EXPOSE 8080
CMD ["node", "src/index.js"]
