import { TargetSweeperApi } from "targetsweeper-360";

export const T360Api = new TargetSweeperApi(import.meta.env.VITE_API_URL as string);