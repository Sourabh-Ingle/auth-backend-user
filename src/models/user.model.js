import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import brcypt from "brcypt";
import crypto from "node:crypto";

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
            type: String,
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
userSchema.pre("save", async function (next) {
    if (!this.isModified) return next();

    this.password = await brcypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await brcypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
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
        { expiresIn: process.env.REFRESH_TOKEN_EXPITY }
    )
};

userSchema.methods.generateTemporaryToken = function () {
    const unhashedToken = crypto.randomBytes(20).toString().digest("hex");
    const hashToken = crypto
        .createHash("sha256")
        .update(unhashedToken)
        .digest("hex");
    
    const tokenExpiry = Date.now() + (20 * 60 * 1000);
    return { unhashedToken, hashToken, tokenExpiry }

}


export const User = mongoose.model("User", userSchema);