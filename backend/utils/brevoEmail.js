const sendOTPEmail = async (email, otp) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || "no-reply@leavemanagement.com";

    const emailData = {
        subject: "Verification Code - Leave Management System",
        htmlContent: `
            <html>
                <body>
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background: #f9f9f9;">
                        <h2 style="color: #4a90e2; text-align: center;">Leave Management System</h2>
                        <h3 style="color: #333;">Verification Code</h3>
                        <p>Hello,</p>
                        <p>Your verification code for registration is:</p>
                        <div style="font-size: 32px; font-weight: bold; color: #4a90e2; letter-spacing: 5px; margin: 30px 0; text-align: center; background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd;">${otp}</div>
                        <p>This code is valid for 5 minutes. Please do not share this code with anyone.</p>
                        <p style="margin-top: 30px; font-size: 0.9rem; color: #777;">Best regards,<br>The LMS Administration Team</p>
                    </div>
                </body>
            </html>
        `,
        sender: { name: "Leave Management System", email: senderEmail },
        to: [{ email: email }]
    };

    try {
        if (!apiKey) {
            console.error('BREVO_API_KEY is missing in .env file');
            throw new Error('Email configuration error: API Key missing');
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Brevo API Error Details:', JSON.stringify(data, null, 2));
            throw new Error(data.message || 'Failed to send email via Brevo');
        }

        console.log('OTP Email sent successfully via Brevo:', data);
        return data;
    } catch (error) {
        console.error('CRITICAL: Error while sending email via Brevo:', error.message);
        throw error;
    }
};

module.exports = { sendOTPEmail };
