/* eslint-disable no-console */
import { Request, Response } from 'express';
import prisma from '../../prisma/prismaClient';
import sendEmail from '../utils/sendEmail';

interface TeamMember {
  name: string;
  phone: string;
  email?: string;
  scholarId?: string;
}

// Fetch all treasure hunt applications
export const getTreasureHuntApplications = async (req: Request, res: Response) => {
  try {
    const applications = await prisma.treasureHunt.findMany();
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch applications.' });
  }
};

// Create a new treasure hunt application
export const createTreasureHuntApplication = async (req: Request, res: Response) => {
  const {
    teamName,
    teamLeaderName,
    teamLeaderEmail,
    teamLeaderPhone,
    teamLeaderScholarId,
    teamViceCaptainName,
    teamViceCaptainPhone,
    teamViceCaptainScholarId,
    collegeType,
    collegeName,
    department,
    year,
    teamMembers,
  } = req.body;

  try {
    // Validate required fields
    if (
      !teamName ||
      !teamLeaderName ||
      !teamLeaderEmail ||
      !teamLeaderPhone ||
      !teamViceCaptainName ||
      !teamViceCaptainPhone
    ) {
      return res.status(400).json({ message: 'Required fields are missing.' });
    }

    // Validate college information
    if (collegeType === 'other' && !collegeName) {
      return res.status(400).json({ message: 'College name is required for external colleges.' });
    }

    if (collegeType === 'nit_silchar' && !teamLeaderScholarId) {
      return res.status(400).json({ message: 'Scholar ID is required for NIT Silchar students.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(teamLeaderEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    // Phone validation
    if (teamLeaderPhone.length !== 10) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
    }

    // Team size validation (2-4 members including leader)
    if (!teamMembers || teamMembers.length < 1 || teamMembers.length > 3) {
      return res
        .status(400)
        .json({ message: 'Team must have 3-5 members (including leader and vice-captain).' });
    }

    // Validate team members
    for (const member of teamMembers) {
      if (!member.name) {
        return res.status(400).json({ message: 'All team members must have a name.' });
      }
      if (collegeType === 'nit_silchar' && !member.scholarId) {
        return res
          .status(400)
          .json({ message: 'Scholar ID is required for all NIT Silchar team members.' });
      }
    }

    // Prevent duplicate submissions
    const existing = await prisma.treasureHunt.findFirst({
      where: { teamLeaderEmail },
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already registered for this event.' });
    }

    //Run a check to see if vice captain is already registered
    const existingViceCaptain = await prisma.treasureHunt.findFirst({
      where: { teamViceCaptainPhone },
    });

    if (existingViceCaptain) {
      return res
        .status(400)
        .json({ message: 'The vice captain is already registered with another team.' });
    }

    //NOT REQUIRED AS TEAM MEMBERS NAME CAN BE SAME IN DIFFERENT TEAMS
    // // Check if any team member (including leader and vice captain) is already registered for this event
    // const allMembers = [
    //   { name: teamLeaderName, phone: teamLeaderPhone, email: teamLeaderEmail },
    //   { name: teamViceCaptainName, phone: teamViceCaptainPhone, email: null },
    //   ...teamMembers.map((member: TeamMember) => ({
    //     name: member.name,
    //     phone: null, // Treasure hunt members don't have phone in the original schema
    //     email: null,
    //   })),
    // ];

    // for (const member of allMembers) {
    //   const existingMember = await prisma.treasureHuntMembers.findFirst({
    //     where: {
    //       OR: [
    //         { memberName: member.name, memberPhone: member.phone },
    //         { memberName: member.name },
    //         ...(member.phone ? [{ memberPhone: member.phone }] : []),
    //       ],
    //     },
    //   });

    //   if (existingMember) {
    //     return res.status(400).json({
    //       message: `Team member "${member.name}" is already registered with team "${existingMember.teamName}" for this event.`,
    //     });
    //   }
    // }
    //NOT REQUIRED AS TEAM MEMBERS NAME CAN BE SAME IN DIFFERENT TEAMS

    // Create a new application entry

    const result = await prisma.$transaction(async tx => {
      const newApp = await tx.treasureHunt.create({
        data: {
          teamName,
          teamLeaderName,
          teamLeaderEmail,
          teamLeaderPhone,
          teamLeaderScholarId: collegeType === 'nit_silchar' ? teamLeaderScholarId : null,
          teamViceCaptainName,
          teamViceCaptainPhone,
          teamViceCaptainScholarId: collegeType === 'nit_silchar' ? teamViceCaptainScholarId : null,
          collegeType,
          collegeName: collegeType === 'other' ? collegeName : null,
          department,
          year,
          teamMembers: teamMembers.map((member: TeamMember) => ({
            name: member.name,
            scholarId: collegeType === 'nit_silchar' ? member.scholarId : null,
          })),
        },
      });
      const membersToStore = [
        {
          memberName: teamLeaderName,
          memberEmail: teamLeaderEmail,
          memberPhone: teamLeaderPhone,
          teamName,
        },
        {
          memberName: teamViceCaptainName,
          memberEmail: null,
          memberPhone: teamViceCaptainPhone,
          teamName,
        },
        ...teamMembers.map((member: TeamMember) => ({
          memberName: member.name,
          memberEmail: null,
          memberPhone: null,
          teamName,
        })),
      ];
      await tx.treasureHuntMembers.createMany({
        data: membersToStore,
      });
      return newApp;
    });

    const subject = 'Treasure Hunt Registration Successful';
    const text = `Thank you for registering for the Treasure Hunt! Your team "${teamName}" has been successfully registered.
      We've received your registration and will get back to you soon with further details.
      Meanwhile, you can join our WhatsApp group for updates:
      <a href="https://chat.whatsapp.com/F1fZsCel6i85ijbRPNGMFe">Join Group</a>
      Best of luck.E-Cell NIT SilcharTeam`;
    const html = `
<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Treasure Hunt Registration</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Poppins',Arial,Helvetica,sans-serif;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="max-width:600px;margin:auto;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      
      <!-- HEADER -->
      <tr>
        <td style="background-color:#224259;text-align:center;padding:24px 16px;">
          <img src="https://res.cloudinary.com/ecell/image/upload/v1762102444/ecell-logo-bw2_sayvqp_htrv0f.png" alt="E-Cell NIT Silchar" width="60" style="margin-bottom:10px;">
          <h2 style="color:#ffffff;margin:0;font-size:20px;letter-spacing:0.5px;">E-Cell NIT Silchar</h2>
          <p style="color:#cfd8e3;margin:5px 0 0;font-size:14px;">Treasure Hunt 2025</p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:32px 40px;color:#1a1a1a;">
          <h3 style="color:#224259;margin-top:0;">Thank you for registering!</h3>
          <p style="line-height:1.6;color:#333;">
            Dear Participant,
          </p>
          <p style="line-height:1.6;color:#333;">
            Your team <strong>"${teamName}"</strong> has been successfully registered for the
            <strong>Treasure Hunt</strong>.
          </p>
          <p style="line-height:1.6;color:#333;">
            We’ve received your registration and will get back to you soon with event details, timelines, and next steps.
          </p>

          <div style="margin:30px 0;text-align:center;">
            <a href="https://chat.whatsapp.com/F1fZsCel6i85ijbRPNGMFe"
              style="background-color:#224259;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;display:inline-block;font-weight:500;">
              Join WhatsApp Group
            </a>
          </div>

          <p style="line-height:1.6;color:#333;">
            Meanwhile, stay connected and follow our updates on social media!
          </p>

          <p style="margin-top:30px;line-height:1.6;color:#333;">
            <strong>Best of luck,</strong><br/>
            Team E-Cell NIT Silchar
          </p>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background-color:#224259;padding:20px;text-align:center;color:#cfd8e3;font-size:13px;">
          <p style="margin:0;">© ${new Date().getFullYear()} E-Cell NIT Silchar. All rights reserved.</p>
          <div style="margin-top:8px;">
            <a href="https://www.instagram.com/ecell.nitsilchar" style="margin:0 6px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png" width="20" alt="Instagram" />
            </a>
            <a href="https://www.linkedin.com/company/ecell-nit-silchar" style="margin:0 6px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/500px-LinkedIn_logo_initials.png" width="20" alt="LinkedIn" />
            </a>
            <a href="https://www.facebook.com/ecell.nit.silchar/" style="margin:0 6px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Logo_de_Facebook.png/1028px-Logo_de_Facebook.png" width="20" alt="Facebook" />
            </a>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
    try {
      await sendEmail(teamLeaderEmail, subject, text, html);
    } catch (error) {
      console.error('Error sending email for Treasure Hunt Registration:', error);
    }
    res.status(200).json({
      message: 'Registration submitted successfully!',
      registration: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Check if a user has already applied
export const checkTreasureHuntApplication = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const app = await prisma.treasureHunt.findFirst({
      where: { teamLeaderEmail: email },
    });
    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error checking application.' });
  }
};

// Get a single application by email
export const getSingleTreasureHuntApplication = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const app = await prisma.treasureHunt.findFirst({
      where: { teamLeaderEmail: email },
    });
    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching application.' });
  }
};

// Legacy functions for backward compatibility
export const getTreasureApplications = getTreasureHuntApplications;
export const createTreasureApplication = createTreasureHuntApplication;
export const checkTreasureApplication = checkTreasureHuntApplication;
