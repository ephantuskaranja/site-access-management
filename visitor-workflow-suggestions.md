// Enhanced Visitor Workflow Suggestions

// 1. EMAIL/SMS NOTIFICATIONS
// When visitor is registered without auto-approval:

async function sendApprovalNotifications(visitor: Visitor) {
  // Notify the host employee
  await emailService.sendEmail({
    to: `${visitor.hostEmployee}@company.com`,
    subject: `Visitor Approval Required: ${visitor.fullName}`,
    template: 'visitor-approval-request',
    data: {
      visitorName: visitor.fullName,
      company: visitor.company,
      purpose: visitor.visitPurpose,
      expectedDate: visitor.expectedDate,
      expectedTime: visitor.expectedTime,
      approvalLink: `${config.frontendUrl}/visitors/${visitor.id}/approve`
    }
  });

  // Notify security team
  await emailService.sendEmail({
    to: 'security@company.com',
    subject: `Pending Visitor Approval: ${visitor.fullName}`,
    template: 'security-visitor-notification',
    data: { visitor }
  });

  // SMS notification to host (optional)
  if (visitor.hostEmployeePhone) {
    await smsService.send({
      to: visitor.hostEmployeePhone,
      message: `Visitor ${visitor.fullName} awaiting your approval. Visit ${config.frontendUrl}/visitors to approve.`
    });
  }
}

// 2. REAL-TIME DASHBOARD ALERTS
// Show pending approvals prominently

// 3. MOBILE APP PUSH NOTIFICATIONS
// For host employees to approve on-the-go