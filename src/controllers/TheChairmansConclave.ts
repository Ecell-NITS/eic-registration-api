/* eslint-disable no-console */
import { Request, Response } from 'express';
import { Prisma, Branch } from '@prisma/client';
import prisma from '../utils/prisma';
import sendEmail from '../utils/sendEmail';

const allowedBranches: Branch[] = ['CSE', 'EE', 'ECE', 'EIE', 'CE', 'ME'];

/**
 * Get all registrations
 */
export const getChairmansConclaveApplications = async (req: Request, res: Response) => {
  try {
    const applications = await prisma.theChairmansConclave.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to fetch registrations.',
    });
  }
};

/**
 * Register participant
 */
export const createChairmansConclaveApplication = async (req: Request, res: Response) => {
  try {
    let { name, email, phone, branch } = req.body;

    const ip = req.clientIp || 'unknown';

    if (!name || !email || !phone || !branch) {
      return res.status(400).json({
        message: 'All fields are required.',
      });
    }

    name = String(name).trim();
    email = String(email).trim().toLowerCase();
    phone = String(phone).trim();

    const branchUpper = String(branch).toUpperCase();

    if (!allowedBranches.includes(branchUpper as Branch)) {
      return res.status(400).json({
        message: 'Invalid branch selected.',
      });
    }

    branch = branchUpper as Branch;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email address.',
      });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        message: 'Phone must be exactly 10 digits.',
      });
    }

    /**
     * Prevent duplicate email or phone
     */
    const existing = await prisma.theChairmansConclave.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existing) {
      return res.status(400).json({
        message: 'You have already registered for this event.',
      });
    }

    /**
     * Limit registrations per IP
     */
    const ipCount = await prisma.theChairmansConclave.count({
      where: { ip },
    });

    if (ipCount >= 100) {
      return res.status(400).json({
        message: 'Too many registrations from the same network.',
      });
    }

    let newRegistration;

    try {
      newRegistration = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const branchCount = await tx.theChairmansConclave.count({
          where: { branch },
        });

        if (branchCount >= 2) {
          throw new Error(`Branch ${branch} is already full`);
        }

        return tx.theChairmansConclave.create({
          data: {
            name,
            email,
            phone,
            branch,
            ip,
          },
        });
      });
    } catch (err: any) {
      if (err.message?.includes('already full')) {
        return res.status(400).json({
          message: `Only 2 participants allowed from ${branch}.`,
        });
      }

      throw err;
    }

    /**
     * Send confirmation email
     */

    const subject = "The Chairman's Conclave Registration Successful";

    const text = `
Thank you for registering for The Chairman's Conclave.

Name: ${name}
Branch: ${branch}

Your registration has been successfully received.

Further event details will be shared soon.

Best Regards,
Team E-Cell NIT Silchar
`;

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
<table align="center" width="100%" cellpadding="0" cellspacing="0"
style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
<tr>
<td style="background:#224259;padding:24px;text-align:center;color:#fff;">
<h2 style="margin:0;">E-Cell NIT Silchar</h2>
<p style="margin:5px 0 0;">The Chairman's Conclave</p>
</td>
</tr>
<tr>
<td style="padding:30px;color:#333;">
<p>Hello <strong>${name}</strong>,</p>
<p>Your registration for <strong>The Chairman's Conclave</strong> has been successfully completed.</p>
<p><strong>Branch:</strong> ${branch}</p>
<p>Further event details will be shared soon.</p>
<br/>
<p>
Best Regards,<br/>
<strong>Team E-Cell NIT Silchar</strong>
</p>
</td>
</tr>
<tr>
<td style="background:#224259;padding:15px;text-align:center;color:#cfd8e3;font-size:13px;">
© ${new Date().getFullYear()} E-Cell NIT Silchar
</td>
</tr>
</table>
</body>
</html>
`;

    try {
      await sendEmail(email, subject, text, html);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(200).json({
      message: 'Registration submitted successfully!',
      registration: newRegistration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Something went wrong!',
    });
  }
};

/**
 * Check if user already registered
 */
export const checkChairmansConclaveApplication = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required.',
      });
    }

    const application = await prisma.theChairmansConclave.findFirst({
      where: { email: String(email).trim().toLowerCase() },
    });

    res.json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error checking registration.',
    });
  }
};

export const getChairmansConclaveSlots = async (req: Request, res: Response) => {
  try {
    const branches: Branch[] = ['CSE', 'EE', 'ECE', 'EIE', 'CE', 'ME'];

    const result: Record<string, string> = {};

    for (const branch of branches) {
      const count = await prisma.theChairmansConclave.count({
        where: { branch },
      });

      result[branch] = `${count}/2`;
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to fetch slots',
    });
  }
};
