import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import GamerProfile from "../models/GamerProfile.js";
import Lobby from "../models/Lobby.js";
import Request from "../models/Request.js";
import Review from "../models/Review.js";
import Report from "../models/Report.js";
import Session from "../models/Session.js";

dotenv.config();
await connectDB();

await Promise.all([
  User.deleteMany({}),
  GamerProfile.deleteMany({}),
  Lobby.deleteMany({}),
  Request.deleteMany({}),
  Review.deleteMany({}),
  Report.deleteMany({}),
  Session.deleteMany({})
]);

console.log("ClutchQ database cleared");
process.exit(0);
