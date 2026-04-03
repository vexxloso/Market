import { createServer } from "node:http";
import { parse } from "node:url";
import { loadEnvConfig } from "@next/env";
import { Server } from "socket.io";
import { jwtVerify } from "jose";

/** Load `.env` / `.env.local` before `next()` so `next.config.ts` sees `NEXT_PUBLIC_BASE_PATH` (fixes 500s on `/_next` behind a subpath). */
const dev = process.env.NODE_ENV !== "production";
loadEnvConfig(process.cwd(), dev);

const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const next = (await import("next")).default;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function getJwtSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? "dev-insecure-jwt-secret-change-me",
  );
}

await app.prepare();

const httpServer = createServer((req, res) => {
  try {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  } catch (err) {
    console.error("Error handling request", req.url, err);
    res.statusCode = 500;
    res.end("Internal server error");
  }
});

const io = new Server(httpServer, {
  path: "/socket.io",
  cors: {
    origin: dev ? true : true,
    credentials: true,
  },
});

globalThis.__STAYLY_IO__ = io;

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== "string") {
      return next(new Error("Unauthorized"));
    }
    const { payload } = await jwtVerify(token, getJwtSecret());
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") {
      return next(new Error("Unauthorized"));
    }
    socket.data.userId = sub;
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const uid = socket.data.userId;
  if (uid) socket.join(`user:${uid}`);
});

httpServer
  .once("error", (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port} (socket.io)`);
  });
