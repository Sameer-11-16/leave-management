const leaveAppliedAdmin = ({ employeeName, leaveType, startDate, endDate, days, reason }) => `
<div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px;">
  <div style="background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
    <div style="background: #2563eb; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">📅 LeaveMS</h1>
      <p style="color: #bfdbfe; margin: 6px 0 0; font-size: 14px;">New Leave Request</p>
    </div>
    <div style="padding: 28px;">
      <p style="color: #475569; font-size: 15px;">A new leave request has been submitted.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f8fafc;"><td style="padding: 10px 14px; font-weight: 600; color: #374151; border-radius: 6px;">Employee</td><td style="padding: 10px 14px; color: #1e293b;">${employeeName}</td></tr>
        <tr><td style="padding: 10px 14px; font-weight: 600; color: #374151;">Leave Type</td><td style="padding: 10px 14px; color: #1e293b; text-transform: capitalize;">${leaveType}</td></tr>
        <tr style="background: #f8fafc;"><td style="padding: 10px 14px; font-weight: 600; color: #374151;">Duration</td><td style="padding: 10px 14px; color: #1e293b;">${new Date(startDate).toLocaleDateString()} → ${new Date(endDate).toLocaleDateString()} (${days} days)</td></tr>
        <tr><td style="padding: 10px 14px; font-weight: 600; color: #374151;">Reason</td><td style="padding: 10px 14px; color: #1e293b;">${reason}</td></tr>
      </table>
      <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">Please login to LeaveMS to approve or reject this request.</p>
    </div>
  </div>
</div>`;

const leaveStatusEmployee = ({ employeeName, leaveType, status, adminComment, startDate, endDate, days }) => `
<div style="font-family: DM Sans, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px;">
  <div style="background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
    <div style="background: ${status === 'approved' ? '#16a34a' : '#dc2626'}; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px;">📅 LeaveMS</h1>
      <p style="color: ${status === 'approved' ? '#bbf7d0' : '#fecaca'}; margin: 6px 0 0; font-size: 14px;">
        Leave ${status === 'approved' ? 'Approved ✓' : 'Rejected ✕'}
      </p>
    </div>
    <div style="padding: 28px;">
      <p style="color: #475569; font-size: 15px;">Hi <strong>${employeeName}</strong>, your leave request has been <strong>${status}</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f8fafc;"><td style="padding: 10px 14px; font-weight: 600; color: #374151;">Leave Type</td><td style="padding: 10px 14px; color: #1e293b; text-transform: capitalize;">${leaveType}</td></tr>
        <tr><td style="padding: 10px 14px; font-weight: 600; color: #374151;">Duration</td><td style="padding: 10px 14px; color: #1e293b;">${new Date(startDate).toLocaleDateString()} → ${new Date(endDate).toLocaleDateString()} (${days} days)</td></tr>
        <tr style="background: #f8fafc;"><td style="padding: 10px 14px; font-weight: 600; color: #374151;">Status</td><td style="padding: 10px 14px; color: ${status === 'approved' ? '#16a34a' : '#dc2626'}; font-weight: 600; text-transform: capitalize;">${status}</td></tr>
        ${adminComment ? `<tr><td style="padding: 10px 14px; font-weight: 600; color: #374151;">Admin Comment</td><td style="padding: 10px 14px; color: #1e293b;">${adminComment}</td></tr>` : ''}
      </table>
      <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">Login to LeaveMS to view your leave history.</p>
    </div>
  </div>
</div>`;

module.exports = { leaveAppliedAdmin, leaveStatusEmployee };