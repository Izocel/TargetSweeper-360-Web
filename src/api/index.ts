import { TargetSweeperApi } from "targetsweeper-360";

export const API_URL = import.meta.env.VITE_API_URL as string;
export const T360Api = new TargetSweeperApi(API_URL);