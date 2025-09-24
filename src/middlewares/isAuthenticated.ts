import type { NextFunction } from "express";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../utils/errors.js";
import { catchAsync } from "../utils/catchAsync.js";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

// export const isAuthenticated = async (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const authHeader = req.headers["authorization"];
//     const token = authHeader && authHeader.split(" ")[1];

//     if (!token) {
//       return res.status(401).json({
//         status: "fail",
//         message: "Unauthorized: No token provided",
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
//       userId: string;
//     };

//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).json({
//       status: "fail",
//       message: "Unauthorized: Invalid token",
//     });
//   }
// };

export const isAuthenticated = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // 👇 Throw an error instead of sending a response
      throw new UnauthorizedError("Unauthorized: No token provided");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };

      req.user = { userId: decoded.userId };
      next();
    } catch (error) {
      // 👇 Catch JWT errors and throw our semantic error
      throw new UnauthorizedError("Unauthorized: Invalid token");
    }
  }
);

export const isAuthenticatedByQuery = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.query.token as string;

    if (!token) {
      throw new UnauthorizedError("Unauthorized: No token provided");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };

      req.user = { userId: decoded.userId };
      next();
    } catch (error) {
      throw new UnauthorizedError("Unauthorized: Invalid token");
    }
  }
);
