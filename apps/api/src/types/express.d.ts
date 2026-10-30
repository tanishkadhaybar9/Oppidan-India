import { SafeUser } from "../auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}
