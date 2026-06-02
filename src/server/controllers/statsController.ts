import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { adminDb } from "../firebaseAdmin";

export const getStatsSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeesSnap = await adminDb.collection("employees").count().get();
    const departmentsSnap = await adminDb.collection("departments").count().get();
    const jobsSnap = await adminDb.collection("jobs").where("status", "==", "active").count().get();
    const candidatesSnap = await adminDb.collection("candidates").count().get();

    res.json({
      employees: employeesSnap.data().count,
      departments: departmentsSnap.data().count,
      activeJobs: jobsSnap.data().count,
      totalCandidates: candidatesSnap.data().count,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
