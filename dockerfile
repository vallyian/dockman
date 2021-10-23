FROM node:lts as build-client
RUN apt update && \
    apt install -y apt-utils libx11-xcb1 libxtst6 libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgtk-3-0 jq
WORKDIR /app
COPY ./client/package*.json ./
ARG NPM_AUDIT_LEVEL
RUN [ -z ${NPM_AUDIT_LEVEL} ] && NPM_AUDIT_LEVEL="low"; \
    echo "NPM_AUDIT_LEVEL: '${NPM_AUDIT_LEVEL}'"; \
    npm audit --production --audit-level="${NPM_AUDIT_LEVEL}" && \
    npm ci
COPY ./shared /shared
COPY ./client/src ./src
COPY ./client/.browserslistrc ./client/angular.json ./client/tsconfig.app.json ./client/tsconfig.json ./
ARG SEMVER
RUN [ -z ${SEMVER} ] && SEMVER="0.0.0"; \
    echo "SEMVER: '${SEMVER}'"; \
    npm run build
COPY ./client/karma.conf.js ./client/tsconfig.spec.json ./
# RUN npm i puppeteer && \
#     export CHROME_BIN=$(node -e "console.log(require('puppeteer').executablePath())") && \
#     npm test



FROM node:lts-alpine3.14 AS build-server
WORKDIR /app
COPY ./server/package*.json ./
ARG NPM_AUDIT_LEVEL
RUN [ -z ${NPM_AUDIT_LEVEL} ] && NPM_AUDIT_LEVEL="low"; \
    echo "NPM_AUDIT_LEVEL: '${NPM_AUDIT_LEVEL}'"; \
    npm audit --production --audit-level="${NPM_AUDIT_LEVEL}" && \
    npm ci
COPY ./shared /shared
COPY ./server/src ./src
COPY ./server/tsconfig.app.json ./server/tsconfig.json ./
ARG SEMVER
RUN [ -z ${SEMVER} ] && SEMVER="0.0.0"; \
    echo "SEMVER: '${SEMVER}'"; \
    npm run build; \
    mv package.json ./bin/app/package.json; \
    node -e "(path => {\
        const json = require(path);\
        require('fs').writeFileSync(\
            path,\
            JSON.stringify({ ...json, version: \"${SEMVER}\", devDependencies: undefined, scripts: undefined }, null, 2),\
            'utf-8'\
        );\
    })('./bin/app/package.json')"
# COPY ./server/tsconfig.spec.json ./server/jasmine.ts ./
# RUN npm run test



FROM docker
RUN apk add nodejs-lts npm
ARG SEMVER
WORKDIR /app
COPY --from=build-server /app/bin/app/package.json ./package.json
RUN npm i --production && \
    rm package-lock.json
COPY --from=build-server /app/bin/shared/ /shared/
COPY --from=build-server /app/bin/app/src/ ./
COPY --from=build-client /app/dist ./client
# HEALTHCHECK --interval=60s --timeout=1s --start-period=10s --retries=3 \
#     CMD [ $(wget --server-response http://localhost:5555/health 2>&1 | awk '/^  HTTP/{print $2}') = 200 ] || exit 1
VOLUME [ "/var/run/docker.sock" ]
ENV SEMVER=${SEMVER}
ENTRYPOINT [ "node" ]
CMD [ "." ]
