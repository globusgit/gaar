import mongoose from "mongoose"

const EmployeeSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true
        },
        empId:{
            type: String,
            required: true
        },
        photo:{
            type: String,
        },
        phone:{
            type: String,
            required: true
        },
        email:{
            type: String,
        },
        
        designation:{
            type: String,
            required: true
        },
        isManager:{
           type: Boolean
        },
        status:{
            type: String,
            default: "Active"
        },
        managerName: {
            type: String,
        },
        managerObjId: {
            type: String
        },
        orgId:{
            type: String,
            required: true
        },
        modules: [{
            type: String,
        }]

    },
    {timestamps: true}
)

EmployeeSchema.index({ orgId: 1, empId: 1 });
EmployeeSchema.index({ orgId: 1, name: 1 });

export default mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema)