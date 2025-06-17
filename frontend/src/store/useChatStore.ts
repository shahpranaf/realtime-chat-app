import { create } from "zustand";
import toast from "react-hot-toast";
import { httpClient } from "../lib/httpClient";
import { useAuthStore } from "./useAuthStore";
import type { AuthUser, Message } from "../types";
import { isAxiosError } from "axios";

interface MessageState {
    messages: Message[],
    users: AuthUser[],
    selectedUser: AuthUser | null,
    isUsersLoading: boolean,
    isMessagesLoading: boolean,

    getUsers: () => Promise<void>;
    getMessages: (userId: string) => Promise<void>;
    sendMessage: (messageData: Message) => Promise<void>;
    subscribeToMessages: () => void;
    unsubscribeFromMessages: () => void;
    setSelectedUser: (selectedUser: AuthUser | null) => void;
}

const showError = (error: unknown) => {
    if (isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Something went wrong');
    } else {
        toast.error('An unexpected error occurred');
    }
}

export const useChatStore = create<MessageState>((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await httpClient.get("/messages/users");
            set({ users: res.data });
        } catch (error) {
            showError(error)
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await httpClient.get(`/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            showError(error)
        } finally {
            set({ isMessagesLoading: false });
        }
    },
    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await httpClient.post(`/messages/send/${selectedUser?._id}`, messageData);
            set({ messages: [...messages, res.data] });
        } catch (error) {
            showError(error)
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if (!isMessageSentFromSelectedUser) return;

            set({
                messages: [...get().messages, newMessage],
            });
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },

    setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
