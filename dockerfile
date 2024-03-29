FROM node:gallium as base
RUN curl https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -o /chrome.deb \
    && apt-get update \
    && dpkg -i /chrome.deb \
    || apt-get install --no-install-recommends -yf \
    && rm /chrome.deb \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g npm@8



FROM base as build-client
WORKDIR /app
COPY client/package*.json ./
ARG NPM_AUDIT_LEVEL
RUN [ "${NPM_AUDIT_LEVEL}" != "" ] || NPM_AUDIT_LEVEL="low"; \
    echo "NPM_AUDIT_LEVEL: \"${NPM_AUDIT_LEVEL}\""; \
    npm audit --omit=dev --audit-level="${NPM_AUDIT_LEVEL}" && \
    npm ci
COPY shared /shared
COPY client/src ./src
COPY client/.browserslistrc client/.eslintrc.json client/angular.json client/tsconfig.app.json client/tsconfig.json ./
RUN npm run lint
ARG SEMVER
RUN [ "${SEMVER}" != "" ] || SEMVER="0.0.0"; \
    echo "SEMVER: \"${SEMVER}\""; \
    npm run build
COPY client/karma.conf.js client/tsconfig.spec.json ./
RUN npm test



FROM base AS build-server
WORKDIR /app
COPY server/package*.json ./
ARG NPM_AUDIT_LEVEL
RUN [ "${NPM_AUDIT_LEVEL}" != "" ] || NPM_AUDIT_LEVEL="low"; \
    echo "NPM_AUDIT_LEVEL: \"${NPM_AUDIT_LEVEL}\""; \
    npm audit --omit=dev --audit-level="${NPM_AUDIT_LEVEL}" && \
    npm ci
COPY shared /shared
COPY server/src ./src
COPY server/.eslintrc.json server/globals.ts server/tsconfig.json ./
RUN npm run lint
ARG SEMVER
RUN [ "${SEMVER}" != "" ] || SEMVER="0.0.0"; \
    echo "SEMVER: \"${SEMVER}\""; \
    npm run build
COPY server/test.ts .
RUN npm test



FROM scratch as export
COPY --from=build-server /app/bin /runtime
COPY --from=build-client /app/dist /runtime/client
COPY --from=build-server /app/test-results /test-results
COPY --from=build-client /app/test-results /test-results



FROM docker:23.0.0-alpine3.17 AS runtime
RUN rm -rf /usr/libexec/docker/cli-plugins/docker-compose /usr/libexec/docker/cli-plugins/docker-buildx && \
    apk add nodejs-lts npm
WORKDIR /app
COPY artifacts/runtime .
ARG SEMVER
ENV SEMVER=${SEMVER}
# VOLUME [ "/var/run/docker.sock", "/var/lib/docker/volumes", "/run/secrets/cert.crt", "/run/secrets/cert.key" ]
HEALTHCHECK --interval=30s --timeout=1s --start-period=5s --retries=1 \
    CMD if [ -f "/run/secrets/cert.crt" ] && [ -f "/run/secrets/cert.key" ]; then \
    if [ ! "$(wget --no-check-certificate --server-response https://localhost:55557/health 2>&1 | awk '/^  HTTP/{print $2}')" = "200" ]; then exit 1; fi \
    else \
    if [ ! "$(wget --server-response http://localhost:55557/health 2>&1 | awk '/^  HTTP/{print $2}')" = "200" ]; then exit 1; fi \
    fi
EXPOSE "55557/tcp"
ENTRYPOINT [ "node" ]
CMD [ "index.cjs" ]
