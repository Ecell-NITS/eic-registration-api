/* eslint-disable no-console */
import { Request, Response } from 'express';
import { Prisma, Branch } from '@prisma/client';
import prisma from '../utils/prisma';
import sendEmail from '../utils/sendEmail';
import { campusCapitalistSchema } from '../validators/CampusCapitalistValidator';

export const createCampusCapitalist = async (req: Request, res: Response) => {
  try {
    const parsed = campusCapitalistSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0].message,
      });
    }

    const { teamName, branch, leaderName, leaderEmail, leaderPhone, members } = parsed.data;

    const ip = req.clientIp || 'unknown';

    /* ---------- Prevent leader duplicate ---------- */

    const existingLeader = await prisma.campusCapitalist.findFirst({
      where: {
        OR: [{ leaderEmail }, { leaderPhone }],
      },
    });

    if (existingLeader) {
      return res.status(400).json({
        message: 'Leader already registered a team',
      });
    }

    /* ---------- IP protection ---------- */

    const ipCount = await prisma.campusCapitalist.count({
      where: { ip },
    });

    if (ipCount >= 3) {
      return res.status(400).json({
        message: 'Too many registrations from same network',
      });
    }

    let newTeam;

    try {
      newTeam = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const branchExists = await tx.campusCapitalist.findFirst({
          where: { branch },
        });

        if (branchExists) {
          throw new Error(`Branch ${branch} already has a team`);
        }

        return tx.campusCapitalist.create({
          data: {
            teamName,
            branch: branch as Branch,
            leaderName,
            leaderEmail,
            leaderPhone,
            members,
            ip,
          },
        });
      });
    } catch (err: any) {
      if (err.message?.includes('already has a team')) {
        return res.status(400).json({
          message: `Branch ${branch} already registered`,
        });
      }

      throw err;
    }

    /* ---------- Email ---------- */

    const subject = 'Campus Capitalist Registration Successful';

    const text = `
Team ${teamName} successfully registered.

Branch: ${branch}

Team E-Cell NIT Silchar
`;

    const html = `
<h2>Campus Capitalist</h2>
<p>Team <b>${teamName}</b> registered successfully.</p>
<p><b>Branch:</b> ${branch}</p>
`;

    try {
      await sendEmail(leaderEmail, subject, text, html);
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

export const getCampusCapitalistTeams = async (req: Request, res: Response) => {
  try {
    const teams = await prisma.campusCapitalist.findMany({
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
export const checkCampusCapitalistApplication = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    const team = await prisma.campusCapitalist.findFirst({
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
