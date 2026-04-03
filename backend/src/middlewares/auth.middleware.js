import { User } from "../models/users.model.js";
import { asyncHandler } from "../utils/asynchandler.js";
import error from "../utils/error_structurer.js"
import jwt from "jsonwebtoken";
export const verifyJWT=asyncHandler(async(req,res,next)=>{
    const token= req.cookies?.accessToken || req.headers["authorization"]?.replace("Bearer ","")
    if(!token)
        throw new error(401,"Not authorized, token missing");
       const decodedToken= jwt.verify(token,process.env.JWT_SECRET)
       const user= await User.findById(decodedToken.userId).select("-password -refreshtoken");
       if(!user)
        throw new error(401,"Not authorized, user not found");
         req.user=user;
            next();
    })