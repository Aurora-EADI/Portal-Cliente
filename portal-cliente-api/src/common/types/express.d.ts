import type { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      authSession?: unknown;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    authSession?: unknown;
  }
}
