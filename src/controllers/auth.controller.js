import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/app-response.js";
import { ApiError } from "../utils/app-error.js"
import { asyncHandle } from "../utils/async-handler.js";
import { emailVerificationMailgenContent, sendEmail } from "../utils/mail.js";

export const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token")
    }
}

export const registerUser = asyncHandle(async(req , res,next) => {
    const { email, username, password, role } = req.body;
    const existedUser = await User.findOne({
        $or: [{ username, email }]
    });

    if (existedUser) {
        throw new ApiError(409,"User with Email or Username already exist!!!")
    };

    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified: false
    });
    
    const { unhashedToken, hashToken, tokenExpiry } = user.generateTemporaryToken();
    
    user.emailVerificationToken = hashToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    // await sendEmail(
    //     {
    //         email: user?.email,
    //         subject: "Please verify your mail",
    //         mailgenContent: emailVerificationMailgenContent(
    //             user.username,
    //             `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`
    //         ) 
    //     }
    // )

    // const createdUser = await User.findOne({
    //     _id: user._id
    // });
    const createdUser = await User
        .findById(user._id)
        .select("-password -refreshToken -emailVerificationExpiry -emailVerificationToken"
        );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user!!!");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                { user: createdUser },
                "User registerd successfully and verification mail is send on your email id"
            )
        )
})

export const login = asyncHandle(async (req, res, next) => {
    const { password, email } = req.body;

    if (!email) {
        throw new ApiError(400, " Email is required!!!");
    }

    const user = await User.findOne({ email });
    
    if (!user) {
        throw new ApiError(400, "Invalid email!!!");
    };

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid Credentials!!!");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User
        .findById(user._id)
        .select("-password -refreshToken -emailVerificationExpiry -emailVerificationToken"
    );
    
    const options = {
        httpOnly: true,
        secure:true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                user: loggedInUser,
                accessToken,
                refreshToken
                },
                "User loggedIn successfully!!!"
            )
        )
})