export type UserInputData = {
    email: string,
    password: string,
    fullName?: string
}

export interface AuthUser {
    _id: string;
    name: string;
    email: string;
    profilePic: string;
    fullName: string;
    createdAt: string;
}

export type Message = {
    _id?: string;
    senderId?: string,
    receiverId?: string,
    text: string,
    image: string,
    createdAt?: string
}

export type ErrorType = {
    response?: {
        data?: {
            message: string
        }
    }
}
