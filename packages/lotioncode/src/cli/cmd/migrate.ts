import type { Argv } from "yargs"
import { cmd } from "./cmd"
import { UI } from "../ui"
import fs from "fs"
import path from "path"
import os from "os"

interface MigrationOptions {
  from: string
  dryRun: boolean
  all: boolean
  auth: boolean
  sessions: boolean
  projects: boolean
  config: boolean
  state: boolean
  antigravity: boolean
}

interface MigrationResult {
  copied: string[]
  overwritten: string[]
  skipped: string[]
  errors: string[]
}

const DATA_DIRS = {
  data: ".local/share",
  state: ".local/state",
  config: ".config",
}

const MIGRATION_ITEMS = [
  {
    name: "auth",
    description: "API keys and authentication tokens",
    paths: [{ from: "{data}/{source}/auth.json", to: "{data}/{target}/auth.json" }],
  },
  {
    name: "sessions",
    description: "Sessions, messages, and conversation history",
    paths: [
      { from: "{data}/{source}/storage/session", to: "{data}/{target}/storage/session" },
      { from: "{data}/{source}/storage/message", to: "{data}/{target}/storage/message" },
      { from: "{data}/{source}/storage/part", to: "{data}/{target}/storage/part" },
      { from: "{data}/{source}/storage/todo", to: "{data}/{target}/storage/todo" },
      { from: "{data}/{source}/storage/session_diff", to: "{data}/{target}/storage/session_diff" },
    ],
  },
  {
    name: "projects",
    description: "Project metadata and settings",
    paths: [{ from: "{data}/{source}/storage/project", to: "{data}/{target}/storage/project" }],
  },
  {
    name: "config",
    description: "Configuration, agents, plugins, and themes",
    paths: [
      { from: "{config}/{source}/agent", to: "{config}/{target}/agent" },
      { from: "{config}/{source}/agents", to: "{config}/{target}/agents" },
      { from: "{config}/{source}/plugin", to: "{config}/{target}/plugin" },
      { from: "{config}/{source}/plugins", to: "{config}/{target}/plugins" },
      { from: "{config}/{source}/themes", to: "{config}/{target}/themes" },
      { from: "{config}/{source}/skill", to: "{config}/{target}/skill" },
      { from: "{config}/{source}/skills", to: "{config}/{target}/skills" },
      { from: "{config}/{source}/context", to: "{config}/{target}/context" },
      { from: "{config}/{source}/command", to: "{config}/{target}/command" },
      { from: "{config}/{source}/*.json", to: "{config}/{target}/" },
    ],
  },
  {
    name: "state",
    description: "Model preferences, key-value store, and prompt history",
    paths: [
      { from: "{state}/{source}/model.json", to: "{state}/{target}/model.json" },
      { from: "{state}/{source}/kv.json", to: "{state}/{target}/kv.json" },
      { from: "{state}/{source}/prompt-history.jsonl", to: "{state}/{target}/prompt-history.jsonl" },
    ],
  },
  {
    name: "antigravity",
    description: "Antigravity provider accounts",
    paths: [{ from: "{config}/{source}/antigravity-accounts.json", to: "{config}/{target}/antigravity-accounts.json" }],
  },
]

function expandPath(template: string, source: string, target: string): string {
  const home = os.homedir()
  return template
    .replace(/{data}/g, path.join(home, DATA_DIRS.data))
    .replace(/{state}/g, path.join(home, DATA_DIRS.state))
    .replace(/{config}/g, path.join(home, DATA_DIRS.config))
    .replace(/{source}/g, source)
    .replace(/{target}/g, target)
}

function getAllFiles(dir: string): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const stat = fs.statSync(dir)
  if (!stat.isDirectory()) {
    return [dir]
  }

  const entries = fs.readdirSync(dir)
  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath))
    } else {
      files.push(fullPath)
    }
  }

  return files
}

function copyFile(
  src: string,
  dest: string,
  dryRun: boolean,
): { action: "copied" | "overwritten" | "skipped"; error?: string } {
  try {
    if (!fs.existsSync(src)) {
      return { action: "skipped", error: `Source does not exist: ${src}` }
    }

    const destExists = fs.existsSync(dest)

    if (dryRun) {
      return { action: destExists ? "overwritten" : "copied" }
    }

    // Ensure destination directory exists
    const destDir = path.dirname(dest)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    // Copy file
    fs.copyFileSync(src, dest)

    // Preserve permissions
    const srcStat = fs.statSync(src)
    fs.chmodSync(dest, srcStat.mode)

    return { action: destExists ? "overwritten" : "copied" }
  } catch (err) {
    return { action: "skipped", error: `Failed to copy ${src}: ${err}` }
  }
}

