FROM node:lts as build-client
RUN apt update && \
    apt install -y apt-utils libx11-xcb1 libxtst6 libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgtk-3-0 jq
WORKDIR /app
COPY ./package*.json ./
ARG NPM_AUDIT_LEVEL
RUN [ -z ${NPM_AUDIT_LEVEL} ] && NPM_AUDIT_LEVEL="low"; \
    echo "NPM_AUDIT_LEVEL: '${NPM_AUDIT_LEVEL}'"; \
    npm audit --production --audit-level="${NPM_AUDIT_LEVEL}" && \
    npm ci
COPY ./src/ ./src/
COPY ./.browserslistrc ./angular.json ./tsconfig.app.json ./tsconfig.json ./
ARG SEMVER
RUN [ -z ${SEMVER} ] && SEMVER="0.0.0"; \
    echo "SEMVER: '${SEMVER}'"; \
    npm run build
COPY ./karma.conf.js ./tsconfig.spec.json ./
RUN npm i puppeteer && \
    export CHROME_BIN=$(node -e "console.log(require('puppeteer').executablePath())") && \
    npm test



FROM node:lts-alpine3.14 AS build-server
WORKDIR /app
COPY ./package*.json ./
ARG NPM_AUDIT_LEVEL
RUN [ -z ${NPM_AUDIT_LEVEL} ] && NPM_AUDIT_LEVEL="low"; \
    echo "NPM_AUDIT_LEVEL: '${NPM_AUDIT_LEVEL}'"; \
    npm audit --production --audit-level="${NPM_AUDIT_LEVEL}" && \
    npm ci
COPY ./src/ ./src/
COPY ./tsconfig.app.json ./tsconfig.json ./
ARG SEMVER
RUN [ -z ${SEMVER} ] && SEMVER="0.0.0"; \
    echo "SEMVER: '${SEMVER}'"; \
    npm run build
COPY ./tsconfig.spec.json ./jasmine.ts ./
RUN npm run test



FROM node:lts-alpine3.14
RUN mkdir -p /app && chown node:node /app
USER node
WORKDIR /app
COPY --from=build-server --chown=node:node /app/bin/. ./
RUN npm i --production
HEALTHCHECK --interval=10s --timeout=1s --start-period=30s --retries=3 \
    CMD [ "curl", "localhost" ]
ENTRYPOINT [ "node", "." ]
