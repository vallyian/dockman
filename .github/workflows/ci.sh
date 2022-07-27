#!/bin/sh -e

github_env() {
    echo "::set-output name=GITHUB_MAIN::${GITHUB_MAIN}"
}

calc_semver() {
    if [ "${GITHUB_MAIN}" = "true" ]; then
        echo "SEMVER: ${SEMVER}"
        echo "::set-output name=SEMVER::${SEMVER}"
    else
        echo "SEMVER: ${SEMVER}-${GITHUB_SHA}"
        echo "::set-output name=SEMVER::${SEMVER}-${GITHUB_SHA}"
    fi
}

build() {
    docker buildx build \
        --pull \
        --target export \
        -o artifacts . \
    || exit 1
}

scan() {
    docker buildx build \
        -t ${{secrets.DOCKER_USERNAME}}/${DOCKER_REPO}:${SEMVER} \
        -t ${{secrets.DOCKER_USERNAME}}/${DOCKER_REPO}:latest \
        --build-arg SEMVER \
        --platform linux/amd64,linux/arm64/v8 \
        --output type=tar,dest=${DOCKER_REPO}-${SEMVER}.tar \
        --pull \
        . \
    || exit 1

    docker load -i ${DOCKER_REPO}-${SEMVER}.tar \
    || exit 1

    rm -rf ${DOCKER_REPO}-${SEMVER}.tar

    docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        aquasec/trivy \
            image \
                --exit-code=1 \
                ${{secrets.DOCKER_USERNAME}}/${DOCKER_REPO}:${SEMVER} \
    || exit 1
}

push() {
    docker buildx build \
        -t ${{secrets.DOCKER_USERNAME}}/${DOCKER_REPO}:${SEMVER} \
        -t ${{secrets.DOCKER_USERNAME}}/${DOCKER_REPO}:latest \
        --build-arg SEMVER \
        --platform linux/amd64,linux/arm64/v8 \
        --push \
        . \
    || exit 1
}

case "${1}" in
    "github_env"  ) github_env  ;;
    "calc_semver" ) calc_semver ;;
    "build"       ) build       ;;
    "scan"        ) scan        ;;
    "push"        ) push        ;;

    *) exit 1
esac
