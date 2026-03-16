const fs = require('fs');

const codes = [];

// 25 Week codes (100/day)
for (let i = 0; i < 25; i++) {
  codes.push({
    code: `WK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    limitPerDay: 100,
    durationDays: 7,
    activatedAt: null,
    expiresAt: null,
    usageToday: 0,
    lastReset: new Date().toISOString().split('T')[0]
  });
}

// 25 Month codes (3000/day)
for (let i = 0; i < 25; i++) {
  codes.push({
    code: `MO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    limitPerDay: 3000,
    durationDays: 30,
    activatedAt: null,
    expiresAt: null,
    usageToday: 0,
    lastReset: new Date().toISOString().split('T')[0]
  });
}

// 1 Perma code
codes.push({
  code: "HACKPILOT-GODMODE",
  limitPerDay: -1, // unlimited
  durationDays: null,
  activatedAt: null,
  expiresAt: null,
  usageToday: 0,
  lastReset: new Date().toISOString().split('T')[0]
});

fs.writeFileSync('src/lib/codes.json', JSON.stringify(codes, null, 2));
console.log("Codes generated at src/lib/codes.json");
