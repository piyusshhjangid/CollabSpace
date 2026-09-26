declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export {};import type { Role } from "./role.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };

      workspace?: {
        id: string;
        role: Role;
      };
    }
  }
}

export {};