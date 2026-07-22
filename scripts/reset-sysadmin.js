import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://psa:psa@cluster0.nl4edxh.mongodb.net/gaardb?retryWrites=true&w=majority";

async function resetSysadmin() {
  await mongoose.connect(MONGODB_URI);

  const User = mongoose.models.User || mongoose.model(
    "User",
    new mongoose.Schema(
      {
        username: String,
        password: String,
        employeeName: String,
        role: String,
        orgId: String,
        isFirstLogin: Boolean,
      },
      { timestamps: true }
    )
  );

  const hashed = await bcrypt.hash("ChangeMe@123", 10);

  const user = await User.findOneAndUpdate(
    { username: "sysadmin" },
    {
      password: hashed,
      role: "SYS_ADMIN",
      isFirstLogin: false,
      status: "Active",
    },
    { new: true, upsert: true }
  );

  console.log("Sysadmin user reset:", {
    username: user.username,
    role: user.role,
    isFirstLogin: user.isFirstLogin,
  });

  await mongoose.disconnect();
}

resetSysadmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
