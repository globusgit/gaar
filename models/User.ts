import mongoose from "mongoose";
import { USER_MODULES } from "@/lib/userModules";

const UserSchema = new mongoose.Schema(
    {
        username:{
            type: String,
            required: true,
            unique: true
        },
        password:{
            type: String,
            required: true,
            select: false
        },
        employeeName:{
            type: String,
            required: true,
        },
        photo: {
            type: String,
        },
        status:{
            type: String,
            required: true,
            default: "Active",
            enum: ["Active", "Inactive", "Suspended"]
        },
        role:{
            type: String,
            required: true,
            enum: ["SYS_ADMIN", "ADMIN", "ACCOUNTS", "ORG_USER", "USER", "MANAGER", "ACCOUNTANT"]
        },
        isFirstLogin:{
            type: Boolean,
            default: true
        },
        orgId:{
            type: String,
            required: true
        },
        modules: [{
            type: String,
            enum: USER_MODULES
        }]
    },
    {timestamps: true}
)

UserSchema.index({ orgId: 1, username: 1 });
UserSchema.index({ orgId: 1, role: 1 });
UserSchema.index({ status: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema)
