FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm config set registry https://mirror-npm.runflare.com && npm config set strict-ssl false && npm install --omit=dev --no-audit --no-fund
COPY src ./src
COPY seed ./seed
# The operator scripts run with `docker compose exec api node scripts/<name>.mjs`, so they
# have to be in the image too — finding the group's chat id and previewing an announcement
# both happen on the server, where the only way in is through this container.
COPY scripts ./scripts
ENV NODE_ENV=production DATA_FILE=/data/roadmap.json PORT=8080
EXPOSE 8080
CMD ["node", "src/index.js"]
