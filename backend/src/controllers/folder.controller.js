import { File } from "../models/file.model.js";
import { Folder } from "../models/folder.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import errorhandler from "../utils/errorhandler.js";
import responseHandler from "../utils/responseHandler.js";

import mongoose from "mongoose";

const createfolder=asyncHandler(async(req,res)=>{
    const newfolder=await Folder.create({
        foldername:req.body.foldername,
        owner:req.user._id
    })
    if(!newfolder){
        return errorhandler(500,"folder not created",[]);
    }
    else
      return res.status(200).json(new responseHandler(200,"folder created successfully",newfolder));
})

const getalluserfolders=asyncHandler(async(req,res)=>{
    const userfolders=await Folder.find({owner:req.user._id});
    if(!userfolders||userfolders.length===0){
        throw new errorhandler(404,"folders not found",[]);
    }
    res.status(200).json(new responseHandler(200,"User folders fetched successfully",userfolders));
})

const deletefolder=asyncHandler(async(req,res)=>{
    const folderid=new mongoose.Types.ObjectId(req.params.folderid);
    const folder=await Folder.findOne({_id:folderid});
    if(!folder){
        throw new errorhandler(404,"folder not found",[]);
    }
    const filesinfolder=File.find({folder:folderid}).select("_id");
    await File.deleteMany({_id:{$in:filesinfolder}});
    const deletedfolder=await Folder.findByIdAndDelete(folderid);
    return res.status(200).json(new responseHandler(200,"folder deleted successfully",deletedfolder._id));
        
})

const allfilesinfolder=asyncHandler(async(req,res)=>{
    const folderid=new mongoose.Types.ObjectId(req.params.folderid);
    const files=await File.find({folder:folderid})
    if(!files||files.length===0){
        throw new errorhandler(404,"folder not found",[]);
    }
    return res.status(200).json(new responseHandler(200,"files in folder fetched successfully",files));
});

export {createfolder,getalluserfolders,deletefolder,allfilesinfolder};