import { api } from "./api.js";

export const sendOtp = async (email) => {
  const { data } = await api.post("/otp/send", { email });
  return data;
};

export const verifyOtp = async ({ email, otp }) => {
  const { data } = await api.post("/otp/verify", { email, otp });
  return data;
};
