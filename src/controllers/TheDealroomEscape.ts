/* eslint-disable no-console */

import { Request, Response } from 'express';
import { Prisma, Branch } from '@prisma/client';
import prisma from '../utils/prisma';
import sendEmail from '../utils/sendEmail';
import { dealroomEscapeSchema } from '../validators/TheDealroomEscapeValidator';

export const createDealroomEscape = async (req: Request, res: Response) => {
  try {
    const parsed = dealroomEscapeSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0].message,
      });
    }

    let { teamName, leaderName, leaderEmail, leaderPhone } = parsed.data;

    const { branch } = parsed.data;

    const members = parsed.data.members;

    const ip = req.clientIp || 'unknown';

    teamName = teamName.trim();
    leaderName = leaderName.trim();
    leaderEmail = leaderEmail.trim().toLowerCase();
    leaderPhone = leaderPhone.trim();

    /*Leader Duplicate*/

    const existingLeader = await prisma.theDealroomEscape.findFirst({
      where: {
        OR: [{ leaderEmail }, { leaderPhone }],
      },
    });

    if (existingLeader) {
      return res.status(400).json({
        message: 'Leader already registered a team',
      });
    }

    /*IP Protection*/

    const ipCount = await prisma.theDealroomEscape.count({
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
        const branchExists = await tx.theDealroomEscape.findFirst({
          where: { branch },
        });

        if (branchExists) {
          throw new Error(`Branch ${branch} already registered`);
        }

        return tx.theDealroomEscape.create({
          data: {
            teamName,
            branch: branch as Branch,
            leaderName,
            leaderEmail,
            leaderPhone,
            members: [
              {
                name: leaderName,
                email: leaderEmail,
                phone: leaderPhone,
              },
              ...members,
            ],
            ip,
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

    /* ---------- Email ---------- */

    const subject = 'The Dealroom Escape Registration Successful';

    const text = `
Team ${teamName} successfully registered.

Branch: ${branch}

Team E-Cell NIT Silchar
`;

    const html = `
<h2>The Dealroom Escape</h2>
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

export const checkDealroomEscapeApplication = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email required',
      });
    }

    const team = await prisma.theDealroomEscape.findFirst({
      where: {
        leaderEmail: email.trim().toLowerCase(),
      },
    });

    res.json(team);
  } catch (error) {
    res.status(500).json({
      message: 'Error checking application',
    });
  }
};

export const getDealroomEscapeSlots = async (req: Request, res: Response) => {
  try {
    const branches: Branch[] = ['CSE', 'EE', 'ECE', 'EIE', 'CE', 'ME'];

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
