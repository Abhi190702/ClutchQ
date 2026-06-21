import jwt from "jsonwebtoken";
import { getJwtSecret } from "./validateEnv.js";

const generateToken = (id) =>
  jwt.sign({ id }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });

export default generateToken;
