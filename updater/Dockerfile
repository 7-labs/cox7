FROM node:22-alpine

WORKDIR /app

COPY updater/package.json updater/tsconfig.json ./updater/
RUN cd updater && npm install

COPY lib ./lib
COPY updater/src ./updater/src

WORKDIR /app/updater
CMD ["npx", "tsx", "--tsconfig", "tsconfig.json", "src/main.ts"]
