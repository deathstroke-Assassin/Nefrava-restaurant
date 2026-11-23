const test = require('node:test');
const assert = require('node:assert/strict');
const mailService = require('../services/mailService');
const contactController = require('../controllers/contactControllerApi');

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('contact form rejects invalid email without sending mail', async t => {
  const originalSend = mailService.send;
  let sent = false;
  mailService.send = async () => { sent = true; };
  t.after(() => { mailService.send = originalSend; });

  const res = response();
  await contactController.submit({ body: { name: 'Guest', email: 'bad-email', message: 'Hello' } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(sent, false);
});

test('contact form sends valid inquiries to the configured Mailpit inbox', async t => {
  const originalSend = mailService.send;
  const oldRecipient = process.env.CONTACT_EMAIL;
  process.env.CONTACT_EMAIL = 'nefrava@localhost.test';
  let captured;
  mailService.send = async data => { captured = data; return { messageId: 'local-test' }; };
  t.after(() => {
    mailService.send = originalSend;
    if (oldRecipient === undefined) delete process.env.CONTACT_EMAIL;
    else process.env.CONTACT_EMAIL = oldRecipient;
  });

  const res = response();
  await contactController.submit({ body: { name: 'Guest', email: 'guest@example.test', message: 'Could I book a table?' } }, res);

  assert.equal(res.statusCode, 202);
  assert.equal(captured.to, 'nefrava@localhost.test');
  assert.match(captured.text, /guest@example\.test/);
});
