import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/app-response.js";
import { ApiError } from "../utils/app-error.js"
import { asyncHandle } from "../utils/async-handler.js";
import jwt from "jsonwebtoken";
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

export const loginUser = asyncHandle(async (req, res, next) => {
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

export const logoutUser = asyncHandle(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:
                { refreshToken: "" }
        },
        {
            new: true
        }
    );
    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options).
        json(new ApiResponse(200,{},"Youser logged Out successfully!!!"))

})

export const getCurrentUser = asyncHandle(async (req, res) => {
    return res.
        status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Current user fetch successfully!!!"
            )
        )
});

export const verifyEmail = asyncHandle(async (req, res) => {
    const { verificationToken } = req.params;
    if (!verificationToken) {
        throw new ApiError(400, "Email verification token is missing!!!");
    };
    let hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");
    
    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() }
    })
    if (!user) {
        throw new ApiError(400, "Email verification token is Invalid or expires!!!");
    };

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isEmailVerified: true,
                },
                "Email is verified"
            )
        )
});

export const resentEmailVerification = asyncHandle(async (req, res) => {
    const user = await User.findById(req.user?._id);
    
    if (!user) {
        throw new ApiError(404, "User does not exist!!! ");
    }

    if (user.isEmailVerified === true) {
        throw new ApiError(409, "User email already verified!!! ");
    };

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
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Mail has been resend successfully!!!"
            )
        )

});

export const refreshAccessToken = asyncHandle(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized access");
    };

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(400, "Invalid refresh token!!!");
        };

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(400, "Refresh token is expired!!!");
        };

        const options = {
            thhpOnly: true,
            secure: true
        };

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user?._id);

        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access Token refresh!!!"
                )
            ) 
    } catch (error) {
        console.log("inValid Refresh Token :: Error : ",error)
        throw new ApiError(400, "Invalid refresh token!!!");
    }
});

export const forgotPasswordRequest = asyncHandle(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Required Email!!!");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User does not exist!!!");
    }

    const { unhashedToken, hashToken, tokenExpiry } = user.generateTemporaryToken();
    user.forgotPasswordToken = hashToken;
    user.forgotPasswordExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });
    
    // await sendEmail({
    //     email: user?.email,
    //     subject: "Paasword reset request",
    //     mailgenContent: forgotPasswordMailgenContent(
    //         user.username,
    //         `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unhashedToken}`
    //     )
    // });
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset mail has been send on your mail id."
            )
        )
});

export const resetForgotPassword = asyncHandle(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    const hashedToken = await crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    
    const user = await User.findOne(
        {
            forgotPasswordToken: hashedToken,
            forgotPasswordExpiry: { $gt: Date.now() }
        }
    );

    if (!user) {
        throw new ApiError(489, "Token is invalid or expired")
    };

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset successfully!!!"
            )

        )
    
    
});

export const changeCurrentPassword = asyncHandle(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordvalid = await user.isPasswordCorrect(oldPassword);
    
    if (!isPasswordvalid) {
        throw new ApiError(400, "Invalid old password!!!");
    };

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully!!!"
            )
        )
});