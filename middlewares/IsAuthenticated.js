const jwt = require("jsonwebtoken");
require("dotenv").config();
const IsAuthenticated = (req, res, next) => {
  try {
    const user = jwt.verify(req.headers.authorization, process.env.SECRET_KEY);
    req.user = user;
  } catch (error) {
    return res.send({ status: "FAIL", message: "Please login first" });
  }
  next();
};
module.exports = IsAuthenticated;
