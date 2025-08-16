import moongose, { Schema } from "mongoose"
import bcrypt from "bcryptjs" 
const adminScehma = new moongose.Schema({
    email : {
        type: String,
        required: true
    },
    password : {
        type: String,
        required: true
    },
    emailOTP : {
        type: String,
        default: null
    },
    emailOTPExpires : {
        type: Date,
        default: null
    },
      resetPasswordToken: String,
  resetPasswordExpires: Date,
})

adminScehma.pre("save", async function(next) {
    if(!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt)
        next();
    } catch (error) {
        next(error)
    }
})


adminScehma.methods.comparePassword =  async function(adminPassword){
    return await bcrypt.compare(adminPassword, this.password)
}


export default moongose.model("Admin", adminScehma)