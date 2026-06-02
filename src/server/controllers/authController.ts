import { Request, Response } from "express";
import { adminAuth, adminDb } from "../firebaseAdmin";
import bcrypt from "bcryptjs";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
    });

    // Create user document in Firestore
    const userDoc = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: displayName || email.split('@')[0],
      role: role || 'employee',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(userRecord.uid).set(userDoc);

    res.status(201).json({
      success: true,
      user: userDoc,
      message: "User created successfully"
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(400).json({ 
      error: error.message || "Failed to create user" 
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Get user by email
    const userRecord = await adminAuth.getUserByEmail(email);

    // Get user document from Firestore
    const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();

    if (!userDoc.exists) {
      return res.status(401).json({ error: "User not found in database" });
    }

    // Create custom token
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    res.json({
      success: true,
      token: customToken,
      user: userDoc.data(),
      message: "Login successful"
    });
  } catch (error: any) {
    console.error("Error logging in user:", error);
    if (error.code === 'auth/user-not-found') {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    res.status(401).json({ 
      error: error.message || "Login failed" 
    });
  }
};

export const bootstrapAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const bootstrapEmails = ['hossam@admin.com', 'hossamelwardany132@gmail.com'];

    if (!bootstrapEmails.includes(email)) {
      return res.status(403).json({ error: "Unauthorized email" });
    }

    try {
      // Try to get existing user
      const userRecord = await adminAuth.getUserByEmail(email);
      
      // Get or create user document
      const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
      
      if (!userDoc.exists) {
        const newUserData = {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: email === 'hossam@admin.com' ? 'Admin Hossam' : 'Admin User',
          role: email === 'hossam@admin.com' ? 'super-admin' : 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await adminDb.collection('users').doc(userRecord.uid).set(newUserData);
        const customToken = await adminAuth.createCustomToken(userRecord.uid);
        return res.json({
          success: true,
          token: customToken,
          user: newUserData,
          isNewUser: true
        });
      }

      const customToken = await adminAuth.createCustomToken(userRecord.uid);
      res.json({
        success: true,
        token: customToken,
        user: userDoc.data(),
        isNewUser: false
      });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create new admin user
        const userRecord = await adminAuth.createUser({
          email,
          password,
          displayName: email === 'hossam@admin.com' ? 'Admin Hossam' : 'Admin User',
        });

        const newUserData = {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: email === 'hossam@admin.com' ? 'Admin Hossam' : 'Admin User',
          role: email === 'hossam@admin.com' ? 'super-admin' : 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await adminDb.collection('users').doc(userRecord.uid).set(newUserData);
        const customToken = await adminAuth.createCustomToken(userRecord.uid);

        res.json({
          success: true,
          token: customToken,
          user: newUserData,
          isNewUser: true
        });
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error("Error in bootstrap admin:", error);
    res.status(400).json({ 
      error: error.message || "Bootstrap failed" 
    });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      
      res.json({
        success: true,
        user: userDoc.exists ? userDoc.data() : {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: 'employee'
        }
      });
    } catch (error) {
      // If ID token verification fails, try custom token
      const decodedToken = await adminAuth.verifySessionCookie(token);
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      
      res.json({
        success: true,
        user: userDoc.exists ? userDoc.data() : {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: 'employee'
        }
      });
    }
  } catch (error: any) {
    console.error("Token verification error:", error);
    res.status(401).json({ 
      error: error.message || "Token verification failed" 
    });
  }
};
