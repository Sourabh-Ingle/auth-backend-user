import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { ApiError } from "../utils/app-error.js";


const userSchema = new Schema(
    {
        avatar: {
            type: {
                url: String,
                localpath:String
            },
            default: {
                url: "https://placehold.co/200x200",
                localpath: ""
            }
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index:true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase:true
        },
        fullName: {
            type: String,
            trim:true 
        },
        password: {
            type: String,
            required:[true,"password field is required"]
        },
        isEmailVerified: {
            type: Boolean,
            default:false
        },
        refreshToken: {
            type: String
        },
        forgotPasswordToken: {
            type: String
        },
        forgotPasswordExpiry: {
            type:Date
        },
        emailVerificationToken: {
            type:String
        },
        emailVerificationExpiry: {
            type:Date
        }
    }, {
        timestamps:true
    }
);


// TIHS IS HOOK IN MONGOOSE THERE ARE POST HOOK AS WELL WITH MANY OPTIONS LIKE "SAVE","FIND"

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
    
});
    


userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    console.log("ACCESS_TOKEN_SECRET:", process.env.ACCESS_TOKEN_SECRET);
    console.log("ACCESS_TOKEN_EXPIRY:", process.env.ACCESS_TOKEN_EXPIRY);
    console.log("USER ID:", this._id);
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
};

userSchema.methods.generateTemporaryToken = function () {
    const unhashedToken = crypto.randomBytes(20).toString("hex");
    const hashToken = crypto
        .createHash("sha256")
        .update(unhashedToken)
        .digest("hex");
    
    const tokenExpiry = Date.now() + (20 * 60 * 1000);
    return { unhashedToken, hashToken, tokenExpiry };

}


export const User = mongoose.model("User", userSchema);