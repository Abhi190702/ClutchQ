import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getJwtSecret } from "../utils/validateEnv.js";

export const protect = async (req, res, next) => {
  let token;

  const header = req.headers.authorization || "";
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    token = header.slice(7).trim();
  }

  const safeMethod = ["GET", "HEAD", "OPTIONS"].includes(req.method);
  if (!token && safeMethod && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401);
    return next(new Error("Please log in to continue."));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: "clutchq-api",
      audience: "clutchq-client"
    });
  } catch (error) {
    res.status(401);
    return next(error);
  }

  if (!decoded?.id) {
    res.status(401);
    return next(new Error("Session expired. Please log in again."));
  }

  try {
    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user) {
      res.status(401);
      return next(new Error("Not authorized, user not found"));
    }

    if (user.isSuspended) {
      res.status(403);
      return next(new Error("This account is suspended"));
    }

    if ((Number(decoded.version) || 0) !== (Number(user.tokenVersion) || 0)) {
      res.status(401);
      return next(new Error("Session expired. Please log in again."));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
