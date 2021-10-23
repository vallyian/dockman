export const routes = {
    health: "/health",
    docker: {
        base: "/api/docker",
        image: {
            ls: "/image/ls",
            rm: "/image/rm/:id",
            // inspect: "/image/inspect/:id",
        },
        container: {
            ls: "/container/ls",
            rm: "/container/rm/:id",
            start: "/container/start/:id",
            stop: "/container/stop/:id",
            // inspect: "/container/inspect/:id",
        },
        volume: {
            ls: "/volume/ls",
            rm: "/volume/rm/:id",
            // inspect: "/volume/inspect/:id",
        },
        network: {
            ls: "/network/ls",
            rm: "/network/rm/:id",
            // inspect: "/network/inspect/:id",
        },
    },
}
