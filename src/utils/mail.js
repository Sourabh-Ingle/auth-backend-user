import Mailgen from "mailgen";
import nodemailer from "nodemailer";

export const sendEmail = async(options)=>{
    const mailGenerator=new Mailgen({
        theme: "default",
        product: {
            name: 'Mailgen',
            link: 'https://taskmanagelink.com/'
        }
    })
    const emailTexual = mailGenerator.generatePlaintext(options.mailgenContent);
    const emailHTML = mailGenerator.generate(options.mailgenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS
        }
    });

    const mail = {
        from: "mail.taskmanager@exapmle.com",
        to: options.email,
        subject: options.subject,
        text: emailTexual,
        html: emailHTML
    }

    try {
        await transporter.sendMail(mail)
    } catch (error) {
        console.error("Email service failed, Make sure you have provided your MAILTRAP credentials in .env file.");
        console.error("ERROR :", error);
    }

}



export const emailVerificationMailgenContent = (username,verificationURL) => {
    return ({
        body: {
            name: username,
            intro: "Welcome to our App. We are exited to have you on board!!!",
            action: {
                instructions: "To started withn this app!! please click on this button :",
                button: {
                    color: '#22BC66',
                    text: "Verify your email",
                    link: verificationURL
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'

        }
    })
}


export const forgotPasswordMailgenContent = (username, passwordResetURL) => {
    return ({
        body: {
            name: username,
            intro: "We get request to reset the password of your account",
            action: {
                instructions: "To Reset your password click on following button below : ",
                button: {
                    color: '#22BC66',
                    text: "Reset password",
                    link: passwordResetURL
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'

        }
    })
}