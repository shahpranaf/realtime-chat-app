import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async(req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if(!token) {
            return res.status(401).json({ message: "Unauthorized - Token not provided"});
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);

        if(!decode) {
            return res.status(401).json({ message: "Unauthorized - Token is invalid"});
        }

        const user = await User.findById(decode.userId).select("-password");

        if(!user) {
            return res.status(404).json({ message: "User not found"});
        }

        req.user = user;
        next();

    } catch (error) {
        console.log("Error in auth middleware", error.message);
        res.status(500).json({ message: "Internal Server Error"});
    }
}
