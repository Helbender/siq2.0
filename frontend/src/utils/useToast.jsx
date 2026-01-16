import { toaster } from "@/components/ui/toaster";

// Store active toast IDs to enable closeAll functionality
const activeToastIds = new Set();

// Compatible API wrapper for Chakra UI v2's useToast
export function useToast() {
  const toast = (options) => {
    const { title, description, status, duration, isClosable, position } = options;
    
    // Map Chakra UI v2 status to v3 type
    const typeMap = {
      success: "success",
      error: "error",
      warning: "warning",
      info: "info",
      loading: "loading",
    };
    
    const type = typeMap[status] || "info";
    
    // Map position
    const placementMap = {
      top: "top",
      bottom: "bottom",
      "top-left": "top-start",
      "top-right": "top-end",
      "bottom-left": "bottom-start",
      "bottom-right": "bottom-end",
    };
    
    const placement = placementMap[position] || "bottom-end";
    
    const toastResult = toaster.create({
      title,
      description,
      type,
      duration: duration || 5000,
      closable: isClosable !== false,
      placement,
    });
    
    // Track the toast ID if available
    if (toastResult && toastResult.id) {
      activeToastIds.add(toastResult.id);
      
      // Remove from tracking when toast is dismissed (if duration is set)
      if (duration && duration > 0) {
        setTimeout(() => {
          activeToastIds.delete(toastResult.id);
        }, duration);
      }
    }
    
    return toastResult;
  };

  toast.closeAll = () => {
    try {
      // Try Chakra UI v3's dismissAll method first
      if (typeof toaster.dismissAll === "function") {
        toaster.dismissAll();
        activeToastIds.clear();
        return;
      }
      
      // Try getVisibleToasts if available
      if (typeof toaster.getVisibleToasts === "function") {
        const visibleToasts = toaster.getVisibleToasts();
        visibleToasts.forEach((t) => {
          if (t.id) {
            toaster.dismiss(t.id);
            activeToastIds.delete(t.id);
          }
        });
        return;
      }
      
      // Fallback: dismiss all tracked toasts
      activeToastIds.forEach((toastId) => {
        try {
          toaster.dismiss(toastId);
        } catch (e) {
          // Ignore errors for individual dismissals
        }
      });
      activeToastIds.clear();
    } catch (error) {
      console.warn("Error closing toasts:", error);
      // Clear tracking even if there was an error
      activeToastIds.clear();
    }
  };

  return toast;
}

