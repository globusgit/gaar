import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://psa:psa@cluster0.nl4edxh.mongodb.net/gaardb?retryWrites=true&w=majority";

async function checkDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Database connected\n");

    const ALL_MODULES = [
      "dashboard", "employees", "clients", "work-orders", "tenders",
      "fund-request", "payments", "receivables", "organizations", "users",
      "settings", "master-lists", "system-settings", "audit-logs"
    ];

    const User = mongoose.models.User || mongoose.model(
      "User",
      new mongoose.Schema({
        username: String,
        password: String,
        employeeName: String,
        role: String,
        orgId: String,
        isFirstLogin: Boolean,
        modules: [String],
      }, { timestamps: true })
    );

    const Employee = mongoose.models.Employee || mongoose.model(
      "Employee",
      new mongoose.Schema({
        name: String,
        empId: String,
        phone: String,
        email: String,
        designation: String,
        orgId: String,
      }, { timestamps: true })
    );

    const users = await User.find({});
    console.log(`📊 Total Users: ${users.length}`);
    users.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.username} (${u.role}) - modules: ${JSON.stringify(u.modules)}`);
    });

    const employees = await Employee.find({});
    console.log(`\n📊 Total Employees: ${employees.length}`);
    employees.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.name} (${e.empId}) - orgId: ${e.orgId}`);
    });

    const sysadmin = await User.findOne({ username: "sysadmin" });
    if (sysadmin) {
      console.log("\n🔧 Updating sysadmin with all modules...");
      sysadmin.modules = ALL_MODULES;
      await sysadmin.save();
      console.log("✅ Sysadmin updated with all modules");
    }

    await mongoose.disconnect();
    console.log("\n✅ Done");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

checkDatabase();
