import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";

const register = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;
  if ([userName, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(401, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    throw new ApiError(403, "User name and email already taken");
  }

  const user = await User.create({
    userName,
    email,
    password,
  });
  const createdUser = await User.findById(user._id).select("-password");
  res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User register Successfully"));
});

const login = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;
  const identifier = userName || email;
  
  if (!identifier || !password) {
    throw new ApiError(400, "Username/Email and password are required");
  }
  
  const existedUser = await User.findOne({
    $or: [{ userName: identifier }, { email: identifier }],
  });
  
  if (!existedUser) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordValid = await existedUser.isPasswordCorrect(password);
  
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const token = existedUser.generateToken();
  const loggedInUser = await User.findById(existedUser._id).select("-password");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("token", token, options)
    .json(new ApiResponse(200, loggedInUser, "User loggedIn Successfully"));
});

export {register, login}