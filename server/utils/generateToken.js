import jwt from "jsonwebtoken";
import { getJwtSecret } from "./validateEnv.js";

const generateToken = (id, tokenVersion = 0) =>
  jwt.sign({ id, version: Number(tokenVersion) || 0 }, getJwtSecret(), {
    algorithm: "HS256",
    issuer: "clutchq-api",
    audience: "clutchq-client",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });

export default generateToken;
