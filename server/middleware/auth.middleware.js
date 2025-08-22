import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      throw new ApiError(401, "Not authorized, no token");
    }

    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);

    const user = await User.findById(decoded?._id).select("-password");
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Not authorized, invalid token");
  }
};
