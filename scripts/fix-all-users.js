import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://psa:psa@cluster0.nl4edxh.mongodb.net/gaardb?retryWrites=true&w=majority";

const ALL_MODULES = [
  "dashboard", "employees", "clients", "work-orders", "tenders",
  "fund-request", "payments", "receivables", "organizations", "users",
  "settings", "master-lists", "system-settings", "audit-logs"
];

function getDefaultModules(role) {
  switch (role) {
    case "SYS_ADMIN":
      return ALL_MODULES;
    case "ADMIN":
      return ALL_MODULES.filter(m => m !== "system-settings");
    case "MANAGER":
      return ["dashboard", "employees", "clients", "work-orders", "tenders", "fund-request", "payments", "receivables"];
    case "ACCOUNTANT":
      return ["dashboard", "payments", "receivables", "fund-request"];
    case "ORG_USER":
      return ["dashboard", "fund-request", "users", "settings"];
    default:
      return ["dashboard", "fund-request", "settings"];
  }
}

async function fixAllUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Database connected\n");

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

    const users = await User.find({ modules: { $size: 0 } });
    console.log(`📊 Found ${users.length} users with empty modules\n`);

    for (const user of users) {
      const defaultModules = getDefaultModules(user.role);
      user.modules = defaultModules;
      await user.save();
      console.log(`  ✅ ${user.username} (${user.role}) → ${JSON.stringify(defaultModules)}`);
    }

    await mongoose.disconnect();
    console.log("\n✅ All users updated with default modules");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

fixAllUsers();
