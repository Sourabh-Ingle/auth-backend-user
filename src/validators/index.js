import { body } from "express-validator";

export const userRegisterValidator = () => {
    return (
        body("email")
            .trim()
            .notEmpty().withMessage("Email is required!!!")
            .isEmail().withMessage("Email is not valide!!!"),
        body("username")
            .trim()
            .notEmpty().withMessage("username is required!!!")
            .isLowercase().withMessage("username must be in lowercase!!!")
            .isLength({ min: 3 }).withMessage("username must have atleaset 3 char!!!"),
        body("password")
            .trim()
            .notEmpty()
            .withMessage('Password is required')
            .isString()
            .withMessage('Password must be a string')
            .isLength({ min: 8, max: 64 })
            .withMessage('Password must be between 8 and 64 characters')
            .matches(/[a-z]/)
            .withMessage('Password must contain at least one lowercase letter')
            .matches(/[A-Z]/)
            .withMessage('Password must contain at least one uppercase letter')
            .matches(/[0-9]/)
            .withMessage('Password must contain at least one number')
            .matches(/[!@#$%^&*(),.?":{}|<>]/)
            .withMessage('Password must contain at least one special character'),
        body("fullName")
            .optional()
            .trim()
            .isString()
    )
    
};

export const userLogginValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Email is not valid'),

        body("password")
            .trim()
            .notEmpty()
            .withMessage('Password is required')
        ] 
}