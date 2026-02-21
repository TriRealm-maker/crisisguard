import { Router } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

interface TestResult {
  host: string;
  port: number;
  secure: boolean;
  success: boolean;
  errorCode: string | null;
  errorMessage: string | null;
}

const testSmtpConnection = async (host: string, port: number, secure: boolean): Promise<TestResult> => {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  } as nodemailer.TransportOptions);

  try {
    await transporter.verify();
    return {
      host,
      port,
      secure,
      success: true,
      errorCode: null,
      errorMessage: null
    };
  } catch (error: unknown) {
    const err = error as { code?: string; message: string };
    return {
      host,
      port,
      secure,
      success: false,
      errorCode: err.code || null,
      errorMessage: err.message
    };
  }
};

router.get('/email', async (req, res) => {
  const configs = [
    { host: 'smtp.gmail.com', port: 587, secure: false },
    { host: 'smtp.gmail.com', port: 465, secure: true }
  ];

  const results = await Promise.all(
    configs.map(cfg => testSmtpConnection(cfg.host, cfg.port, cfg.secure))
  );

  res.json({ results });
});

export default router;
