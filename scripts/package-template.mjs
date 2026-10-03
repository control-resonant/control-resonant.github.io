import { existsSync, lstatSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const projectName = basename(projectRoot);
const releaseDirectory = join(projectRoot, "release");
const archivePath = join(releaseDirectory, `${projectName}.zip`);

const excludedDirectories = new Set([
  ".git",
  ".next",
  ".playwright-cli",
  ".vercel",
  "coverage",
  "node_modules",
  "out",
  "release",
]);

function shouldExcludeFile(name) {
  if (name === ".DS_Store" || name.endsWith(".tsbuildinfo") || name.endsWith(".log")) return true;
  if (name === ".env.example") return false;
  if (name === ".env" || name.startsWith(".env.")) return true;
  return name.endsWith(".zip") || name.endsWith(".tar") || name.endsWith(".tar.gz");
}

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      if (entry.isDirectory() && excludedDirectories.has(entry.name)) return [];
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) return collectFiles(absolutePath);
      if (!entry.isFile() && !lstatSync(absolutePath).isSymbolicLink()) return [];
      if (shouldExcludeFile(entry.name)) return [];
      return [relative(dirname(projectRoot), absolutePath)];
    });
}

const zipCheck = spawnSync("zip", ["-v"], { stdio: "ignore" });
if (zipCheck.error?.code === "ENOENT") {
  console.error("Packaging failed: the system 'zip' command is not installed.");
  process.exit(1);
}

mkdirSync(releaseDirectory, { recursive: true });
if (existsSync(archivePath)) unlinkSync(archivePath);

const files = collectFiles(projectRoot);
if (!files.length) {
  console.error("Packaging failed: no project files were found.");
  process.exit(1);
}

const result = spawnSync("zip", ["-q", "-r", archivePath, ...files], {
  cwd: dirname(projectRoot),
  encoding: "utf8",
});

if (result.status !== 0) {
  console.error(result.stderr || "Packaging failed while creating the ZIP archive.");
  process.exit(result.status || 1);
}

console.log(`Created ${relative(projectRoot, archivePath)} with ${files.length} source files.`);
console.log("Excluded dependencies, build output, Git history, test artifacts, caches and private environment files.");
