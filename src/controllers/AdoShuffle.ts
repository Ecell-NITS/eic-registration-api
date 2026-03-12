/* eslint-disable no-console */
import { Request, Response } from 'express';
import { Prisma, Branch } from '@prisma/client';
import prisma from '../utils/prisma';
import sendEmail from '../utils/sendEmail';
import { adoShuffleSchema } from '../validators/AdoShuffleValidator';

export const createAdoShuffle = async (req: Request, res: Response) => {
  try {
    const parsed = adoShuffleSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0].message,
      });
    }

    let { leaderName, leaderEmail, leaderPhone } = parsed.data;
    const { branch } = parsed.data;

    const ip = req.clientIp || 'unknown';

    leaderName = leaderName.trim();
    leaderEmail = leaderEmail.trim().toLowerCase();
    leaderPhone = leaderPhone.trim();

    /*Prevent duplicate leader*/

    const existingLeader = await prisma.adoShuffle.findFirst({
      where: {
        OR: [{ leaderEmail }, { leaderPhone }],
      },
    });

    if (existingLeader) {
      return res.status(400).json({
        message: 'Leader already registered',
      });
    }

    /*IP Protection*/

    const ipCount = await prisma.adoShuffle.count({
      where: { ip },
    });

    if (ipCount >= 3) {
      return res.status(400).json({
        message: 'Too many registrations from same network',
      });
    }

    let newRegistration;

    try {
      newRegistration = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const branchExists = await tx.adoShuffle.findFirst({
          where: { branch },
        });

        if (branchExists) {
          throw new Error(`Branch ${branch} already registered`);
        }

        return tx.adoShuffle.create({
          data: {
            leaderName,
            leaderEmail,
            leaderPhone,
            branch: branch as Branch,
            ip,
          },
        });
      });
    } catch (err: unknown) {
      const error = err as Error;

      if (error.message?.includes('already registered')) {
        return res.status(400).json({
          message: `Branch ${branch} already has a leader`,
        });
      }

      throw err;
    }

    /*Email*/

    const subject = 'AdoShuffle Registration Successful';

    const text = `
Thank you for registering for AdoShuffle.

Name: ${leaderName}
Branch: ${branch}

Team E-Cell NIT Silchar
`;

    const html = `
<h2>AdoShuffle Registration</h2>
<p><b>${leaderName}</b> successfully registered.</p>
<p><b>Branch:</b> ${branch}</p>
`;

    try {
      await sendEmail(leaderEmail, subject, text, html);
    } catch (error) {
      console.error('Email error:', error);
    }

    res.status(200).json({
      message: 'Registration successful',
      data: newRegistration,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Server error',
    });
  }
};

export const getAdoShuffleRegistrations = async (req: Request, res: Response) => {
  try {
    const registrations = await prisma.adoShuffle.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch registrations',
    });
  }
};

export const checkAdoShuffleApplication = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email required',
      });
    }

    const application = await prisma.adoShuffle.findFirst({
      where: {
        leaderEmail: email.trim().toLowerCase(),
      },
    });

    res.json(application);
  } catch (error) {
    res.status(500).json({
      message: 'Error checking application',
    });
  }
};
export const getAdoShuffleSlots = async (req: Request, res: Response) => {
  try {
    const branches = Object.values(Branch);

    const result: Record<string, string> = {};

    for (const branch of branches) {
      const count = await prisma.adoShuffle.count({
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
