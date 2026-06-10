import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Sender address. Set EMAIL_FROM to your verified domain address, e.g.
// "Chrono <notifications@yourdomain.com>". Falls back to Resend's
// shared test sender, which can only deliver to your own verified email.
const FROM_ADDRESS = process.env.EMAIL_FROM || 'Chrono <onboarding@resend.dev>'

interface EmailAttachment {
  filename: string
  content: string
  contentType?: string
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

export async function sendEmail({ to, subject, html, attachments }: EmailOptions) {
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    })
    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

export function getBookingConfirmationEmail(
  clientName: string,
  meetingType: string,
  date: string,
  time: string,
  businessName?: string,
) {
  const fromLabel = businessName ?? 'Chrono'
  return {
    subject: `Booking Confirmed: ${meetingType} — ${fromLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Booking Confirmed</h2>
        <p>Hi ${clientName},</p>
        <p>Your meeting with <strong>${fromLabel}</strong> has been successfully scheduled.</p>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Business:</strong> ${fromLabel}</p>
          <p style="margin: 8px 0 0;"><strong>Meeting Type:</strong> ${meetingType}</p>
          <p style="margin: 8px 0 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 8px 0 0;"><strong>Time:</strong> ${time}</p>
        </div>
        <p>We look forward to meeting with you!</p>
      </div>
    `,
  }
}

export function getBookingCancellationEmail(
  clientName: string,
  meetingType: string,
  date: string,
  time: string,
  businessName?: string,
) {
  const fromLabel = businessName ?? 'Chrono'
  return {
    subject: `Booking Cancelled: ${meetingType} — ${fromLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Booking Cancelled</h2>
        <p>Hi ${clientName},</p>
        <p>Your meeting with <strong>${fromLabel}</strong> has been cancelled.</p>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Business:</strong> ${fromLabel}</p>
          <p style="margin: 8px 0 0;"><strong>Meeting Type:</strong> ${meetingType}</p>
          <p style="margin: 8px 0 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 8px 0 0;"><strong>Time:</strong> ${time}</p>
        </div>
        <p>If you&apos;d like to reschedule, please visit the booking page.</p>
      </div>
    `,
  }
}

export function getRescheduleEmail(
  clientName: string,
  meetingType: string,
  oldDate: string,
  oldTime: string,
  newDate: string,
  newTime: string,
  businessName?: string,
) {
  const fromLabel = businessName ?? 'Chrono'
  return {
    subject: `Meeting Rescheduled: ${meetingType} — ${fromLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Meeting Rescheduled</h2>
        <p>Hi ${clientName},</p>
        <p>Your meeting with <strong>${fromLabel}</strong> has been rescheduled.</p>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;"><strong>Previous Time:</strong></p>
          <p style="margin: 4px 0 0; text-decoration: line-through;">${oldDate} at ${oldTime}</p>
        </div>
        <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #166534;"><strong>New Time:</strong></p>
          <p style="margin: 4px 0 0;"><strong>Meeting Type:</strong> ${meetingType}</p>
          <p style="margin: 4px 0 0;"><strong>Date:</strong> ${newDate}</p>
          <p style="margin: 4px 0 0;"><strong>Time:</strong> ${newTime}</p>
        </div>
        <p>We look forward to meeting with you!</p>
      </div>
    `,
  }
}

export function getAdminNotificationEmail(
  adminName: string,
  clientName: string,
  clientEmail: string,
  meetingType: string,
  date: string,
  time: string,
  action: 'booked' | 'cancelled' | 'rescheduled',
  businessName?: string,
) {
  const fromLabel = businessName ?? 'Chrono'
  const actionText = action === 'booked' ? 'New Booking' : action === 'cancelled' ? 'Booking Cancelled' : 'Booking Rescheduled'
  const bgColor = action === 'booked' ? '#dcfce7' : action === 'cancelled' ? '#fee2e2' : '#fef9c3'
  
  return {
    subject: `${actionText}: ${meetingType} with ${clientName} — ${fromLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">${actionText}</h2>
        <p>Hi ${adminName},</p>
        <p>A client has ${action} a meeting for <strong>${fromLabel}</strong>.</p>
        <div style="background: ${bgColor}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Business:</strong> ${fromLabel}</p>
          <p style="margin: 8px 0 0;"><strong>Client:</strong> ${clientName} (${clientEmail})</p>
          <p style="margin: 8px 0 0;"><strong>Meeting Type:</strong> ${meetingType}</p>
          <p style="margin: 8px 0 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 8px 0 0;"><strong>Time:</strong> ${time}</p>
        </div>
      </div>
    `,
  }
}
