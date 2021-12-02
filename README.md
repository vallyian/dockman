# dockman

This is just an experiment, an implementation of a web UI using the docker CLI: `UI => API => Docker CLI => Docker API`  
It works, but it is neither maintainable nor very reliable, so do not use it in a production env.  

A more solid approach would skip the CLI and use the API directly:  
[Docker API](https://docs.docker.com/engine/api/v1.41/)  
[Docker API Example](https://docs.docker.com/engine/api/sdk/examples/)  
[NodeJs unix socket example](https://stackoverflow.com/questions/41177350/node-js-send-get-request-via-unix-socket)  

If you need a "real" app for this, there are plenty (some open source) solutions out there, just search for "docker web UI" or similar.

## Prerequisites

* [Docker](https://docs.docker.com/get-docker/)
* [Node.js v14 LTS](https://nodejs.org/en/) - only for development

## Build

```sh
docker buildx build -t vallyian/dockman:local .
```

## Run

**Security warning**: Docker daemon has root access, so do NOT expose this outside `127.0.0.1` !!!

* local folders
  * `cd ./server && ([ -d node_modules ] || npm i) && npm start`
  * `cd ./client && ([ -d node_modules ] || npm i) && npm start`

* local image

```sh
(docker stop dockman-local && docker rm dockman-local || echo "not running") && \
docker run --name dockman-local --rm \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /var/lib/docker/volumes:/var/lib/docker/volumes \
    -p 127.0.0.1:5556:80 \
    vallyian/dockman:local
```

* public image

```sh
(docker stop dockman && docker rm dockman || echo "not running") && \
docker run --name dockman --pull always --restart=always -d \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /var/lib/docker/volumes:/var/lib/docker/volumes \
    -p 127.0.0.1:5555:80 \
    vallyian/dockman:latest
```

[http://localhost:5555/](http://localhost:5555/)
