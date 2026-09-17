import { api } from "./api.js";

/** Search, filtering and pagination are all resolved by the backend. */
export const getTasks = async ({
  search = "",
  status = "",
  priority = "",
  assignedTo = "",
  page = 1,
  limit = 10,
} = {}) => {
  const { data } = await api.get("/tasks", {
    params: {
      search: search || undefined,
      status: status || undefined,
      priority: priority || undefined,
      assignedTo: assignedTo || undefined,
      page,
      limit,
    },
  });
  return data;
};

export const getTask = async (id) => {
  const { data } = await api.get(`/tasks/${id}`);
  return data.task;
};

export const createTask = async (payload) => {
  const { data } = await api.post("/tasks", payload);
  return data;
};

export const updateTask = async (id, payload) => {
  const { data } = await api.put(`/tasks/${id}`, payload);
  return data;
};

export const updateTaskStatus = async (id, status) => {
  const { data } = await api.patch(`/tasks/${id}/status`, { status });
  return data;
};
