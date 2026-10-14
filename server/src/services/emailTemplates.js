const shell = (title, body) => `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#1e293b">
    <h2 style="color:#1d35d8;margin-bottom:4px">${title}</h2>
    <div style="font-size:14px;line-height:1.6">${body}</div>
    <p style="margin-top:28px;font-size:12px;color:#64748b">
      Online College Admission Management System — this is an automated message.
    </p>
  </div>`;

export const otpEmail = ({ name, code, minutes }) => ({
  subject: 'Your admission portal verification code',
  html: shell(
    'Verify your email',
    `<p>Hello ${name},</p>
     <p>Your one-time verification code is:</p>
     <p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
     <p>The code expires in ${minutes} minutes.</p>`,
  ),
});

export const notificationEmail = ({ name, title, body, link }) => ({
  subject: title,
  html: shell(
    title,
    `<p>Hello ${name},</p><p>${body}</p>${
      link ? `<p><a href="${link}" style="color:#1d35d8">Open the portal</a></p>` : ''
    }`,
  ),
});

export const welcomeOfficerEmail = ({ name, email, password }) => ({
  subject: 'Your verification officer account',
  html: shell(
    'Account created',
    `<p>Hello ${name},</p>
     <p>An administrator created a verification officer account for you.</p>
     <p>Email: <b>${email}</b><br/>Temporary password: <b>${password}</b></p>
     <p>Please sign in and change it.</p>`,
  ),
});
