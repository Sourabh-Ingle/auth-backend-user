import Router from "express";
import { registerUser, loginUser, logoutUser, verifyEmail, refreshAccessToken, forgotPasswordRequest, getCurrentUser, changeCurrentPassword, resentEmailVerification } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userRegisterValidator, userLogginValidator, userForgotPasswordValidator, userResetForgotPasswordValidator, userChangeCurrentPasswordValidator } from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

// unsecure routed
router.route("/register").post(userRegisterValidator(),validate,registerUser);
router.route("/login").post(userLogginValidator(), validate, loginUser);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router.route("/reset-password/:resetToken").post(userResetForgotPasswordValidator(), validate, resetForgotPassword);


// secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router
    .route("/change-password")
    .post(
        verifyJWT,
        userChangeCurrentPasswordValidator(),
        validate,
        changeCurrentPassword
);
router.route("/resend-email-verification").post(verifyJWT,resentEmailVerification)


export default router;