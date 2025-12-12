import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/app-response.js";
import { ApiError } from "../utils/app-error.js"
import { asyncHandle } from "../utils/async-handler.js";
import { emailVerificationMailgenContent, sendEmail } from "../utils/mail.js";



export const registerUser = asyncHandle(async(req , res) => {
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
    user.emailVerificationExpity = tokenExpiry;
    user.save({ validateBeforeSave: false });

    await sendEmail(
        {
            email: user?.email,
            subject: "Please verify your mail",
            mailgenContent: emailVerificationMailgenContent(
                user.username,
                `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`
            ) 
        }
    )

    const createdUser = await User.findOne({
        id: user_id
    });

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