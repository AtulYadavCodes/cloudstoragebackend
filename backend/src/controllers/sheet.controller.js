import mongoose from "mongoose";
import responseHandler from "../utils/responseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import errorhandler from "../utils/errorhandler.js";
import { Sheet } from "../models/sheet.model.js";
import uploadoncloudinary from "../utils/uploadoncloudinary.js";

import { Folder } from "../models/folder.model.js";

/*const getallusersheets=asyncHandler(async (req, res) => {
    const { page=1,limit=10,sortby="createdAt", sorttype="desc" }=req.query;
    const usersheets=await sheet.aggregate([
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
    if(!usersheets||usersheets.length===0){
        return res.status(404).json(new errorhandler(404,"sheet not found",[]));
    }
    res.status(200).json(new responseHandler(200,"User sheet fetched successfully",usersheets));
})*/

const uploadsheet=asyncHandler(async(req,res)=>{
    if(!req.file){
        return res.status(400).json(new errorhandler(400,"No sheet file uploaded",[]));
    }
    const cloudinaryresponse=await uploadoncloudinary(req.file.path,{ pages:true, folder:"sheets" });
    if(!cloudinaryresponse)
     throw new errorhandler(500,"file upload error",[])
    const newsheet=await Sheet.create({
        sheetlink:cloudinaryresponse.secure_url,
        sheetname:req.file.originalname,
        owner:req.user._id,
        filesize:cloudinaryresponse.bytes,
       folder:req.params.folderid||null,
       // filepreviewsheets:`https://res.cloudinary.com/${process.env.cloudinary_name}/sheet/upload/pg_1,w_300,h_400,c_fill,q_auto,f_auto/pdfs/${cloudinaryresponse.public_id}.png`||"https://res.cloudinary.com/dzcmadjlq/sheet/upload/v1696543783/ClauseValidator/default_pdf_oyh3v0.png"
    });
    const savedsheet=await Sheet.findById(newsheet._id);
    if(!savedsheet){
        return res.status(500).json(new errorhandler(500,"sheet not saved",[]));
    }
    res.status(200).json(new responseHandler(200,"sheet uploaded successfully",savedsheet));

})
export {/*getallusersheets,*/uploadsheet};