import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminAuth } from '@/lib/firebase-admin';

const CUSTOM_ACTION_URL = 'https://4ustream.vercel.app/auth-action';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 },
      );
    }

    const firebaseLink =
      await adminAuth.generateEmailVerificationLink(email, {
        url: CUSTOM_ACTION_URL,
        handleCodeInApp: true,
      });

    const generatedUrl = new URL(firebaseLink);
    const mode =
      generatedUrl.searchParams.get('mode') || 'verifyEmail';
    const oobCode = generatedUrl.searchParams.get('oobCode');

    if (!oobCode) {
      throw new Error('Firebase did not return a verification code.');
    }

    const verificationLink = new URL(CUSTOM_ACTION_URL);
    verificationLink.searchParams.set('mode', mode);
    verificationLink.searchParams.set('oobCode', oobCode);

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP environment variables are missing.');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
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
      to: email,
      subject: 'Verify your 4uStream email',
      text:
        'Welcome to 4uStream. Verify your email here: ' +
        verificationLink.toString(),
      html:
        '<!doctype html><html><body style="margin:0;background:#070b14;color:#fff;font-family:Arial,sans-serif;padding:32px">' +
        '<div style="max-width:560px;margin:auto;background:#111827;border:1px solid #263246;border-radius:24px;padding:36px;text-align:center">' +
        '<h1 style="margin:0 0 12px;font-size:32px">4uStream</h1>' +
        '<p style="color:#aab4c4;font-size:16px;line-height:1.6">Welcome! Please verify your email address to activate your 4uStream account.</p>' +
        '<a href="' +
        verificationLink.toString() +
        '" style="display:inline-block;margin-top:20px;background:#fff;color:#0b1220;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:14px">Verify Email</a>' +
        '<p style="margin-top:28px;color:#778398;font-size:12px">If you did not create this account, you can ignore this email.</p>' +
        '</div></body></html>',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('4uStream verification email error:', error);

    return NextResponse.json(
      { error: 'Could not send verification email.' },
      { status: 500 },
    );
  }
}
