import http from "node:http";

export const HttpKeepAliveAgent = new http.Agent({ keepAlive: true });
