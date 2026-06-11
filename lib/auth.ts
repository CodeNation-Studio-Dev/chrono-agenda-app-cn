import { betterAuth } from 'better-auth'
import { emailVerification } from 'better-auth/plugins/email-verification'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false, // Don't auto sign in until verified
    requireEmailVerification: true, // Require verification before login
    sendResetPassword: async ({ user, url }) => {
      if (!user.email) return

      await sendEmail({
        to: user.email,
        subject: 'Reset your Chrono password',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Reset your password</h2>
            <p>Hi ${user.name},</p>
            <p>We received a request to reset your password.</p>
            <p>
              <a href="${url}" style="display:inline-block;background:#111827;color:#ffffff;padding:10px 16px;border-radius:8px;text-decoration:none;">
                Reset password
              </a>
            </p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      })
    },
  },
  plugins: [
    emailVerification({
      async sendVerificationEmail({ user, url }) {
        if (!user.email) return

        await sendEmail({
          to: user.email,
          subject: 'Verify your Chrono email',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Verify your email</h2>
              <p>Hi ${user.name},</p>
              <p>Please verify your email to access Chrono.</p>
              <p>
                <a href="${url}" style="display:inline-block;background:#111827;color:#ffffff;padding:10px 16px;border-radius:8px;text-decoration:none;">
                  Verify email
                </a>
              </p>
              <p>If you didn't create this account, you can safely ignore this email.</p>
            </div>
          `,
        })
      },
    }),
  ],
  user: {
    additionalFields: {
      phone: {
        type: 'string',
        required: false,
        input: true,
      },
    },
  },
  trustedOrigins: [
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
