/**
 * DEPRECATED: This service is deprecated in favor of emailService.js
 * All functionality has been unified to avoid configuration redundancy.
 */

const { sendEmail } = require('./emailService');

async function sendNotificationEmail(to, subject, message) {
  console.warn('[DEPRECATED] sendNotificationEmail called. Please use emailService.sendEmail instead.');
  return sendEmail(to, subject, `<div>${message}</div>`, message);
}

module.exports = { sendNotificationEmail };
