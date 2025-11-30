// import nodemailer from 'nodemailer';


// import {Resend} from 'resend'

// const resend = new Resend(process.env.RESEND_API_KEY)

// export const sendOTPEmail = async(email,otp) =>{
//   try{
//     const {data,error} = await resend.emails.send({
//       from: 'Acme <onboarding@resend.dev>',
//       to: email,
//       subject: 'Your Email Verification Code',
//       html: `
//         <h2>Verify Your Email</h2>
//         <p>Your OTP is: <strong>${otp}</strong></p>
//         <p>This code expires in 10 minutes.</p>
//       `,
//     })
//   }
//   catch(error){
//     console.log(error);
//   }
  
// }

// 




// emailService.js

// 1. This import method is correct because the library is a CommonJS module.
import pkg from '@getbrevo/brevo';

// 2. We get the necessary classes from the 'pkg' object.
const { TransactionalEmailsApi, SendSmtpEmail } = pkg;

export const sendOTPEmail = async (email, otp) => {
  try {
    // 3. Instantiate the API as shown in the docs.
    const emailAPI = new TransactionalEmailsApi();

    // 4. Authenticate DIRECTLY on the instance. This is the main fix.
    // The key is on `emailAPI.authentications.apiKey`, not `['api-key']`.
    emailAPI.authentications.apiKey.apiKey = process.env.BREVO_API_KEY;

    // 5. Build the message object.
    const message = new SendSmtpEmail();
    message.subject = "Your Email Verification Code";
    message.htmlContent = `
      <h2>Verify Your Email</h2>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This code expires in 10 minutes.</p>
    `;
    message.sender = {
      name: "Chatty",
      email: process.env.SENDER_EMAIL, // This MUST be a verified sender
    };
    message.to = [{ email: email }];

    // 6. Send the email and handle any errors.
    await emailAPI.sendTransacEmail(message);
    console.log("Email sent successfully via Brevo API!");

  } catch (error) {
    console.error("Failed to send email via Brevo API:", error.response ? error.response.body : error.message);
    throw new Error("Email could not be sent.");
  }
};