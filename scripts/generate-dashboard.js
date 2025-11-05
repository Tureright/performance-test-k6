import { writeFileSync } from "fs";
import { generateDashboard } from "../utils/dashboard-generator.js";

try {
  const html = generateDashboard();
  writeFileSync("results/index.html", html);
  console.log("✅ Dashboard generated at results/index.html");
} catch (error) {
  console.error("❌ Error generating dashboard:", error);
  process.exit(1);
}
