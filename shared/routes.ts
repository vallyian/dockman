export const routes = {
    health: "/api/health",
    docker: {
        base: "/api/docker",
        image: {
            ls: "/image/ls",
            // inspect: "/image/inspect/:item",
        },
        container: {
            ls: "/container/ls",
            // inspect: "/container/inspect/:item",
        },
        volume: {
            ls: "/volume/ls",
            // inspect: "/volume/inspect/:item",
        },
        network: {
            ls: "/network/ls",
            // inspect: "/network/inspect/:item",
        },
    },
}
