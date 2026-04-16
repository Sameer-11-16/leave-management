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

    return sendBrevoRequest(emailData);
};

const sendLeaveRequestEmail = async (adminEmail, leaveData) => {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || "no-reply@leavemanagement.com";
    const { employeeName, leaveType, startDate, endDate, reason } = leaveData;

    const emailData = {
        subject: `New Leave Request: ${employeeName}`,
        htmlContent: `
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
                        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #4a90e2;">
                            <h2 style="color: #1a73e8; margin: 0;">New Leave Application</h2>
                        </div>
                        <div style="padding: 20px;">
                            <p><strong>Employee:</strong> ${employeeName}</p>
                            <p><strong>Type:</strong> ${leaveType.toUpperCase()}</p>
                            <p><strong>Period:</strong> ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}</p>
                            <p><strong>Reason:</strong> ${reason}</p>
                            <div style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; margin-top: 20px; text-align: center;">
                                <p style="margin-bottom: 15px;">Please review this request in the Admin Panel.</p>
                            </div>
                        </div>
                        <p style="font-size: 12px; color: #777; text-align: center;">Leave Management System &copy; 2026</p>
                    </div>
                </body>
            </html>
        `,
        sender: { name: "LMS Admin", email: senderEmail },
        to: [{ email: adminEmail }]
    };

    return sendBrevoRequest(emailData);
};

const sendLeaveStatusEmail = async (employeeEmail, statusData) => {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || "no-reply@leavemanagement.com";
    const { status, leaveType, startDate, adminComment } = statusData;
    const isApproved = status === 'approved';

    const emailData = {
        subject: `Leave Request ${isApproved ? 'Approved' : 'Rejected'}`,
        htmlContent: `
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
                        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid ${isApproved ? '#10b981' : '#ef4444'};">
                            <h2 style="color: ${isApproved ? '#059669' : '#dc2626'}; margin: 0;">Leave Request Update</h2>
                        </div>
                        <div style="padding: 20px;">
                            <p>Hello,</p>
                            <p>Your <strong>${leaveType}</strong> leave request starting on <strong>${new Date(startDate).toLocaleDateString()}</strong> has been <strong>${status}</strong>.</p>
                            ${adminComment ? `<p><strong>Admin Comment:</strong> ${adminComment}</p>` : ''}
                            <div style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; margin-top: 20px; text-align: center;">
                                <p style="margin: 0; font-weight: 600; color: #1a73e8;">Check your dashboard for details.</p>
                            </div>
                        </div>
                        <p style="font-size: 12px; color: #777; text-align: center;">Leave Management System &copy; 2026</p>
                    </div>
                </body>
            </html>
        `,
        sender: { name: "LMS Payroll", email: senderEmail },
        to: [{ email: employeeEmail }]
    };

    return sendBrevoRequest(emailData);
};

const sendHolidayEmail = async (emails, holidayData) => {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || "no-reply@leavemanagement.com";
    const { name, date } = holidayData;

    const emailData = {
        subject: `Company Holiday Announcement: ${name}`,
        htmlContent: `
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
                        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f59e0b;">
                            <h2 style="color: #d97706; margin: 0;">🏖️ Company Holiday Announcement</h2>
                        </div>
                        <div style="padding: 20px;">
                            <p>Great news! A new <strong>Company Holiday</strong> has been added to the calendar:</p>
                            <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0; text-align: center;">
                                <h3 style="margin: 0; color: #92400e;">${name}</h3>
                                <p style="margin: 5px 0 0 0; font-weight: 600;">Date: ${new Date(date).toLocaleDateString()}</p>
                            </div>
                            <p>The system has been updated, and this date will now be reflected in your company leave calendar.</p>
                        </div>
                        <p style="font-size: 12px; color: #777; text-align: center;">Leave Management System &copy; 2026</p>
                    </div>
                </body>
            </html>
        `,
        sender: { name: "LMS Company Holidays", email: senderEmail },
        to: emails.map(email => ({ email }))
    };

    return sendBrevoRequest(emailData);
};

const sendBrevoRequest = async (emailData) => {
    const apiKey = process.env.BREVO_API_KEY;
    try {
        if (!apiKey) throw new Error('BREVO_API_KEY missing');
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
        if (!response.ok) throw new Error(data.message || 'Brevo Error');
        return data;
    } catch (error) {
        console.error('Brevo Error:', error.message);
        // We don't throw so the main flow doesn't crash if email fails
    }
};

module.exports = { sendOTPEmail, sendLeaveRequestEmail, sendLeaveStatusEmail, sendHolidayEmail };
