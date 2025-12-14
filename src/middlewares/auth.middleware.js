import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/app-error.js";
import { asyncHandle } from "../utils/async-handler.js";

export const verifyJWT = asyncHandle(async(req,res,next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized request!!!");
    };

    try {
        const decodedToken = jwt.verify(token, peocess.env.ACCESS_TOKEN_SECRET);
        const user = await User
            .findById(decodedToken?._id)
            .select("-password -refreshToken -emailVerificationExpiry -emailVerificationToken"
        );

        if (!user) {
            throw new ApiError(401, "Your token is not valid!!!");
        }
        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, "Your token is not valid!!!");

    }
})