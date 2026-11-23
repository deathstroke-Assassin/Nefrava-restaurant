const mailService = require('../services/mailService');

async function submit(req, res) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !message || message.length > 1500) {
    return res.status(400).json({ message: 'Enter your name, a valid email address, and a message up to 1500 characters.' });
  }

  // Mailpit captures this development address locally; production deployments
  // must set CONTACT_EMAIL to a real, monitored inbox.
  const recipient = process.env.CONTACT_EMAIL || (process.env.NODE_ENV === 'production' ? '' : 'nefrava@localhost.test');
  if (!recipient) return res.status(503).json({ message: 'Contact messages are not configured yet.' });
  try {
    await mailService.send({
      to: recipient,
      subject: 'NEFRAVA website inquiry',
      text: `From: ${name}\nReply-to: ${email}\n\n${message}`
    });
    return res.status(202).json({ message: 'Message received.' });
  } catch (error) {
    console.error('Failed to deliver contact message:', error.message);
    return res.status(503).json({ message: 'We could not send your message. Please try again later.' });
  }
}

module.exports = { submit };
