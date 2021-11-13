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

* local image

```sh
(docker stop dockman-local && docker rm dockman-local || echo "not running") && \
docker run --rm --name dockman-local -v /var/run/docker.sock:/var/run/docker.sock -p 127.0.0.1:5556:80 vallyian/dockman:local
```

* public image

```sh
(docker stop dockman && docker rm dockman || echo "not running") && \
docker run --name dockman -v /var/run/docker.sock:/var/run/docker.sock -p 127.0.0.1:5555:80 --pull always --restart=always -d vallyian/dockman:latest
```

[http://localhost:5555/](http://localhost:5555/)
