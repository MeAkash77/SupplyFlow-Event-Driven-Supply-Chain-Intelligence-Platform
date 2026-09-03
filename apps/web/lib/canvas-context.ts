import { createContext, useContext } from "react";

type CanvasContextValue = {
  editNode: (id: string) => void;
};

export const CanvasEditContext = createContext<CanvasContextValue | null>(null);

export function useCanvasEdit() {
  return useContext(CanvasEditContext);
}
