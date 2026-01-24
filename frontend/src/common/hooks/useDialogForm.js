import { useCallback, useState } from "react";

export function useDialogForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [data, setData] = useState(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setData(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((item) => {
    setEditing(item);
    setData(null);
    setIsOpen(true);
  }, []);

  /** Open with arbitrary data (e.g. for delete confirmations). Use when not create/edit. */
  const open = useCallback((payload) => {
    setEditing(null);
    setData(payload ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setEditing(null);
    setData(null);
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    editing,
    data,
    openCreate,
    openEdit,
    open,
    close,
    setIsOpen,
  };
}
