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
      return ALL_MODULES.filter((m) => m !== "system-settings");
    case "MANAGER":
      return [
        "dashboard",
        "employees",
        "clients",
        "work-orders",
        "tenders",
        "fund-request",
        "payments",
        "receivables",
      ];
    case "ACCOUNTANT":
      return ["dashboard", "payments", "receivables", "fund-request"];
    case "ORG_USER":
      return ["dashboard", "fund-request", "users", "settings"];
    default:
      return ["dashboard", "fund-request", "settings"];
  }
}

async function fixAll() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to database\n");

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
      }, { timestamps: true }),
    );

    // Fix sysadmin orgId
    const sysadmin = await User.findOne({ username: "sysadmin" });
    if (sysadmin) {
      sysadmin.orgId = "ORG1";
      sysadmin.modules = ALL_MODULES;
      await sysadmin.save();
      console.log("Fixed sysadmin: orgId=ORG1, modules=all");
    }

    // Fix all other users
    const users = await User.find({});
    let fixedCount = 0;
    for (const user of users) {
      const defaultModules = getDefaultModules(user.role || "USER");
      const current = user.modules || [];
      const needsUpdate =
        user.orgId !== "ORG1" ||
        JSON.stringify(current) !== JSON.stringify(defaultModules);

      if (needsUpdate) {
        user.orgId = "ORG1";
        user.modules = defaultModules;
        await user.save();
        fixedCount++;
        console.log(
          `Fixed ${user.username} (${user.role}): orgId=ORG1, modules=${JSON.stringify(defaultModules)}`,
        );
      }
    }

    console.log(`\nTotal users fixed: ${fixedCount}`);
    await mongoose.disconnect();
    console.log("Done");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

fixAll();
