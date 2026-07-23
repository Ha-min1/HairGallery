const fs = require('fs');
const path = require('path');

console.log("=== Verifying Migration Script & File Integrity ===");

const migrationPath = path.join(__dirname, '../sql/sql_18_board_and_inquiry_extension.sql');
if (fs.existsSync(migrationPath)) {
  const content = fs.readFileSync(migrationPath, 'utf8');
  console.log("✅ Migration SQL file exists. Length:", content.length, "bytes");
  
  // Check key requirements in SQL
  const checks = [
    "ALTER TABLE public.component_inquiries",
    "category TEXT NOT NULL DEFAULT 'general'",
    "reply_content TEXT",
    "replied_at TIMESTAMPTZ",
    "CREATE TABLE IF NOT EXISTS public.posts",
    "is_pinned BOOLEAN DEFAULT false",
    "pin_order INT",
    "idx_posts_is_pinned",
    "idx_posts_pin_order",
    "idx_posts_created_at",
    "CREATE POLICY \"Authenticated users can select posts\" ON public.posts",
    "public.is_admin()"
  ];

  checks.forEach(check => {
    if (content.includes(check)) {
      console.log(`  ✓ Check passed: '${check}'`);
    } else {
      console.error(`  ❌ Check failed: '${check}' missing!`);
    }
  });
} else {
  console.error("❌ Migration file missing!");
}

console.log("\n=== Checking Created/Updated Components and Routes ===");
const filesToCheck = [
  'app/api/inquiries/route.ts',
  'app/api/inquiries/my/route.ts',
  'app/api/admin/inquiries/route.ts',
  'app/api/posts/route.ts',
  'app/api/posts/upload/route.ts',
  'app/components/ComponentInquiryModal.tsx',
  'app/components/AdminInquiryViewer.tsx',
  'app/components/BoardSection.tsx',
  'app/mypage/page.tsx',
  'app/page.tsx'
];

filesToCheck.forEach(f => {
  const full = path.join(__dirname, '../', f);
  if (fs.existsSync(full)) {
    console.log(`  ✅ ${f} exists (${fs.statSync(full).size} bytes)`);
  } else {
    console.error(`  ❌ ${f} DOES NOT EXIST!`);
  }
});
