import jwt from "jsonwebtoken";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "dev_secret_replace_me", {
    expiresIn: "30d"
  });

export default generateToken;
