/* eslint-disable no-console */
import { Request, Response } from 'express';
import { Prisma, Branch } from '@prisma/client';
import prisma from '../utils/prisma';
import sendEmail from '../utils/sendEmail';
import { adoShuffleSchema } from '../validators/AdoShuffleValidator';
import { adoShuffleSubmissionSchema } from '../validators/AdoShuffleSubmissionValidator';
import { isEmailPermittedForBranch } from '../utils/permittedEmails';

/*Register – exactly 5 members from each branch*/
export const createAdoShuffle = async (req: Request, res: Response) => {
  try {
    const parsed = adoShuffleSchema.safeParse(req.body);

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

    let newRegistration;

    try {
      newRegistration = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const existing = await tx.adoShuffle.findUnique({
          where: { branch },
        });

        if (existing) {
          throw new Error(`Branch ${branch} already registered`);
        }

        return tx.adoShuffle.create({
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
          message: `Branch ${branch} is already registered`,
        });
      }
      throw err;
    }

    /* Email */

    const subject = 'AdoShuffle Registration Successful';

    const text = `
Thank you for registering for AdoShuffle.

Branch: ${branch}
Members: ${members.map(m => m.name).join(', ')}

IMPORTANT — Submission Round:
Your registration is not complete until you submit your Video and Poster.
1. Upload your ad video and poster to Google Drive.
2. Set access to "Anyone with the link".
3. Go back to the registration page, select AdoShuffle, and submit both links in the Submission Round section.

Team E-Cell NIT Silchar
`;

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #111111; color: #e2e8f0; margin: 0; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #2a3a30; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
        <div style="background-color: #152218; border-bottom: 1px solid #2a3a30; padding: 25px; text-align: center;">
            <p style="margin: 0; color: #cee7d7; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">EIC 2026 Registration</p>
            <h2 style="margin: 10px 0 0; color: #ffffff; font-size: 24px;">AdoShuffle</h2>
        </div>
        <div style="padding: 30px;">
            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">Your registration for <strong>AdoShuffle</strong> has been successfully completed.</p>
            
            <div style="background-color: #111111; border: 1px solid #2a3a30; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <p style="margin: 0 0 10px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Registered Branch</p>
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #cee7d7;">${branch}</p>
            </div>

            <div style="background-color: #111111; border: 1px solid #2a3a30; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <p style="margin: 0 0 15px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Team Members</p>
                <ul style="margin: 0; padding: 0; list-style-type: none;">
                    ${members.map(m => `<li style="padding: 10px 0; border-bottom: 1px solid #2a3a30; color: #ffffff;"><strong>${m.name}</strong></li>`).join('')}
                </ul>
            </div>

            <div style="background-color: #111111; border: 1px solid #2a3a30; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 25px;">
                <p style="margin: 0 0 15px; font-size: 16px; color: #ffffff; font-weight: bold;">Join the WhatsApp Group</p>
                <p style="margin: 0 0 20px; font-size: 14px; color: #94a3b8;">Stay updated and connect with other participants!</p>
                
                <p style="margin: 0 0 10px; font-size: 12px; color: #94a3b8;">Click below or copy the link to join:</p>
                <div style="background-color: #1a1a1a; border: 1px solid #2a3a30; border-radius: 4px; padding: 12px; margin-bottom: 20px; word-break: break-all;">
                    <a href="https://chat.whatsapp.com/K3YQ61zGpOyJoWDGvZacjU" target="_blank" style="color: #cee7d7; font-size: 14px; text-decoration: none; font-weight: bold;">https://chat.whatsapp.com/K3YQ61zGpOyJoWDGvZacjU</a>
                </div>

                <div style="border-top: 1px solid #2a3a30; padding-top: 20px;">
                    <p style="margin: 0 0 15px; font-size: 14px; color: #94a3b8;">Share this invite with your team members:</p>
                    <a href="https://wa.me/?text=Join%20our%20team%20for%20EIC%202026!%20Here%20is%20the%20WhatsApp%20group%20link:%20https://chat.whatsapp.com/K3YQ61zGpOyJoWDGvZacjU" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: bold;">Share via WhatsApp</a>
                </div>
            </div>

            <div style="background-color: #1a1307; border: 1px solid #92400e; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <p style="margin: 0 0 10px; font-size: 12px; color: #fbbf24; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">⚠ Submission Round — Action Required</p>
                <p style="margin: 0 0 12px; font-size: 14px; color: #fde68a; line-height: 1.6;">Your registration is <strong>not complete</strong> until you submit your <strong>Video</strong> and <strong>Poster</strong>.</p>
                <ol style="margin: 0 0 12px; padding-left: 20px; color: #e2e8f0; font-size: 14px; line-height: 1.8;">
                    <li>Upload your ad video and poster to <strong>Google Drive</strong>.</li>
                    <li>Set access to <strong>"Anyone with the link"</strong>.</li>
                    <li>Go back to the registration page, select <strong>AdoShuffle</strong>, and submit both links in the <strong>Submission Round</strong> section.</li>
                </ol>
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
      message: 'Registration successful! Check your email for more details.',
      data: newRegistration,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Server error',
    });
  }
};

/*Get All Registrations (Admin)*/
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

/*Find application by branch*/
export const checkAdoShuffleApplication = async (req: Request, res: Response) => {
  try {
    const { branch } = req.body;

    if (!branch) {
      return res.status(400).json({
        message: 'Branch is required',
      });
    }

    const branchUpper = String(branch).toUpperCase() as Branch;

    const application = await prisma.adoShuffle.findUnique({
      where: { branch: branchUpper },
    });

    res.json(application);
  } catch (error) {
    res.status(500).json({
      message: 'Error checking application',
    });
  }
};

/*Get slots*/
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

/*Submit video & poster links for a registered branch*/
export const submitAdoShuffle = async (req: Request, res: Response) => {
  try {
    const parsed = adoShuffleSubmissionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0].message,
      });
    }

    const { videoLink, posterLink } = parsed.data;
    if (!videoLink || !posterLink) {
      return res.status(400).json({
        message: 'Please provide both video and poster links',
      });
    }
    const contactEmail = parsed.data.contactEmail.trim().toLowerCase();
    const branch = parsed.data.branch.toUpperCase() as Branch;

    /* Find existing registration */
    const existing = await prisma.adoShuffle.findUnique({
      where: { branch },
    });

    if (!existing) {
      return res.status(404).json({
        message: `Branch ${branch} has not registered for AdoShuffle yet`,
      });
    }

    /* Verify email ownership */
    if (existing.contactEmail.toLowerCase() !== contactEmail) {
      return res.status(403).json({
        message: 'Email does not match the registered contact email',
      });
    }

    /* Check if already submitted */
    if (existing.videoLink && existing.posterLink) {
      return res.status(400).json({
        message: 'Submission has already been completed for this branch',
      });
    }

    /* Update with submission links */
    const updated = await prisma.adoShuffle.update({
      where: { branch },
      data: {
        videoLink,
        posterLink,
        submittedAt: new Date(),
      },
    });

    res.status(200).json({
      message: 'Submission successful!',
      data: updated,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Server error',
    });
  }
};
