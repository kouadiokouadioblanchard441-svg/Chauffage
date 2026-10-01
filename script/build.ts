import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { copyFile, rm, readFile, writeFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // Plesk's application root is the dist directory, so its package manager
  // needs the manifest and lockfile beside the startup file.
  const pleskPackage = {
    ...pkg,
    scripts: {
      start: "NODE_ENV=production node index.cjs",
    },
  };
  await writeFile(
    "dist/package.json",
    `${JSON.stringify(pleskPackage, null, 2)}\n`,
  );
  await copyFile("pnpm-lock.yaml", "dist/pnpm-lock.yaml");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
