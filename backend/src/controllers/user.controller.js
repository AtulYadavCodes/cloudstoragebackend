import { asyncHandler } from "../utils/asyncHandler.js";
import errorhandler from "../utils/errorhandler.js"
import {User} from "../models/user.model.js";
import uploadoncloudinary from "../utils/uploadoncloudinary.js";
import responseHandler from "../utils/responseHandler.js"
import jwt from "jsonwebtoken";
import redis from "../db/redis.js";
const generateAccessTokenandRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
     //   user.accessToken=accessToken;
        user.refreshTokens=refreshToken;
       await user.save({validateBeforeSave: false});
        return {accessToken,refreshToken};
    } catch (error) {
        throw new errorhandler(500, "Token generation failed");
    }
}
const registerUser=asyncHandler(async(req,res,next)=>{
    const {fullname,username,email,password}=req.body;
    console.log(fullname,email,password);
    if(fullname==""||email==""||password=="")
    {
        throw new errorhandler(400,"All is required");
    }
    const userchecker=await User.findOne({email:email})
    if(userchecker)
        throw new errorhandler(400,"User already exists");
   const avatarlocalpath= req.file?.path
   if(!avatarlocalpath)
     throw new errorhandler(400,"Avatar is required");
    const cloudinaryresponse=await uploadoncloudinary(avatarlocalpath,{ folder:"avatars"});

    if(!cloudinaryresponse)
        throw new errorhandler(500,"Image not uploaded");
   const user=await User.create({
        fullname,
        username,
        email,
        password,
        avatar: cloudinaryresponse.secure_url
    })
    const createduser= await User.findById(user._id).select("-password -refreshtoken");
    if(!createduser)
    {
        throw new errorhandler(500,"User not created");        
    }
    return res.status(200).json(
        new responseHandler(200,"User created successfully",createduser)
    )
})

const loginuser=asyncHandler(async(req,res,next)=>{
    const {email,password}=req.body;
    if(email==""||password=="")
    {
        throw new errorhandler(400,"All fields are required");
    }
    const userchecker=await User.findOne({email:email});
    if(!userchecker)
        throw new errorhandler(400,"User does not exist");
    const isvalidpassword=await userchecker.isValidPassword(password);
    const key=`login:${req.body.email}:${req.ip}`;
    if(!isvalidpassword)
    {
        await redis.incr(key);
        await redis.expire(key,60);
        throw new errorhandler(400,"Invalid credentials"); 
    }
    await redis.del(key);
    const {accessToken,refreshToken}=await generateAccessTokenandRefreshToken(userchecker._id);
    const loggedinuser= await User.findById(userchecker._id).select("-password -refreshtoken");
    const options={
        httpOnly:true,
        secure: true
      }
      return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(new responseHandler(200,"User logged in successfully",{user:loggedinuser,accessToken,refreshToken}))
})

 const logoutuser=asyncHandler(async(req,res,next)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshTokens: 1 } },
        { new: true }
    )

    const options={
        httpOnly:true,
        secure: true,
    }
    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new responseHandler(200,"User logged out successfully",{}))
})
 const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken;
    if(!incomingRefreshToken)
        throw new errorhandler(401,"Refresh token not found");
    try {


        // Refresh-token validation has two layers:
// 1) jwt.verify(incomingRefreshToken, JWT_REFRESH_SECRET) checks signature and expiry.
//    If token is expired/tampered, verify throws and we reject immediately.
// 2) We then load the user from decoded.userId to identify token owner.
// 3) Even after verify succeeds, we MUST compare with the token stored in DB.
//    This enforces rotation/revocation: old-but-signed tokens are rejected after
//    logout, re-login, or token rotation because they no longer match user.refreshTokens.
        const decoded=jwt.verify(incomingRefreshToken,process.env.JWT_REFRESH_SECRET);
    const user=await User.findById(decoded?.userId);
    if(!user)
        throw new errorhandler(401,"User not found");
    if(!(user.refreshTokens==(incomingRefreshToken)))
        throw new errorhandler(401,"Invalid refresh token");
    const {accessToken,refreshToken}=await user.generateAccessTokenandRefreshToken(user._id);
    const options={
        httpOnly:true,
        secure: true
      }
      return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(new responseHandler(200,"Access token refreshed successfully",{accessToken:accessToken}))
    } catch (error) {
        throw new errorhandler(401,error?.message||"Invalid refresh token");
    }
})

const updateuseravatar=asyncHandler(async(req,res)=>{
    const avatarlocalpath=req.file?.path
    const avatar=await uploadoncloudinary(avatarlocalpath);
    if(!avatar.url)
    {
        throw new errorhandler(500,"error in uploading avatar");
    }
    const updateduser=await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password -refreshtoken");
    return res.status(200).json(new responseHandler(200,"Profile updated successfully",updateduser));
})

const returnuserProfile=asyncHandler(async(req,res)=>{
    return res.status(200).json(new responseHandler(200,"User profile fetched successfully",req.user));
});

const updateuserpassword=asyncHandler(async(req,res)=>{
    const {oldpassword,newpassword}=req.body;
    const user=await User.findById(req.user._id);
    const isvalidpassword=await user.isValidPassword(oldpassword);
    if(!isvalidpassword)
        throw new errorhandler(400,"Old password is incorrect");
    user.password=newpassword;
    await user.save();
    return res.status(200).json(new responseHandler(200,"Password updated successfully",{}));
})
const updateuseremail=asyncHandler(async(req,res)=>{
    const {newemail}=req.body;
    const emailchecker=await User.findOne({email:newemail});
    if(emailchecker)
        throw new errorhandler(400,"Email already in use");
    const updateduser=await User.findByIdAndUpdate(
        req.user._id,
        { $set: { email: newemail } },
        { new: true }
    ).select("-password -refreshtoken");
    return res.status(200).json(new responseHandler(200,"Email updated successfully",updateduser));
})  
export {registerUser,loginuser,logoutuser,refreshAccessToken,updateuseravatar,returnuserProfile,updateuserpassword,updateuseremail};