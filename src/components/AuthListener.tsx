/** Wrapper que escuta o auth state e injeta no Zustand. */
import { useEffect } from "react";
import { initAuthListener } from "@/lib/store";

export function AuthListener() {
  useEffect(() => {
    initAuthListener();
  }, []);
  return null;
}
