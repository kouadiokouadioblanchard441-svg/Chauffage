import { db } from "./db";
import { users, tasks, paymentChannels, platformSettings, countries } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";

export async function seed() {
  console.log("Seeding database...");

  // Create session table for connect-pg-simple (if not exists)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
    ) WITH (OIDS=FALSE)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
  `);
  await db.execute(sql`
    ALTER TABLE "payment_numbers" ALTER COLUMN "phone" DROP NOT NULL
  `).catch(() => undefined);
  await db.execute(sql`
    ALTER TABLE "payment_numbers" ADD COLUMN IF NOT EXISTS "payment_link" text
  `).catch(() => undefined);
  await db.execute(sql`
    ALTER TABLE "deposits" ADD COLUMN IF NOT EXISTS "withdrawal_fee_payment_id" integer
  `).catch(() => undefined);
  await db.execute(sql`
    ALTER TABLE "deposits" ADD COLUMN IF NOT EXISTS "cloudpay_order_id" text
  `);
  await db.execute(sql`
    ALTER TABLE "withdrawals" ADD COLUMN IF NOT EXISTS "cloudpay_order_id" text
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "deposits_cloudpay_order_id_unique"
      ON "deposits" ("cloudpay_order_id")
      WHERE "cloudpay_order_id" IS NOT NULL
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "withdrawals_cloudpay_order_id_unique"
      ON "withdrawals" ("cloudpay_order_id")
      WHERE "cloudpay_order_id" IS NOT NULL
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "withdrawal_fee_payments" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL REFERENCES "users"("id"),
      "withdrawal_amount" integer NOT NULL,
      "required_amount" integer NOT NULL,
      "status" text NOT NULL DEFAULT 'pending',
      "deposit_id" integer,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "paid_at" timestamp,
      "used_at" timestamp
    )
  `).catch(() => undefined);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "withdrawal_fee_payments_user_status_idx"
      ON "withdrawal_fee_payments" ("user_id", "status")
  `).catch(() => undefined);

  // Ensure countries table exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "countries" (
      "id" serial PRIMARY KEY,
      "code" text NOT NULL UNIQUE,
      "name" text NOT NULL,
      "currency" text NOT NULL,
      "phone_prefix" text NOT NULL,
      "operators" text NOT NULL DEFAULT '[]',
      "is_active" boolean NOT NULL DEFAULT true
    )
  `);

  // Check if admin already exists. Keep a development fallback for existing
  // installations, while allowing deployments to configure the admin phone
  // through the secret store.
  const adminPhone = process.env.ADMIN_PHONE || "99935673";
  const adminCountry = process.env.ADMIN_COUNTRY || "TG";
  const existingAdmin = await db.select().from(users).where(eq(users.phone, adminPhone));
  const adminPassword = process.env.ADMIN_PASSWORD;

  const adminPin = process.env.ADMIN_PIN;

  if (existingAdmin.length === 0) {
    if (!adminPassword) {
      console.warn("No administrator exists yet; set ADMIN_PASSWORD to provision the initial admin.");
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await db.insert(users).values({
        fullName: "Super Admin",
        phone: adminPhone,
        country: adminCountry,
        password: hashedPassword,
        referralCode: "ADMIN1",
        balance: "0",
        isAdmin: true,
        isSuperAdmin: true,
        adminPin: adminPin || null,
      });
      console.log("Super admin created");
      if (adminPin) console.log("Super admin PIN configured");
    }
  } else {
    // Promote the configured account without replacing its existing login credentials.
    const updateData: any = { isAdmin: true, isSuperAdmin: true };
    if (adminPin) {
      updateData.adminPin = adminPin;
      console.log("Super admin PIN updated");
    }
    await db.update(users)
      .set(updateData)
      .where(eq(users.phone, adminPhone));
    console.log("Super admin access verified");
  }

  // Seed the Philippines on first install. On existing installations without
  // it, retain country records for historical references but deactivate them.
  const existingCountries = await db.select().from(countries);
  const philippines = {
    code: "PH",
    name: "Philippines",
    currency: "PHP",
    phonePrefix: "63",
    operators: JSON.stringify([]),
    isActive: true,
  };
  if (existingCountries.length === 0) {
    await db.insert(countries).values(philippines);
    console.log("Country added: Philippines");
  } else {
    await db.transaction(async (tx) => {
      await tx.update(countries).set({ isActive: false }).where(sql`true`);
      if (existingCountries.some(country => country.code === "PH")) {
        await tx.update(countries).set({ isActive: true }).where(eq(countries.code, "PH"));
      } else {
        await tx.insert(countries).values(philippines);
      }
    });
    console.log("Philippines activated; all other country records preserved as inactive");
  }

  // Product and staking catalogs are administered in the panel; do not seed hardcoded catalog entries.

  // Seed tasks only if table is empty (first install only — never overwrite admin changes)
  const existingTasks = await db.select().from(tasks);
  if (existingTasks.length === 0) {
    await db.insert(tasks).values([
      { name: "Bronze Referral", description: "Invite 3 people to invest", requiredInvites: 3, reward: 350, sortOrder: 1 },
      { name: "Silver Referral", description: "Invite 5 people to invest", requiredInvites: 5, reward: 750, sortOrder: 2 },
      { name: "Gold Referral", description: "Invite 10 people to invest", requiredInvites: 10, reward: 2500, sortOrder: 3 },
      { name: "Platinum Referral", description: "Invite 30 people to invest", requiredInvites: 30, reward: 6500, sortOrder: 4 },
      { name: "Diamond Referral", description: "Invite 100 people to invest", requiredInvites: 100, reward: 15000, sortOrder: 5 },
      { name: "Elite Referral", description: "Invite 300 people to invest", requiredInvites: 300, reward: 50000, sortOrder: 6 },
    ]);
    console.log("Tasks seeded (first install)");
  } else {
    console.log(`Tasks skipped — ${existingTasks.length} existing tasks preserved`);
  }

  // Translate only the exact built-in task rows from older installations.
  // Custom administrator-created tasks are left untouched.
  const legacyTasks = [
    ["Parrain Bronze", "Inviter 3 personnes a investir", "Bronze Referral", "Invite 3 people to invest"],
    ["Parrain Argent", "Inviter 5 personnes a investir", "Silver Referral", "Invite 5 people to invest"],
    ["Parrain Or", "Inviter 10 personnes a investir", "Gold Referral", "Invite 10 people to invest"],
    ["Parrain Platine", "Inviter 30 personnes a investir", "Platinum Referral", "Invite 30 people to invest"],
    ["Parrain Diamant", "Inviter 100 personnes a investir", "Diamond Referral", "Invite 100 people to invest"],
    ["Parrain Elite", "Inviter 300 personnes a investir", "Elite Referral", "Invite 300 people to invest"],
    ["Parrain Bronze", "Inviter 3 personnes", "Bronze Referral", "Invite 3 people"],
    ["Parrain Argent", "Inviter 5 personnes", "Silver Referral", "Invite 5 people"],
    ["Parrain Or", "Inviter 10 personnes", "Gold Referral", "Invite 10 people"],
    ["Parrain Platine", "Inviter 20 personnes", "Platinum Referral", "Invite 20 people"],
    ["Parrain Diamant", "Inviter 50 personnes", "Diamond Referral", "Invite 50 people"],
    ["Parrain Elite", "Inviter 100 personnes", "Elite Referral", "Invite 100 people"],
  ] as const;
  for (const [oldName, oldDescription, name, description] of legacyTasks) {
    await db.update(tasks)
      .set({ name, description })
      .where(sql`name = ${oldName} AND description = ${oldDescription}`);
  }

  // Check if payment channels exist
  const existingChannels = await db.select().from(paymentChannels);
  if (existingChannels.length === 0) {
    await db.insert(paymentChannels).values([
      { name: "LeekPay", redirectUrl: "https://leekpay.com/pay", isApi: false },
      { name: "FedaPay", redirectUrl: "https://fedapay.com/payment", isApi: false },
    ]);
    console.log("Payment channels seeded");
  }

  // Check if settings exist - apply new values for new keys or update existing
  const existingSettings = await db.select().from(platformSettings);
  const requiredSettings = [
    { key: "supportLink", value: "https://t.me/sybotx" },
    { key: "supportType", value: "telegram" },
     { key: "supportLabel", value: "Customer support" },
    { key: "support2Link", value: "https://t.me/sybotx" },
    { key: "support2Type", value: "telegram" },
     { key: "support2Label", value: "Customer support 2" },
    { key: "channelLink", value: "https://t.me/sybotx" },
    { key: "channelType", value: "telegram" },
     { key: "channelLabel", value: "Official channel" },
    { key: "groupLink", value: "https://t.me/sybotx" },
    { key: "groupType", value: "telegram" },
     { key: "groupLabel", value: "Discussion group" },
     { key: "popupButtonLabel", value: "Click here to join the Telegram group" },
     { key: "noticeText", value: "Welcome to Stone by ton! Discover our natural stone, travertine, tiles, and wall cladding." },
    { key: "supportEnabled", value: "true" },
    { key: "support2Enabled", value: "true" },
    { key: "channelEnabled", value: "true" },
    { key: "groupEnabled", value: "true" },
    { key: "minDeposit", value: "3500" },
    { key: "minWithdrawal", value: "800" },
    { key: "withdrawalFees", value: "16" },
    { key: "withdrawalStartHour", value: "9" },
    { key: "withdrawalEndHour", value: "17" },
    { key: "maxWithdrawalsPerDay", value: "1" },
    { key: "withdrawalPrepaymentEnabled", value: "false" },
    { key: "level1Commission", value: "25" },
    { key: "level2Commission", value: "4" },
    { key: "level3Commission", value: "1" },
    { key: "signupBonus", value: "1000" },
    { key: "soleaspayEnabled", value: "false" },
    { key: "soleaspayCountries", value: "" },
    { key: "soleaspayChannelName", value: "SoleaPay" },
    { key: "omnipayEnabled", value: "false" },
    { key: "omnipayChannelName", value: "OmniPay" },
    { key: "sendavapayEnabled", value: "false" },
    { key: "sendavapayChannelName", value: "SendavaPay" },
    { key: "westpayEnabled", value: "false" },
    { key: "westpayChannelName", value: "WestPay" },
    { key: "westpayCountries", value: "" },
    { key: "ashtechEnabled", value: "false" },
    { key: "ashtechChannelName", value: "AshtechPay" },
    { key: "ashtechCountries", value: "" },
    { key: "inpayEnabled", value: "false" },
    { key: "inpayChannelName", value: "InPay" },
    { key: "inpayCountries", value: "" },
  ];

  for (const settingData of requiredSettings) {
    const existing = existingSettings.find(s => s.key === settingData.key);
    const isSensitive = /secret|key|token|password/i.test(settingData.key);
    if (!existing) {
      await db.insert(platformSettings).values(settingData);
      console.log(`Setting added: ${settingData.key}${isSensitive ? "" : ` = ${settingData.value}`}`);
    } else if (
      settingData.key === "supportLabel" && existing.value === "Service client" ||
      settingData.key === "support2Label" && existing.value === "Service client 2" ||
      settingData.key === "channelLabel" && existing.value === "Chaîne officielle" ||
      settingData.key === "groupLabel" && existing.value === "Groupe de discussion" ||
      settingData.key === "popupButtonLabel" && existing.value === "Cliquez ici pour rejoindre le groupe Telegram" ||
      settingData.key === "noticeText" && existing.value === "Bienvenue sur Stone by ton ! Découvrez nos pierres naturelles, travertins, carrelages et parements muraux."
    ) {
      await db.update(platformSettings)
        .set({ value: settingData.value, modifiedAt: new Date() })
        .where(eq(platformSettings.key, settingData.key));
      console.log(`Setting translated: ${settingData.key}`);
    } else if (
      settingData.key === "noticeText" &&
      /sybotx|disney|walt|pixar|marvel|star wars/i.test(existing.value)
    ) {
      await db.update(platformSettings)
        .set({ value: settingData.value })
        .where(eq(platformSettings.key, settingData.key));
      console.log(`Setting updated: ${settingData.key} = ${settingData.value}`);
    } else {
      console.log(`Setting preserved: ${existing.key}${isSensitive ? "" : ` = ${existing.value}`}`);
    }
  }

  const withdrawalFeesMigrationKey = "migration_withdrawal_fees_16_applied";
  if (!existingSettings.some((setting) => setting.key === withdrawalFeesMigrationKey)) {
    await db.update(platformSettings)
      .set({ value: "16", modifiedAt: new Date() })
      .where(eq(platformSettings.key, "withdrawalFees"));
    await db.insert(platformSettings)
      .values({ key: withdrawalFeesMigrationKey, value: "true" })
      .onConflictDoNothing();
    console.log("Withdrawal fee setting migrated to 16%");
  }

  const signupBonusMigrationKey = "migration_signup_bonus_1000_applied";
  if (!existingSettings.some((setting) => setting.key === signupBonusMigrationKey)) {
    await db.update(platformSettings)
      .set({ value: "1000", modifiedAt: new Date() })
      .where(eq(platformSettings.key, "signupBonus"));
    await db.insert(platformSettings)
      .values({ key: signupBonusMigrationKey, value: "true" })
      .onConflictDoNothing();
     console.log("Signup bonus setting migrated to 1000 PHP");
  }

  const minimumWithdrawalMigrationKey = "migration_min_withdrawal_800_applied";
  if (!existingSettings.some((setting) => setting.key === minimumWithdrawalMigrationKey)) {
    await db.update(platformSettings)
      .set({ value: "800", modifiedAt: new Date() })
      .where(eq(platformSettings.key, "minWithdrawal"));
    await db.insert(platformSettings)
      .values({ key: minimumWithdrawalMigrationKey, value: "true" })
      .onConflictDoNothing();
     console.log("Minimum withdrawal setting migrated to 800 PHP");
  }

  // Preserve existing payment settings. Deposit routes are configured explicitly
  // by an administrator; startup seeding must not assign countries automatically.
  console.log("Settings check complete");

  console.log("Database seeding complete!");
}
