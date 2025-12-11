import axios from "axios";
import { companyType } from "./type"
const api = axios.create({
  baseURL: `http://localhost:${process.env.PORT}/api`,
});

export async function getCompanies(): Promise<companyType[]>{
  const { data } = await api.get("/companies", {});

  return data;
}
