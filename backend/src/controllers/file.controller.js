import mongoose from "mongoose";
import responseHandler from "../utils/responseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import errorhandler from "../utils/errorhandler.js";
import { File } from "../models/file.model.js";
import uploadoncloudinary from "../utils/uploadoncloudinary.js";

const getalluserfiles=asyncHandler(async (req, res) => {
    const { page=1,limit=10,sortby="createdAt", sorttype="desc" }=req.query;
    const userfiles=await File.aggregate([
        { $match:{
            owner:new mongoose.Types.ObjectId(req.user._id)
        }
    },{
        $sort:{
           [sortby]:sorttype==='asc'?1:-1
        }
    }
    ,
    {
        $skip:(Number(page)-1)*limit 
    },{
        $limit: Number(limit)
    }
    ]);
    if(!userfiles||userfiles.length===0){
        return res.status(404).json(new errorhandler(404,"files not found",[]));
    }
    res.status(200).json(new responseHandler(200,"User files fetched successfully",userfiles));
})

const uploadfile=asyncHandler(async(req,res)=>{
    if(!req.file){
        return res.status(400).json(new errorhandler(400,"No file uploaded",[]));
    }
    const cloudinaryresponse=await uploadoncloudinary(req.file.path,{ pages:true, folder:"files" });
    if(!cloudinaryresponse)
     throw new errorhandler(500,"file upload error",[])
    const newfile=await File.create({
        filelink:cloudinaryresponse.secure_url,
        filename:req.file.originalname,
        owner:req.user._id,
        filesize:cloudinaryresponse.bytes,
       folder:req.params.folderid||null,
       // filepreview can be populated later from generated previews.
    });
    const savedfile=await File.findById(newfile._id);
    if(!savedfile){
        return res.status(500).json(new errorhandler(500,"file not saved",[]));
    }
    res.status(200).json(new responseHandler(200,"file uploaded successfully",savedfile));

})
export {getalluserfiles,uploadfile};