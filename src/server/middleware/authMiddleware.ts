import { Request, Response, NextFunction } from "express";
import { adminAuth, adminDb } from "../firebaseAdmin";

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: Authentication required" });
      return;
    }

    try {
      // Fetch the actual role directly from Firestore Database
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      if (!userDoc.exists) {
        res.status(403).json({ error: "Access Denied: User account is not registered in Firestore" });
        return;
      }

      const userData = userDoc.data();
      const userRole = userData?.role || "employee";

      // Super admins bypass all roles
      if (userRole === "super-admin") {
        next();
        return;
      }

      if (allowedRoles.includes(userRole)) {
        next();
        return;
      }

      res.status(403).json({ 
        error: `Access Denied: Insufficient permissions. Required roles: ${allowedRoles.join(", ")}, current role: ${userRole}` 
      });
    } catch (err) {
      console.error("RBAC Middleware Error:", err);
       res.status(500).json({ error: "Authorization Service Failure" });
    }
  };
};

export const requirePermission = (permissionKey: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: Authentication required" });
      return;
    }

    try {
      const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
      if (!userDoc.exists) {
        res.status(403).json({ error: "Access Denied: User Profile not configured" });
        return;
      }

      const userData = userDoc.data();
      const userRole = userData?.role || "employee";

      // Super admins and Admins are granted full system-wide permissions
      if (userRole === "super-admin" || userRole === "admin") {
        next();
        return;
      }

      const permissions = userData?.permissions || {};
      if (permissions[permissionKey] === true) {
        next();
        return;
      }

      res.status(403).json({
        error: `Access Denied: Missing authorization privilege for context: '${permissionKey}'`
      });
    } catch (err) {
      console.error("Granular Permission Middleware Error:", err);
      res.status(500).json({ error: "Permission Authorization Service Failure" });
    }
  };
};
