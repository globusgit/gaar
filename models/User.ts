import mongoose from "mongoose";

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
            enum: [
                "dashboard",
                "fund-request",
                "payments",
                "receivables",
                "employees",
                "clients",
                "work-orders",
                "tenders",
                "organizations",
                "users",
                "settings",
                "master-lists",
                "system-settings",
                "audit-logs"
            ]
        }]
    },
    {timestamps: true}
)

UserSchema.index({ orgId: 1, username: 1 });
UserSchema.index({ orgId: 1, role: 1 });
UserSchema.index({ status: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema)
