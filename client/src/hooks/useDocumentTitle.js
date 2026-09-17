import { useEffect } from "react";

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Task Management System` : "Task Management System";
  }, [title]);
}
