import { Branch } from '@prisma/client';

export const permittedEmails: Record<Branch, string[]> = {
  [Branch.CSE]: [
    'dasbishal1717@gmail.com',
    'dasnarayan1717@gmail.com',
    'muskan_ug_23@civil.nits.ac.in',
  ],
  [Branch.EE]: [
    'dasbishal1717@gmail.com',
    'dasnarayan1717@gmail.com',
    'muskan_ug_23@civil.nits.ac.in',
  ],
  [Branch.ECE]: [
    'dasbishal1717@gmail.com',
    'dasnarayan1717@gmail.com',
    'muskan_ug_23@civil.nits.ac.in',
  ],
  [Branch.EIE]: [
    'dasbishal1717@gmail.com',
    'dasnarayan1717@gmail.com',
    'muskan_ug_23@civil.nits.ac.in',
  ],
  [Branch.CE]: [
    'dasbishal1717@gmail.com',
    'dasnarayan1717@gmail.com',
    'muskan_ug_23@civil.nits.ac.in',
  ],
  [Branch.ME]: [
    'dasbishal1717@gmail.com',
    'dasnarayan1717@gmail.com',
    'muskan_ug_23@civil.nits.ac.in',
  ],
};

/**
 * Validates if the given email is present in ANY branch's permitted list.
 * This is used for general endpoints like OTP requests where branch is not specified.
 */
export const isAnyEmailPermitted = (email: string): boolean => {
  const normalizedEmail = email.trim().toLowerCase();
  for (const branchEmails of Object.values(permittedEmails)) {
    if (branchEmails.includes(normalizedEmail)) {
      return true;
    }
  }
  return false;
};

/**
 * Validates if the given email is permitted for a SPECIFIC branch.
 * This is used for event registration routes.
 */
export const isEmailPermittedForBranch = (email: string, branch: Branch): boolean => {
  const normalizedEmail = email.trim().toLowerCase();
  const allowedEmails = permittedEmails[branch] || [];
  return allowedEmails.includes(normalizedEmail);
};
