import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { adminDb } from "../firebaseAdmin";

export const getStatsSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Direct counts using firestore fast O(1) aggregation counters
    const employeesSnap = await adminDb.collection("employees").count().get();
    const departmentsSnap = await adminDb.collection("departments").count().get();
    
    // Check both standard collections for active recruiters or fallbacks
    let jobsSnap;
    try {
      jobsSnap = await adminDb.collection("jobPosts").where("status", "==", "open").count().get();
    } catch {
      jobsSnap = await adminDb.collection("jobs").where("status", "==", "active").count().get();
    }
    
    const candidatesSnap = await adminDb.collection("candidates").count().get();
    const tasksSnap = await adminDb.collection("tasks").count().get();
    const projectsSnap = await adminDb.collection("projects").count().get();

    const totalEmployees = employeesSnap.data().count || 0;
    const totalDepartments = departmentsSnap.data().count || 0;
    const activeJobs = jobsSnap.data().count || 0;
    const totalCandidates = candidatesSnap.data().count || 0;
    const totalTasks = tasksSnap.data().count || 0;
    const totalProjects = projectsSnap.data().count || 0;

    // Retrieve active payroll projections dynamically
    const employeesList = await adminDb.collection("employees").get();
    let totalSalariesBudget = 0;
    let averageSalary = 0;
    let activeEmployeesCount = 0;

    employeesList.forEach((doc) => {
      const data = doc.data();
      const salary = Number(data.salary) || 0;
      const status = data.status || "active";

      if (status === "active") {
        totalSalariesBudget += salary;
        activeEmployeesCount++;
      }
    });

    if (activeEmployeesCount > 0) {
      averageSalary = Math.round(totalSalariesBudget / activeEmployeesCount);
    }

    // Workflow aggregates
    const pendingLeavesSnap = await adminDb.collection("leaveRequests").where("status", "==", "pending").count().get();
    const completedTasksSnap = await adminDb.collection("tasks").where("status", "==", "done").count().get();

    res.json({
      success: true,
      employees: totalEmployees,
      departments: totalDepartments,
      activeJobs: activeJobs,
      totalCandidates: totalCandidates,
      tasks: totalTasks,
      projects: totalProjects,
      pendingLeaves: pendingLeavesSnap.data().count || 0,
      completedTasks: completedTasksSnap.data().count || 0,
      financials: {
        monthlySalariesBudget: totalSalariesBudget,
        averageEmployeeSalary: averageSalary,
        activeEmployeeCount: activeEmployeesCount
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ 
      error: "Internal Server Error",
      details: error.message || String(error)
    });
  }
};
