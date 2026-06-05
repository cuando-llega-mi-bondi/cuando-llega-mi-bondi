import { create } from "zustand";
import type { ToastMessage } from "../Toast";

interface ToastState {
    toasts: ToastMessage[];
    addToast: (message: Omit<ToastMessage, "id">) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    addToast: (message) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
            toasts: [...state.toasts, { ...message, id }],
        }));
    },
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },
}));

// Helper functions so you can use `toast` without a React hook
export const toast = (message: Omit<ToastMessage, "id">) => useToastStore.getState().addToast(message);
export const removeToast = (id: string) => useToastStore.getState().removeToast(id);
