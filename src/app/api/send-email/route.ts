import nodemailer from 'nodemailer'
import { NextRequest, NextResponse } from 'next/server'

// Create reusable transporter with Hostinger SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.HOSTINGER_SMTP_HOST,
    port: parseInt(process.env.HOSTINGER_SMTP_PORT || '587'),
    secure: process.env.HOSTINGER_SMTP_SECURE === 'true', // false for 587, true for 465
    auth: {
      user: process.env.HOSTINGER_EMAIL,
      pass: process.env.HOSTINGER_PASSWORD,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { emails, subject, template } = await request.json()

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'No emails provided' },
        { status: 400 }
      )
    }

    if (!subject || !template) {
      return NextResponse.json(
        { error: 'Subject and template are required' },
        { status: 400 }
      )
    }

    const transporter = createTransporter()

    // Send emails to each recipient
    const results = []
    for (const email of emails) {
      try {
        const info = await transporter.sendMail({
          from: process.env.HOSTINGER_EMAIL,
          to: email,
          subject: subject,
          html: template,
        })
        results.push({ email, status: 'sent', messageId: info.messageId })
      } catch (error) {
        results.push({ email, status: 'failed', error: String(error) })
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length
    const failedCount = results.filter(r => r.status === 'failed').length

    return NextResponse.json({
      success: true,
      message: `Emails sent: ${successCount} successful, ${failedCount} failed`,
      details: results,
    })
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Failed to send emails: ' + String(error) },
      { status: 500 }
    )
  }
}
