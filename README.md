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

`node run build`

## Scan for vulnerabilities

`node run scan`

## Run

**Security warning**: Docker daemon has root access, so do NOT expose this outside `127.0.0.1` !!!
**Info** generate self-signed certs with `openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -out cert.crt -keyout cert.key`  

* local folders

```sh
export CERT_CRT="/run/secrets/cert.crt" # optional
export CERT_KEY="/run/secrets/cert.key" # optional
export DEBUG="*" # optional
```

`node run start`

=> [http://localhost:55557/](http://localhost:55557/)

* local image

`node run start_docker`

=> [http://localhost:55556/](http://localhost:55556/)

* public image

`docker stop dockman && docker rm dockman || echo "not running"`

```sh
docker run --name dockman --pull always --restart=always -d \
    -v "/var/run/docker.sock:/var/run/docker.sock" \
    -v "/var/lib/docker/volumes:/var/lib/docker/volumes" \
    -v "${HOME}/certs/cert.crt:/run/secrets/cert.crt" `# optional` \
    -v "${HOME}/certs/cert.key:/run/secrets/cert.key" `# optional` \
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
