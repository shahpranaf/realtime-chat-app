import { create } from "zustand";
import { httpClient } from "../lib/httpClient";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import type { AuthUser, UserInputData } from "../types";
import { isAxiosError } from "axios";

interface AuthState {
    authUser: AuthUser | null;
    isSigningUp: boolean;
    isLoggingIn: boolean;
    isUpdatingProfile: boolean;
    isCheckingAuth: boolean;
    onlineUsers: string[];
    socket: any;

    checkAuth: () => Promise<void>;
    login: (data: UserInputData) => Promise<boolean>;
    signup: (data: UserInputData) => Promise<boolean>;
    logout: () => Promise<void>;
    updateProfile: (data: any) => Promise<void>;
    connectSocket: () => void;
    disconnectSocket: () => void;
}

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

const showError = (error: unknown) => {
    if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Something went wrong');
    } else {
        toast.error('An unexpected error occurred');
    }
}

export const useAuthStore = create<AuthState>((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    socket: null,
    onlineUsers: [],

    isCheckingAuth: true,
    checkAuth: async () => {
        try {
            const res = await httpClient.get("/auth/check");
            set({ authUser: res.data });
            get().connectSocket();
        } catch (error) {
            console.log("Error in checkAuth:", error)
            set({ authUser: null });
        }
        finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data: UserInputData) => {
        set({ isSigningUp: true });

        try {
            const res = await httpClient.post("/auth/signup", data);
            set({ authUser: res.data });
            toast.success("Account created successfully");
            get().connectSocket();
            return true;
        } catch (error) {
            showError(error);
        } finally {
            set({ isSigningUp: false })
        }
        return false;
    },

    logout: async () => {
        try {
            await httpClient.post("/auth/logout");
            set({ authUser: null });
            toast.success("Logged out successfully");
            get().disconnectSocket();
        } catch (error) {
            showError(error);
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });

        try {
            const res = await httpClient.post("/auth/login", data);
            set({ authUser: res.data });
            toast.success(`Welcome ${res.data.fullName || ""} to the Chatty`);
            get().connectSocket();
            return true;
        } catch (error) {
            console.log("===>", error)
            showError(error);
            return false;
        } finally {
            set({ isLoggingIn: false })
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });

        try {
            const res = await httpClient.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success(`Profile updated sucessfully`);
        } catch (error) {
            console.log("error in udpate profile", error)
            showError(error);
        } finally {
            set({ isUpdatingProfile: false })
        }
    },

    connectSocket: () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return;
        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id
            }
        });

        socket.connect();
        set({ socket: socket });

        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds })
        })
    },

    disconnectSocket: () => {
        if (get().socket?.connected) get().socket?.disconnect();
    }
}));
