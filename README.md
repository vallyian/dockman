# dockman

This is a naive proof-of-concept implementation of a web UI using the docker CLI.  
Do NOT expose this outside `127.0.0.1` !!!

## Prerequisites

* [Docker](https://docs.docker.com/get-docker/)
* [Node.js v14 LTS](https://nodejs.org/en/) - only for development

## Build

* `docker build -t vallyian/dockman:latest .`

## Run

```sh
(docker stop dockman && docker rm dockman || echo "not running") && \
docker run --name dockman -v /var/run/docker.sock:/var/run/docker.sock -p 127.0.0.1:65535:80 --pull always --restart=always -d vallyian/dockman:latest
```

[http://localhost:65535/](http://localhost:65535/)
