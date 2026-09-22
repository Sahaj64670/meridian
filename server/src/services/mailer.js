import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/**
 * Order-confirmation emails.
 *
 * Render's FREE tier blocks outbound SMTP ports (25/465/587), so Gmail SMTP
 * can never work there. Production therefore sends through Brevo's HTTPS
 * API (port 443 — never blocked): set BREVO_KEY (free plan, 300 mails/day)
 * and keep MAIL_USER as the verified sender address.
 *
 * Local development without BREVO_KEY falls back to Gmail SMTP when
 * MAIL_USER + MAIL_PASS (app password) are set; otherwise emails are just
 * logged to the console and the order flow is unaffected.
 */
let transporter = null;
if (env.mailUser && env.mailPass) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env.mailUser, pass: env.mailPass },
  });
}

export const mailEnabled = () => !!transporter;

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const row = (label, value) => `
  <tr>
    <td style="padding:6px 0;color:#878787;font-size:13px">${label}</td>
    <td style="padding:6px 0;color:#212121;font-size:13px;font-weight:600;text-align:right">${value}</td>
  </tr>`;

export async function sendOrderConfirmation(order, user) {
  const p = order.pricing || {};
  const itemsHtml = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f1f3f6;font-size:13px;color:#212121">
          ${i.name} <span style="color:#878787">× ${i.qty}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #f1f3f6;font-size:13px;color:#212121;text-align:right;font-weight:600">
          ${inr(i.price * i.qty)}
        </td>
      </tr>`
    )
    .join('');

  const payLine =
    order.paymentMethod === 'upi'
      ? `UPI transfer (UTR: ${order.paymentRef || '—'}) — we confirm the credit and then ship`
      : 'Cash on Delivery — keep the exact amount ready';

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f1f3f6;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
      <div style="background:#2874f0;padding:20px 28px">
        <div style="color:#ffffff;font-size:20px;font-weight:bold">Meridian<span style="color:#ff9f00">.</span></div>
        <div style="color:#d9e8ff;font-size:13px;margin-top:4px">Order confirmation</div>
      </div>
      <div style="padding:24px 28px">
        <p style="margin:0 0 4px;font-size:15px;color:#212121">Hi ${user.name?.split(' ')[0] || 'there'},</p>
        <p style="margin:0 0 18px;font-size:13px;color:#4a5560;line-height:1.6">
          Thanks for shopping with Meridian! Your order
          <strong style="color:#2874f0">${order.orderNumber}</strong> has been placed successfully.
        </p>
        <table style="width:100%;border-collapse:collapse">${itemsHtml}</table>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          ${row('Subtotal', inr(p.subtotal))}
          ${p.discount ? row('Discount', `− ${inr(p.discount)}`) : ''}
          ${row('Shipping', p.shippingFee ? inr(p.shippingFee) : 'FREE')}
          <tr>
            <td style="padding:10px 0 0;color:#212121;font-size:15px;font-weight:bold">Total</td>
            <td style="padding:10px 0 0;color:#fb641b;font-size:16px;font-weight:bold;text-align:right">${inr(p.total)}</td>
          </tr>
        </table>
        <div style="margin-top:18px;background:#f1f3f6;border-radius:8px;padding:14px 16px;font-size:13px;color:#4a5560;line-height:1.7">
          <strong style="color:#212121">Payment:</strong> ${payLine}<br/>
          <strong style="color:#212121">Deliver to:</strong> ${order.shippingAddress.fullName},
          ${order.shippingAddress.line1}${order.shippingAddress.line2 ? ', ' + order.shippingAddress.line2 : ''},
          ${order.shippingAddress.city}, ${order.shippingAddress.state} — ${order.shippingAddress.pincode}
        </div>
        <p style="margin:18px 0 0;font-size:12px;color:#878787;line-height:1.6">
          You can track this order anytime from your Meridian account (Orders section).
          This mailbox is unattended — for help, reply from your registered email.
        </p>
      </div>
      <div style="background:#14294f;padding:14px 28px;font-size:11px;color:#bcd7ff">
        Meridian · demo storefront · sent to ${user.email}
      </div>
    </div>
  </div>`;

  const envelope = {
    from: `"Meridian Store" <${env.mailUser || 'no-reply@meridian.store'}>`,
    to: user.email,
    subject: `Order ${order.orderNumber} confirmed — ${inr(p.total)} · Meridian`,
    html,
  };

  if (env.brevoKey) {
    // HTTPS transport — works on Render's free tier (SMTP ports are blocked).
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.brevoKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Meridian Store', email: env.mailUser || 'no-reply@meridian.store' },
        to: [{ email: user.email, name: user.name || '' }],
        subject: envelope.subject,
        htmlContent: envelope.html,
      }),
    });
    if (!res.ok) {
      throw new Error(`Brevo HTTP ${res.status} — ${(await res.text()).slice(0, 200)}`);
    }
    console.log(`[mailer] order confirmation sent to ${user.email} via Brevo (${order.orderNumber})`);
    return { sent: true };
  }

  if (transporter) {
    const info = await transporter.sendMail(envelope);
    console.log(`[mailer] order confirmation sent to ${user.email}: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  }

  console.log(`[mailer] not configured — skipping email to ${user.email} (${order.orderNumber})`);
  return { sent: false };
}
