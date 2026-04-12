import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const fileschema=new Schema({
    filelink:{
        type:String,
        required:true
    },
    filename:{
        type:String,
        required:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    filesize:{
        type:Number,
        required:true
    }, 
    folder:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Folder",
    },
    filepreview:{
        type: String , //url cloudinary
        default:"https://res.cloudinary.com/dzcmadjlq/file/upload/v1696543783/ClauseValidator/default_pdf_oyh3v0.png"
    }
},{
    timestamps:true
})
fileschema.plugin(mongooseAggregatePaginate);
export const File=mongoose.model("File",fileschema);