# dockman

This is just an experiment, an implementation of a web UI using the docker CLI: `UI => API => Docker CLI => Docker API`  
It works, but it is neither maintainable nor very reliable, so do not use it in a production env.  

A more solid approach would skip the CLI and use the API directly:  
[Docker API](https://docs.docker.com/engine/api/v1.41/)  
[Docker API Example](https://docs.docker.com/engine/api/sdk/examples/)  
[NodeJs unix socket example](https://stackoverflow.com/questions/41177350/node-js-send-get-request-via-unix-socket)  

If you need a "prod ready" app for this, there are plenty (some open source) solutions out there, just search for "docker web UI" or similar.

## Prerequisites

* [Docker Engine for Linux / Docker Desktop with WSL integration](https://docs.docker.com/engine/install/ubuntu/)
* [Node.js LTS](https://nodejs.org/en/) [*only for development*]

## Build

```sh
./run.sh build
```

## Scan for vulnerabilities

```sh
./run.sh scan
```

## Run

**Security warning**: Docker daemon has root access, so do NOT expose this outside `127.0.0.1` !!!
**Info** generate self-signed certs with `openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -out cert.pem -keyout key.pem`  
**Info** running containers without certs will have an "unhealthy" status  

* local folders

```sh
# first console
npm --prefix client start
# second console
export CERTS_DIR="/optional/certs/dir" # optional
export DEBUG="*" # optional
npm --prefix server start
```

=> [http://localhost:55557/](http://localhost:55557/)

* local image

```sh
(docker stop dockman-local && docker rm dockman-local || echo "not running") && \
docker run --name dockman-local --rm \
    -v "/var/run/docker.sock:/var/run/docker.sock" \
    -v "/var/lib/docker/volumes:/var/lib/docker/volumes" \
    -v "/optional/certs/dir:/certs" \
    -p "127.0.0.1:55556:55557" \
    vallyian/dockman:local
```

=> [http://localhost:55556/](http://localhost:55556/)

* public image

```sh
(docker stop dockman && docker rm dockman || echo "not running") && \
docker run --name dockman --pull always --restart=always -d \
    -v "/var/run/docker.sock:/var/run/docker.sock" \
    -v "/var/lib/docker/volumes:/var/lib/docker/volumes" \
    -v "/optional/certs/dir:/certs" \
    -p "127.0.0.1:55555:55557" \
    vallyian/dockman:latest
```

=> [http://localhost:55555/](http://localhost:55555/)

## Volumes in WSL

If running Docker Desktop with WSL integration, app won't be able to access volumes (except names)
Could still make Docker volume dir accessible in current WSL distro

```sh
mkdir -p /var/lib/docker/volumes
mount -t drvfs '\\wsl$\docker-desktop-data\version-pack-data\community\docker\volumes' /var/lib/docker/volumes
```
