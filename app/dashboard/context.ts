import { createContext, useContext } from "react";
import type { PageContextType } from "./interface";

export const PageContext = createContext<PageContextType | null>(null);
export const usePageContext = () => useContext(PageContext);
