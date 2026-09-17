import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createEmployee,
  getEmployeeById,
  listEmployeeOptions,
  listEmployees,
  updateEmployee,
} from "../services/employeeService.js";

export const getEmployees = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.validatedQuery ?? {};
  const result = await listEmployees({ search, page, limit });

  res.status(200).json({
    success: true,
    employees: result.employees,
    currentPage: result.currentPage,
    totalPages: result.totalPages,
    totalEmployees: result.total,
    limit: result.limit,
  });
});

export const getEmployeeOptions = asyncHandler(async (_req, res) => {
  const employees = await listEmployeeOptions();
  res.status(200).json({ success: true, employees });
});

export const getEmployee = asyncHandler(async (req, res) => {
  const employee = await getEmployeeById(req.params.id);
  res.status(200).json({ success: true, employee });
});

export const postEmployee = asyncHandler(async (req, res) => {
  const employee = await createEmployee(req.body);
  res.status(201).json({ success: true, message: "Employee created.", employee });
});

export const putEmployee = asyncHandler(async (req, res) => {
  const employee = await updateEmployee(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Employee updated.", employee });
});