function copyDirectory(src: string, dest: string, dryRun: boolean, result: MigrationResult) {
  if (!fs.existsSync(src)) {
    result.skipped.push(`Directory not found: ${src}`)
    return
  }

  const files = getAllFiles(src)

  for (const file of files) {
    const relativePath = path.relative(src, file)
    const destFile = path.join(dest, relativePath)

    const { action, error } = copyFile(file, destFile, dryRun)

    if (error) {
      result.errors.push(error)
    } else if (action === "copied") {
      result.copied.push(relativePath)
    } else if (action === "overwritten") {
      result.overwritten.push(relativePath)
    }
  }
}

function copyGlob(srcPattern: string, destDir: string, source: string, dryRun: boolean, result: MigrationResult) {
  const srcDir = path.dirname(srcPattern)
  const pattern = path.basename(srcPattern)

  if (!fs.existsSync(srcDir)) {
    result.skipped.push(`Directory not found: ${srcDir}`)
    return
  }

  const entries = fs.readdirSync(srcDir)
  const matching = entries.filter((e) => {
    if (pattern === "*.json") return e.endsWith(".json")
    return e === pattern
  })

  for (const entry of matching) {
    const srcFile = path.join(srcDir, entry)
    const destFile = path.join(destDir, entry)

    const stat = fs.statSync(srcFile)
    if (stat.isDirectory()) {
      copyDirectory(srcFile, destFile, dryRun, result)
    } else {
      const relativePath = path.relative(expandPath("{config}/" + source, source, "lotioncode"), srcFile)
      const { action, error } = copyFile(srcFile, destFile, dryRun)

      if (error) {
        result.errors.push(error)
      } else if (action === "copied") {
        result.copied.push(relativePath)
      } else if (action === "overwritten") {
        result.overwritten.push(relativePath)
      }
    }
  }
}

function runMigration(opts: MigrationOptions): MigrationResult {
  const result: MigrationResult = {
    copied: [],
    overwritten: [],
    skipped: [],
    errors: [],
  }

  const source = opts.from
  const target = "lotioncode"

  for (const item of MIGRATION_ITEMS) {
    // Check if this item should be migrated
    if (!opts.all && !(opts as any)[item.name]) {
      continue
    }

    for (const { from, to } of item.paths) {
      const srcPath = expandPath(from, source, target)
      const destPath = expandPath(to, source, target)

      if (from.includes("*")) {
        // Handle glob patterns
        copyGlob(srcPath, destPath, source, opts.dryRun, result)
      } else if (fs.existsSync(srcPath)) {
        const stat = fs.statSync(srcPath)
        if (stat.isDirectory()) {
          copyDirectory(srcPath, destPath, opts.dryRun, result)
        } else {
          const relativePath = path.relative(expandPath("{data}/" + source, source, target), srcPath)
          const { action, error } = copyFile(srcPath, destPath, opts.dryRun)

          if (error) {
            result.errors.push(error)
          } else if (action === "copied") {
            result.copied.push(relativePath)
          } else if (action === "overwritten") {
            result.overwritten.push(relativePath)
          }
        }
      } else {
        result.skipped.push(`Not found: ${srcPath}`)
      }
    }
  }

  return result
}

