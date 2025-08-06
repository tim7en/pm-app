import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private isConfigured: boolean | null = null // null = not yet initialized

  // Helper function to safely get environment variables
  private getEnvVar(key: string, defaultValue: string = ''): string {
    try {
      // Check if we're on the client side or if process.env is not available
      if (typeof window !== 'undefined' || typeof process === 'undefined' || !process.env) {
        return defaultValue
      }
      return process.env[key] || defaultValue
    } catch (error) {
      console.warn(`Failed to access environment variable ${key}:`, error)
      return defaultValue
    }
  }

  constructor() {
    // Don't initialize transporter in constructor to avoid build-time issues
  }

  private ensureInitialized() {
    if (this.isConfigured === null) {
      this.setupTransporter()
    }
  }

  private setupTransporter() {
    try {
      // Check if we're on the client side or if process.env is not available
      if (typeof window !== 'undefined' || typeof process === 'undefined' || !process.env) {
        console.warn('⚠️ Environment variables not available. Email service disabled.')
        this.isConfigured = false
        return
      }

      // For development, we'll use a simple configuration
      // In production, you should use environment variables
      const config: EmailConfig = {
        host: this.getEnvVar('SMTP_HOST', 'smtp.gmail.com'),
        port: parseInt(this.getEnvVar('SMTP_PORT', '587')),
        secure: this.getEnvVar('SMTP_SECURE') === 'true',
        auth: {
          user: this.getEnvVar('SMTP_USER'),
          pass: this.getEnvVar('SMTP_PASS')
        }
      }

      // If no SMTP configuration is provided, use a test account for development
      if (!config.auth.user || !config.auth.pass) {
        console.warn('⚠️ No SMTP configuration found. Using test mode for email service.')
        this.isConfigured = false
        return
      }

      this.transporter = nodemailer.createTransport(config)
      this.isConfigured = true
    } catch (error) {
      console.error('Failed to setup email transporter:', error)
      this.isConfigured = false
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string, userName?: string): Promise<boolean> {
    try {
      this.ensureInitialized()
      
      if (!this.isConfigured || !this.transporter) {
        console.log('📧 Email service not configured. Would send password reset email to:', to)
        console.log('Reset token:', resetToken)
        return true // Return true for development
      }

      const resetUrl = `${this.getEnvVar('NEXTAUTH_URL', 'http://localhost:3000')}/auth/reset-password?token=${resetToken}`
      
      const mailOptions = {
        from: this.getEnvVar('SMTP_FROM') || this.getEnvVar('SMTP_USER'),
        to,
        subject: 'Password Reset Request - Project Manager',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Request</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #3b82f6;
                margin-bottom: 10px;
              }
              .button {
                display: inline-block;
                background-color: #3b82f6;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                margin: 20px 0;
              }
              .warning {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Project Manager</div>
                <h1>Password Reset Request</h1>
              </div>
              
              <p>Hello${userName ? ` ${userName}` : ''},</p>
              
              <p>We received a request to reset your password for your Project Manager account. If you made this request, click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Your Password</a>
              </div>
              
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This link will expire in 1 hour for security reasons</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>This email was sent from Project Manager. If you have any questions, please contact our support team.</p>
                <p>&copy; ${new Date().getFullYear()} Project Manager. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      }

      await this.transporter.sendMail(mailOptions)
      console.log('✅ Password reset email sent successfully to:', to)
      return true
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error)
      return false
    }
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    try {
      this.ensureInitialized()
      
      if (!this.isConfigured || !this.transporter) {
        console.log('📧 Email service not configured. Would send welcome email to:', to)
        return true
      }

      const mailOptions = {
        from: this.getEnvVar('SMTP_FROM') || this.getEnvVar('SMTP_USER'),
        to,
        subject: 'Welcome to Project Manager!',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Project Manager</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #3b82f6;
                margin-bottom: 10px;
              }
              .button {
                display: inline-block;
                background-color: #3b82f6;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                margin: 20px 0;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Project Manager</div>
                <h1>Welcome to Project Manager!</h1>
              </div>
              
              <p>Hello ${userName},</p>
              
              <p>Welcome to Project Manager! We're excited to have you on board. Your account has been successfully created and you're ready to start managing your projects effectively.</p>
              
              <p>Here's what you can do next:</p>
              <ul>
                <li>Create your first workspace</li>
                <li>Invite team members to collaborate</li>
                <li>Set up your first project</li>
                <li>Start organizing tasks and workflows</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${this.getEnvVar('NEXTAUTH_URL', 'http://localhost:3000')}" class="button">Get Started</a>
              </div>
              
              <div class="footer">
                <p>Need help? Check out our documentation or contact our support team.</p>
                <p>&copy; ${new Date().getFullYear()} Project Manager. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      }

      await this.transporter.sendMail(mailOptions)
      console.log('✅ Welcome email sent successfully to:', to)
      return true
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error)
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      this.ensureInitialized()
      
      if (!this.isConfigured || !this.transporter) {
        console.log('📧 Email service not configured for testing')
        return false
      }

      await this.transporter.verify()
      console.log('✅ Email service connection verified')
      return true
    } catch (error) {
      console.error('❌ Email service connection failed:', error)
      return false
    }
  }
}

// Export a function that lazily creates the email service instance
let emailServiceInstance: EmailService | null = null

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService()
  }
  return emailServiceInstance
}

// For backward compatibility, export the service as a getter
export const emailService = {
  get instance() {
    return getEmailService()
  },
  sendPasswordResetEmail: (to: string, resetToken: string, userName?: string) => {
    return getEmailService().sendPasswordResetEmail(to, resetToken, userName)
  },
  sendWelcomeEmail: (to: string, userName: string) => {
    return getEmailService().sendWelcomeEmail(to, userName)
  },
  testConnection: () => {
    return getEmailService().testConnection()
  }
}
