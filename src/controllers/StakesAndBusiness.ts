/* eslint-disable no-console */
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import sendEmail from '../utils/sendEmail';
import { stakesAndBusinessSchema } from '../validators/StacksAndBusinessValidator';
import { Branch } from '@prisma/client';

/**
 * Register Team
 */
export const createStakesApplication = async (req: Request, res: Response) => {
  try {
    /* ---------- Validate Request ---------- */

    const parsed = stakesAndBusinessSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0].message,
      });
    }

    let {
      teamName,
      branch,
      leaderName,
      leaderEmail,
      leaderPhone,
      // members
    } = parsed.data;
    const members = parsed.data.members;

    const ip = req.clientIp || 'unknown';

    /* ---------- Normalize Inputs ---------- */

    teamName = teamName.trim();
    leaderName = leaderName.trim();
    leaderEmail = leaderEmail.trim().toLowerCase();
    leaderPhone = leaderPhone.trim();
    branch = branch.toUpperCase() as Branch;

    /* ---------- Prevent Leader Duplicate ---------- */

    const existingLeader = await prisma.stakesAndBusiness.findFirst({
      where: {
        OR: [{ leaderEmail }, { leaderPhone }],
      },
    });

    if (existingLeader) {
      return res.status(400).json({
        message: 'Leader already registered a team',
      });
    }

    /* ---------- IP Protection ---------- */

    const ipCount = await prisma.stakesAndBusiness.count({
      where: { ip },
    });

    if (ipCount >= 3) {
      return res.status(400).json({
        message: 'Too many registrations from the same network',
      });
    }

    /* ---------- Transaction Branch Lock ---------- */

    let newTeam;

    try {
      newTeam = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const existingBranch = await tx.stakesAndBusiness.findFirst({
          where: { branch },
        });

        if (existingBranch) {
          throw new Error(`Branch ${branch} already has a team`);
        }

        return tx.stakesAndBusiness.create({
          data: {
            teamName,
            branch,
            leaderName,
            leaderEmail,
            leaderPhone,
            members,
            ip,
          },
        });
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message?.includes('already has a team')) {
        return res.status(400).json({
          message: `Branch ${branch} already has a registered team`,
        });
      }

      throw err;
    }

    /* ---------- Send Confirmation Email ---------- */

    const subject = 'Stakes and Business Registration Successful';

    const text = `
Thank you for registering for Stakes and Business.

Team Name: ${teamName}
Branch: ${branch}

Your team registration has been successfully received.

Best Regards,
Team E-Cell NIT Silchar
`;

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial">

<h2>Stakes and Business Registration</h2>

<p>Team <b>${teamName}</b> has successfully registered.</p>

<p><b>Branch:</b> ${branch}</p>

<p>We will contact you soon with further details.</p>

<br>

<p>
Best Regards<br>
Team E-Cell NIT Silchar
</p>

</body>
</html>
`;

    try {
      await sendEmail(leaderEmail, subject, text, html);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    /* ---------- Success Response ---------- */

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

/**
 * Get All Teams (Admin)
 */
export const getStakesTeams = async (req: Request, res: Response) => {
  try {
    const teams = await prisma.stakesAndBusiness.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(teams);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to fetch teams',
    });
  }
};

/**
 * Check Registration
 */
export const checkStakesApplication = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    const team = await prisma.stakesAndBusiness.findFirst({
      where: {
        leaderEmail: email.trim().toLowerCase(),
      },
    });

    res.json(team);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Error checking application',
    });
  }
};
