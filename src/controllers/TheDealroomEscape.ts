/* eslint-disable no-console */
import { Request, Response } from 'express';
import { Prisma, Branch } from '@prisma/client';
import prisma from '../utils/prisma';
import sendEmail from '../utils/sendEmail';
import { dealroomEscapeSchema } from '../validators/TheDealroomEscapeValidator';
import { isEmailPermittedForBranch } from '../utils/permittedEmails';

/*Register – 4 members from each branch*/
export const createDealroomEscape = async (req: Request, res: Response) => {
  try {
    const parsed = dealroomEscapeSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0].message,
      });
    }

    const { members } = parsed.data;
    const contactEmail = parsed.data.contactEmail.trim().toLowerCase();
    const branch = parsed.data.branch.toUpperCase() as Branch;

    if (!isEmailPermittedForBranch(contactEmail, branch)) {
      return res.status(403).json({
        message: 'Email does not have permission',
      });
    }

    /* Transaction – one registration per branch */

    let newTeam;

    try {
      newTeam = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const existing = await tx.theDealroomEscape.findUnique({
          where: { branch },
        });

        if (existing) {
          throw new Error(`Branch ${branch} already registered`);
        }

        return tx.theDealroomEscape.create({
          data: {
            branch,
            contactEmail,
            members,
          },
        });
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message?.includes('already registered')) {
        return res.status(400).json({
          message: `Branch ${branch} already has a team`,
        });
      }
      throw err;
    }

    /* Email */

    const subject = 'The Dealroom Escape Registration Successful';

    const text = `
Thank you for registering for The Dealroom Escape.

Branch: ${branch}
Members: ${members.map(m => m.name).join(', ')}

Team E-Cell NIT Silchar
`;

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #111111; color: #e2e8f0; margin: 0; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #2a3a30; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
        <div style="background-color: #152218; border-bottom: 1px solid #2a3a30; padding: 25px; text-align: center;">
            <p style="margin: 0; color: #cee7d7; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">EIC 2026 Registration</p>
            <h2 style="margin: 10px 0 0; color: #ffffff; font-size: 24px;">The Dealroom Escape</h2>
        </div>
        <div style="padding: 30px;">
            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">Your registration for <strong>The Dealroom Escape</strong> has been successfully completed.</p>
            
            <div style="background-color: #111111; border: 1px solid #2a3a30; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <p style="margin: 0 0 10px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Registered Branch</p>
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #cee7d7;">${branch}</p>
            </div>

            <div style="background-color: #111111; border: 1px solid #2a3a30; border-radius: 8px; padding: 20px;">
                <p style="margin: 0 0 15px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Team Members</p>
                <ul style="margin: 0; padding: 0; list-style-type: none;">
                    ${members.map(m => `<li style="padding: 10px 0; border-bottom: 1px solid #2a3a30; color: #ffffff;"><strong>${m.name}</strong></li>`).join('')}
                </ul>
            </div>

            <p style="margin: 25px 0 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">Further event details and updates will be communicated to this email address.</p>
        </div>
        <div style="background-color: #0a0a0a; border-top: 1px solid #2a3a30; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} E-Cell NIT Silchar. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

    try {
      await sendEmail(contactEmail, subject, text, html);
    } catch (error) {
      console.error('Email error:', error);
    }

    res.status(200).json({
      message: 'Registration successful',
      team: newTeam,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Server error',
    });
  }
};

/*Get All Teams (Admin)*/
export const getDealroomEscapeTeams = async (req: Request, res: Response) => {
  try {
    const teams = await prisma.theDealroomEscape.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(teams);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch teams',
    });
  }
};

/*Find application by branch*/
export const checkDealroomEscapeApplication = async (req: Request, res: Response) => {
  try {
    const { branch } = req.body;

    if (!branch) {
      return res.status(400).json({
        message: 'Branch is required',
      });
    }

    const branchUpper = String(branch).toUpperCase() as Branch;

    const team = await prisma.theDealroomEscape.findUnique({
      where: { branch: branchUpper },
    });

    res.json(team);
  } catch (error) {
    res.status(500).json({
      message: 'Error checking application',
    });
  }
};

/*Get slots*/
export const getDealroomEscapeSlots = async (req: Request, res: Response) => {
  try {
    const branches = Object.values(Branch);

    const result: Record<string, string> = {};

    for (const branch of branches) {
      const count = await prisma.theDealroomEscape.count({
        where: { branch },
      });

      result[branch] = `${count}/1`;
    }

    res.json(result);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to fetch slots',
    });
  }
};
