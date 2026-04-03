import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema=new Schema({
    fullname:{
        type:String,
        required:true,
        trim:true,
        minlength:3,
        maxlength:50
    },
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        minlength:3,
        maxlength:30,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
    },
    avatar:{
        type:String, //url cloudinary
        required:true,
        default:"https://res.cloudinary.com/dzcmadjlq/image/upload/v1696543783/ClauseValidator/default_avatar_qxqv0r.png"   
    },
    password:{
        type:String,
        required:[true,"passwowd is to be set"],
        minlength:6,
        maxlength:1024
    },
    refreshTokens:{
        type:[String],
    }
},
{
    timestamps:true
})


userSchema.pre("save",async function(){
    if(this.isModified("password")===false) return ;
    this.password=await bcrypt.hash(this.password,10);
    
})

// userSchema.pre("save",async function(next){
//     if(this.isModified("password")===false) return next();
//     this.password=await bcrypt.hash(this.password,10);
//     next();
// })//next is not req here as functio is async either use next and promise based fucntion or async function without next
userSchema.methods.isValidPassword=async function(password){
    return await bcrypt.compare(password,this.password);
}
userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            userId:this._id,
            username:this.username,
            email:this.email,
        },
        process.env.JWT_SECRET,
        {
            expiresIn:process.env.JWT_EXPIRES_IN
        }
    )
};
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            userId:this._id,
        },
        process.env.JWT_REFRESH_SECRET,
        {
            expiresIn:process.env.JWT_REFRESH_EXPIRES_IN
        }
    )
};
export const User=mongoose.model("User",userSchema); 