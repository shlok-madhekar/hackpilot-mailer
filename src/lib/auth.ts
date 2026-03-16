import fs from "fs";
import path from "path";

const codesPath = path.join(process.cwd(), "src/lib/codes.json");

export function checkAndIncrementUsage(
  codeString: string,
  incrementAmount: number = 0,
): { valid: boolean; error?: string } {
  if (!codeString) return { valid: false, error: "Usage code required." };

  if (!fs.existsSync(codesPath))
    return { valid: false, error: "Codes database not found." };

  let codes = [];
  try {
    codes = JSON.parse(fs.readFileSync(codesPath, "utf8"));
  } catch (e) {
    return { valid: false, error: "Error reading codes." };
  }

  const codeIndex = codes.findIndex((c: any) => c.code === codeString);
  if (codeIndex === -1) return { valid: false, error: "Invalid usage code." };

  const code = codes[codeIndex];

  // Check Expiry
  if (code.expiresAt && new Date() > new Date(code.expiresAt)) {
    return { valid: false, error: "Usage code has expired." };
  }

  // Check daily reset
  const today = new Date().toISOString().split("T")[0];
  if (code.lastReset !== today) {
    code.usageToday = 0;
    code.lastReset = today;
  }

  // Check limit
  if (code.limitPerDay !== -1 && code.usageToday >= code.limitPerDay) {
    return { valid: false, error: "Daily limit reached for this code." };
  }

  if (incrementAmount > 0) {
    code.usageToday += incrementAmount;
    fs.writeFileSync(codesPath, JSON.stringify(codes, null, 2));
  }

  return { valid: true };
}
