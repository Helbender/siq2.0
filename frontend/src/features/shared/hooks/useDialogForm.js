import { useCallback, useState } from "react";

export function useDialogForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((item) => {
    setEditing(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setEditing(null);
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    editing,
    openCreate,
    openEdit,
    close,
    setIsOpen,
  };
}
