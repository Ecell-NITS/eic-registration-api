import { Branch } from '@prisma/client';

export const permittedEmails: Record<Branch, string[]> = {
  [Branch.CSE]: [
    'kartika.jauhari28@gmail.com',
    'soumyaranjandash005@gmail.com',
    'dasbishal1717@gmail.com',
  ],
  [Branch.EE]: ['connectwithshreyash@gmail.com', 'rra863872@gmail.com', 'himapahi38@gmail.com'],
  [Branch.ECE]: [
    'koustubhmishra2003@gmail.com',
    'tejeshpandey30@gmail.com',
    'ahironsharma08@gmail.com',
  ],
  [Branch.EIE]: ['agrimagoel30@gmail.com', 'anmol.s.sahoo@gmail.com', 'bishaldad1717@gmail.com'],
  [Branch.CE]: ['prabhatrai1204@gmail.com', 'mgogoi080203@gmail.com', 'atulboi222@gmail.com'],
  [Branch.ME]: ['k.saksham2022@gmail.com', 'k.saksham2022@gmail.com', 'dasnarayan1717@gmail.com'],
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
