import { api } from "./api.js";

export const getEmployees = async ({ search = "", page = 1, limit = 10 } = {}) => {
  const { data } = await api.get("/employees", { params: { search: search || undefined, page, limit } });
  return data;
};

export const getEmployeeOptions = async () => {
  const { data } = await api.get("/employees/options");
  return data.employees;
};

export const getEmployee = async (id) => {
  const { data } = await api.get(`/employees/${id}`);
  return data.employee;
};

export const createEmployee = async (payload) => {
  const { data } = await api.post("/employees", payload);
  return data.employee;
};

export const updateEmployee = async (id, payload) => {
  const { data } = await api.put(`/employees/${id}`, payload);
  return data.employee;
};
