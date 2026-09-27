import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminAuth } from '@/lib/firebase-admin';

const CUSTOM_ACTION_URL = `${
  process.env.NEXT_PUBLIC_SITE_URL || 'https://4ustream.vercel.app'
}/auth-action`;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const authorization = request.headers.get('authorization') || '';
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(token);

    if (
      !email ||
      typeof email !== 'string' ||
      !decoded.email ||
      decoded.email.toLowerCase() !== email.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { error: 'Authenticated email is required.' },
        { status: 400 }
      );
    }

    /*
     * Generate Firebase verification action link.
     *
     * We use handleCodeInApp: false because this is a web-only flow.
     * Firebase generates the real action code and API key for us.
     */
    const firebaseLink =
      await adminAuth.generateEmailVerificationLink(email.trim(), {
        url: CUSTOM_ACTION_URL,
        handleCodeInApp: false,
      });

    const generatedUrl = new URL(firebaseLink);

    const mode =
      generatedUrl.searchParams.get('mode') || 'verifyEmail';

    const oobCode =
      generatedUrl.searchParams.get('oobCode');

    const apiKey =
      generatedUrl.searchParams.get('apiKey');

    const continueUrl =
      generatedUrl.searchParams.get('continueUrl');

    const lang =
      generatedUrl.searchParams.get('lang');

    if (!oobCode || !apiKey) {
      console.error(
        'Firebase verification link is incomplete:',
        {
          hasOobCode: Boolean(oobCode),
          hasApiKey: Boolean(apiKey),
          mode,
        }
      );

      return NextResponse.json(
        {
          error:
            'Firebase could not create a complete verification link.',
        },
        { status: 500 }
      );
    }

    /*
     * Rebuild the custom 4uStream verification URL
     * while preserving all Firebase action parameters.
     */
    const verificationLink = new URL(CUSTOM_ACTION_URL);

    verificationLink.searchParams.set('mode', mode);
    verificationLink.searchParams.set('oobCode', oobCode);
    verificationLink.searchParams.set('apiKey', apiKey);

    if (continueUrl) {
      verificationLink.searchParams.set(
        'continueUrl',
        continueUrl
      );
    }

    if (lang) {
      verificationLink.searchParams.set('lang', lang);
    }

    /*
     * SMTP configuration
     */
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.error(
        'SMTP_USER or SMTP_PASS is missing.'
      );

      return NextResponse.json(
        {
          error:
            'Email service is not configured correctly.',
        },
        { status: 500 }
      );
    }

    const smtpHost =
      process.env.SMTP_HOST || 'smtp.gmail.com';

    const smtpPort = Number(
      process.env.SMTP_PORT || 465
    );

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: {
        name: '4uStream',
        address: smtpUser,
      },

      to: email.trim(),

      subject: 'Verify your 4uStream email',

      text:
        'Welcome to 4uStream.\n\n' +
        'Please verify your email address:\n\n' +
        verificationLink.toString(),

      html:
        '<!doctype html>' +
        '<html>' +
        '<body style="margin:0;background:#070b14;color:#fff;font-family:Arial,sans-serif;padding:32px">' +

        '<div style="max-width:560px;margin:auto;background:#111827;border:1px solid #263246;border-radius:24px;padding:36px;text-align:center">' +

        '<h1 style="margin:0 0 12px;font-size:32px">4uStream</h1>' +

        '<p style="color:#aab4c4;font-size:16px;line-height:1.6">' +
        'Welcome! Please verify your email address to activate your 4uStream account.' +
        '</p>' +

        '<a href="' +
        verificationLink.toString() +
        '"' +
        ' style="display:inline-block;margin-top:20px;background:#fff;color:#0b1220;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:14px">' +
        'Verify Email' +
        '</a>' +

        '<p style="margin-top:28px;color:#778398;font-size:12px">' +
        'If you did not create this account, you can ignore this email.' +
        '</p>' +

        '</div>' +
        '</body>' +
        '</html>',
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error(
      '4uStream verification email error:',
      error
    );

    /*
     * Return a safe diagnostic message to the frontend.
     * Do NOT expose SMTP passwords, Firebase credentials,
     * tokens or private server information.
     */
    const code =
      typeof error?.code === 'string'
        ? error.code
        : '';

    const message =
      typeof error?.message === 'string'
        ? error.message
        : '';

    return NextResponse.json(
      {
        error: 'Could not send verification email.',
        code,
        details: message,
      },
      { status: 500 }
    );
  }
}