function printResults(result: MigrationResult, dryRun: boolean) {
  console.log()

  if (dryRun) {
    console.log("📋 Dry run - no changes were made")
    console.log()
  }

  if (result.copied.length > 0) {
    console.log(`✅ Copied: ${result.copied.length} files`)
    for (const file of result.copied.slice(0, 10)) {
      console.log(`   + ${file}`)
    }
    if (result.copied.length > 10) {
      console.log(`   ... and ${result.copied.length - 10} more`)
    }
    console.log()
  }

  if (result.overwritten.length > 0) {
    console.log(`📝 Overwritten: ${result.overwritten.length} files`)
    for (const file of result.overwritten.slice(0, 10)) {
      console.log(`   ~ ${file}`)
    }
    if (result.overwritten.length > 10) {
      console.log(`   ... and ${result.overwritten.length - 10} more`)
    }
    console.log()
  }

  if (result.skipped.length > 0) {
    console.log(`⏭️  Skipped: ${result.skipped.length} items`)
    for (const item of result.skipped.slice(0, 5)) {
      console.log(`   - ${item}`)
    }
    if (result.skipped.length > 5) {
      console.log(`   ... and ${result.skipped.length - 5} more`)
    }
    console.log()
  }

  if (result.errors.length > 0) {
    console.log(`❌ Errors: ${result.errors.length}`)
    for (const error of result.errors.slice(0, 5)) {
      console.log(`   ! ${error}`)
    }
    if (result.errors.length > 5) {
      console.log(`   ... and ${result.errors.length - 5} more`)
    }
    console.log()
  }

  const total = result.copied.length + result.overwritten.length
  console.log(`📊 Total: ${total} files ${dryRun ? "would be " : ""}migrated`)
  console.log()
}

export const MigrateCommand = cmd({
  command: "migrate",
  describe: "migrate data from another OpenCode/LotionCode installation",
  builder: (yargs: Argv) => {
    return yargs
      .option("from", {
        describe: "source application to migrate from",
        type: "string",
        default: "opencode",
        choices: ["opencode", "lotioncode"],
      })
      .option("dry-run", {
        describe: "show what would be migrated without making changes",
        type: "boolean",
        default: false,
      })
      .option("all", {
        describe: "migrate all data (default)",
        type: "boolean",
        default: true,
      })
      .option("auth", {
        describe: "migrate authentication data (API keys, tokens)",
        type: "boolean",
        default: false,
      })
      .option("sessions", {
        describe: "migrate sessions, messages, and conversation history",
        type: "boolean",
        default: false,
      })
      .option("projects", {
        describe: "migrate project metadata",
        type: "boolean",
        default: false,
      })
      .option("config", {
        describe: "migrate configuration, agents, plugins, and themes",
        type: "boolean",
        default: false,
      })
      .option("state", {
        describe: "migrate model preferences and prompt history",
        type: "boolean",
        default: false,
      })
      .option("antigravity", {
        describe: "migrate antigravity provider accounts",
        type: "boolean",
        default: false,
      })
      .example("$0 migrate --from opencode", "Migrate all data from OpenCode")
      .example("$0 migrate --from opencode --dry-run", "Preview what would be migrated")
      .example("$0 migrate --from opencode --auth --config", "Migrate only auth and config")
  },
  handler: async (args) => {
    console.log(UI.logo())
    console.log()

    const source = args.from
    const target = "lotioncode"

    // Check if source exists
    const sourceDataDir = path.join(os.homedir(), DATA_DIRS.data, source)
    if (!fs.existsSync(sourceDataDir)) {
      console.error(`❌ Source not found: ${sourceDataDir}`)
      console.error(`   Make sure ${source} is installed and has data.`)
      process.exit(1)
    }

    // Determine what to migrate
    const opts: MigrationOptions = {
      from: source,
      dryRun: args.dryRun,
      all:
        args.all && !args.auth && !args.sessions && !args.projects && !args.config && !args.state && !args.antigravity,
      auth: args.auth,
      sessions: args.sessions,
      projects: args.projects,
      config: args.config,
      state: args.state,
      antigravity: args.antigravity,
    }

    // If specific flags are set, disable --all
    if (args.auth || args.sessions || args.projects || args.config || args.state || args.antigravity) {
      opts.all = false
    }

    console.log(`🚀 Migrating data from ${source} to ${target}`)
    if (opts.dryRun) {
      console.log("📋 Dry run mode - no changes will be made")
    }
    console.log()

    // Show what will be migrated
    const itemsToMigrate = MIGRATION_ITEMS.filter((item) => opts.all || (opts as any)[item.name])
    console.log("📦 Migration includes:")
    for (const item of itemsToMigrate) {
      console.log(`   • ${item.name}: ${item.description}`)
    }
    console.log()

    // Run migration
    const result = runMigration(opts)

    // Print results
    printResults(result, opts.dryRun)

    if (!opts.dryRun && result.errors.length === 0) {
      console.log("✨ Migration completed successfully!")
      console.log()
      console.log("📝 Note: You may need to restart LotionCode for all changes to take effect.")
    } else if (result.errors.length > 0) {
      console.log("⚠️  Migration completed with errors.")
      process.exit(1)
    }
  },
})
