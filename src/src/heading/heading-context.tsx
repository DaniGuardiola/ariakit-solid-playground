import { createContext } from "solid-js";
import type { HeadingLevels } from "./utils.ts";

export const HeadingContext = createContext<HeadingLevels | 0>(0);
