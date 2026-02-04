import type { Argv } from "yargs"
import { cmd } from "./cmd"
import { UI } from "../ui"
import { $ } from "bun"
import path from "path"
import fs from "fs"

const TEMPLATES = {
  react: {
    name: "React + Vite + TypeScript",
    description: "Modern React app with Vite, TypeScript, ESLint and Prettier",
    files: {
      "package.json": JSON.stringify(
        {
          name: "{{PROJECT_NAME}}",
          private: true,
          version: "0.0.0",
          type: "module",
          scripts: {
            dev: "vite",
            build: "tsc && vite build",
            preview: "vite preview",
            lint: "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
            format: 'prettier --write "src/**/*.{ts,tsx,css,json}"',
          },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
          },
          devDependencies: {
            "@types/react": "^18.2.43",
            "@types/react-dom": "^18.2.17",
            "@typescript-eslint/eslint-plugin": "^6.14.0",
            "@typescript-eslint/parser": "^6.14.0",
            "@vitejs/plugin-react": "^4.2.1",
            eslint: "^8.55.0",
            "eslint-plugin-react-hooks": "^4.6.0",
            "eslint-plugin-react-refresh": "^0.4.5",
            prettier: "^3.1.1",
            typescript: "^5.2.2",
            vite: "^5.0.8",
          },
        },
        null,
        2,
      ),
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            useDefineForClassFields: true,
            lib: ["ES2020", "DOM", "DOM.Iterable"],
            module: "ESNext",
            skipLibCheck: true,
            moduleResolution: "bundler",
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: "react-jsx",
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true,
          },
          include: ["src"],
          references: [{ path: "./tsconfig.node.json" }],
        },
        null,
        2,
      ),
      "tsconfig.node.json": JSON.stringify(
        {
          compilerOptions: {
            composite: true,
            skipLibCheck: true,
            module: "ESNext",
            moduleResolution: "bundler",
            allowSyntheticDefaultImports: true,
          },
          include: ["vite.config.ts"],
        },
        null,
        2,
      ),
      "vite.config.ts": `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`,
      ".eslintrc.cjs": `module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
`,
      ".prettierrc": JSON.stringify(
        {
          semi: false,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: "es5",
        },
        null,
        2,
      ),
      ".gitignore": `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`,
      "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{PROJECT_NAME}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
      "src/main.tsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
      "src/App.tsx": `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>{{PROJECT_NAME}}</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      <p className="read-the-docs">
        Built with LotionCode
      </p>
    </>
  )
}

export default App
`,
      "src/index.css": `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  button {
    background-color: #f9f9f9;
  }
}
`,
      "src/App.css": `#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
`,
      "README.md": `# {{PROJECT_NAME}}

Built with [LotionCode](https://lotioncode.ai) - AI-powered coding assistant.

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build
- \`npm run lint\` - Run ESLint
- \`npm run format\` - Format code with Prettier

## Tech Stack

- React 18
- TypeScript
- Vite
- ESLint + Prettier
`,
      ".lotioncode/agent/react.md": `# React Expert

You are a React expert specializing in modern React patterns, hooks, and best practices.

## Guidelines

- Use functional components with hooks
- Prefer composition over inheritance
- Use TypeScript for type safety
- Follow React best practices and patterns
- Optimize for performance when needed
`,
    },
  },

  next: {
    name: "Next.js 14 App Router + TypeScript",
    description: "Full-stack Next.js app with App Router, TypeScript, and Tailwind CSS",
    files: {
      "package.json": JSON.stringify(
        {
          name: "{{PROJECT_NAME}}",
          version: "0.1.0",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint",
            format: 'prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}"',
          },
          dependencies: {
            next: "14.0.4",
            react: "^18",
            "react-dom": "^18",
          },
          devDependencies: {
            typescript: "^5",
            "@types/node": "^20",
            "@types/react": "^18",
            "@types/react-dom": "^18",
            autoprefixer: "^10.0.1",
            eslint: "^8",
            "eslint-config-next": "14.0.4",
            postcss: "^8",
            prettier: "^3.1.1",
            tailwindcss: "^3.3.0",
          },
        },
        null,
        2,
      ),
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            plugins: [{ name: "next" }],
            paths: {
              "@/*": ["./*"],
            },
          },
          include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          exclude: ["node_modules"],
        },
        null,
        2,
      ),
      "next.config.js": `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
`,
      "tailwind.config.ts": `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config
`,
      "postcss.config.js": `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`,
      ".eslintrc.json": JSON.stringify(
        {
          extends: "next/core-web-vitals",
        },
        null,
        2,
      ),
      ".prettierrc": JSON.stringify(
        {
          semi: false,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: "es5",
        },
        null,
        2,
      ),
      ".gitignore": `# Dependencies
node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
`,
      "app/globals.css": `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
      "app/layout.tsx": `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '{{PROJECT_NAME}}',
  description: 'Built with LotionCode',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
`,
      "app/page.tsx": `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">{{PROJECT_NAME}}</h1>
        <p className="text-gray-600">Built with LotionCode</p>
      </div>
    </main>
  )
}
`,
      "README.md": `# {{PROJECT_NAME}}

Built with [LotionCode](https://lotioncode.ai) - AI-powered coding assistant.

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run format\` - Format code with Prettier

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
`,
      ".lotioncode/agent/nextjs.md": `# Next.js Expert

You are a Next.js expert specializing in the App Router, server components, and modern Next.js patterns.

## Guidelines

- Use App Router patterns (not pages router)
- Leverage server components by default
- Use client components only when needed (interactivity)
- Follow Next.js 14+ best practices
- Optimize for performance and SEO
`,
    },
  },

  vite: {
    name: "Vite + TypeScript",
    description: "Lightning fast Vite project with TypeScript",
    files: {
      "package.json": JSON.stringify(
        {
          name: "{{PROJECT_NAME}}",
          private: true,
          version: "0.0.0",
          type: "module",
          scripts: {
            dev: "vite",
            build: "tsc && vite build",
            preview: "vite preview",
          },
          devDependencies: {
            typescript: "^5.2.2",
            vite: "^5.0.8",
          },
        },
        null,
        2,
      ),
      "tsconfig.json": JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            useDefineForClassFields: true,
            module: "ESNext",
            lib: ["ES2020", "DOM", "DOM.Iterable"],
            skipLibCheck: true,
            moduleResolution: "bundler",
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true,
          },
          include: ["src"],
        },
        null,
        2,
      ),
      "vite.config.ts": `import { defineConfig } from 'vite'

export default defineConfig({
  // Vite config
})
`,
      ".gitignore": `# Logs
logs
*.log
npm-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
`,
      "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{PROJECT_NAME}}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
      "src/main.ts": `document.querySelector<HTMLDivElement>('#app')!.innerHTML = \`
  <div>
    <h1>{{PROJECT_NAME}}</h1>
    <p>Built with LotionCode</p>
  </div>
\`
`,
      "README.md": `# {{PROJECT_NAME}}

Built with [LotionCode](https://lotioncode.ai) - AI-powered coding assistant.

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build

## Tech Stack

- TypeScript
- Vite
`,
      ".lotioncode/agent/typescript.md": `# TypeScript Expert

You are a TypeScript expert focusing on type safety and modern TypeScript patterns.

## Guidelines

- Use strict TypeScript configuration
- Prefer explicit types over implicit
- Use interfaces for object shapes
- Leverage TypeScript's type inference where appropriate
- Write maintainable, type-safe code
`,
    },
  },

  minecraft: {
    name: "Minecraft Plugin (Java + Maven)",
    description: "Paper/Spigot plugin with Java, Maven, and modern plugin architecture",
    files: {
      "pom.xml": `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>{{PROJECT_NAME}}</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>{{PROJECT_NAME}}</name>
    <description>A Minecraft plugin built with LotionCode</description>

    <properties>
        <java.version>17</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <paper.api.version>1.20.4-R0.1-SNAPSHOT</paper.api.version>
    </properties>

    <repositories>
        <repository>
            <id>papermc</id>
            <url>https://repo.papermc.io/repository/maven-public/</url>
        </repository>
    </repositories>

    <dependencies>
        <dependency>
            <groupId>io.papermc.paper</groupId>
            <artifactId>paper-api</artifactId>
            <version>\${paper.api.version}</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>\${java.version}</source>
                    <target>\${java.version}</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>3.5.1</version>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
        <resources>
            <resource>
                <directory>src/main/resources</directory>
                <filtering>true</filtering>
            </resource>
        </resources>
    </build>
</project>
`,
      ".gitignore": `# Compiled class file
*.class

# Log file
*.log

# BlueJ files
*.ctxt

# Mobile Tools for Java (J2ME)
.mtj.tmp/

# Package Files #
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar

# virtual machine crash logs
hs_err_pid*
replay_pid*

# Maven
target/
pom.xml.tag
pom.xml.releaseBackup
pom.xml.versionsBackup
pom.xml.next
release.properties
dependency-reduced-pom.xml
buildNumber.properties
.mvn/timing.properties
.mvn/wrapper/maven-wrapper.jar

# IDE
.idea/
*.iml
*.iws
*.ipr
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
`,
      "src/main/resources/plugin.yml": `name: {{PROJECT_NAME}}
version: '\${project.version}'
main: com.example.{{PROJECT_NAME}}.{{PROJECT_NAME_CAMEL}}
api-version: '1.20'
description: A Minecraft plugin built with LotionCode
author: Your Name
`,
      "src/main/java/com/example/{{PROJECT_NAME}}/{{PROJECT_NAME_CAMEL}}.java": `package com.example.{{PROJECT_NAME}};

import org.bukkit.plugin.java.JavaPlugin;

public class {{PROJECT_NAME_CAMEL}} extends JavaPlugin {

    @Override
    public void onEnable() {
        getLogger().info("{{PROJECT_NAME}} has been enabled!");
        // Plugin startup logic
    }

    @Override
    public void onDisable() {
        getLogger().info("{{PROJECT_NAME}} has been disabled!");
        // Plugin shutdown logic
    }
}
`,
      "README.md": `# {{PROJECT_NAME}}

A Minecraft Paper/Spigot plugin built with [LotionCode](https://lotioncode.ai) - AI-powered coding assistant.

## Getting Started

\`\`\`bash
# Build the plugin
mvn clean package

# The compiled JAR will be in target/{{PROJECT_NAME}}-1.0.0.jar
\`\`\`

## Installation

1. Build the plugin with Maven
2. Copy the JAR from \`target/\` to your server's \`plugins/\` folder
3. Restart the server

## Development

### Requirements

- Java 17 or higher
- Maven 3.6+
- Paper 1.20.4+ server

### Project Structure

\`\`\`
src/
├── main/
│   ├── java/
│   │   └── com/example/{{PROJECT_NAME}}/
│   │       └── {{PROJECT_NAME_CAMEL}}.java
│   └── resources/
│       └── plugin.yml
└── test/
    └── java/
pom.xml
\`\`\`

## Tech Stack

- Java 17
- Maven
- Paper API 1.20.4
`,
      ".lotioncode/agent/minecraft.md": `# Minecraft Plugin Expert

You are a Minecraft plugin development expert specializing in Paper/Spigot plugins with Java.

## Guidelines

- Use modern Java features (Java 17+)
- Follow Paper API best practices
- Use Maven for dependency management
- Implement proper plugin lifecycle management
- Follow Minecraft plugin conventions
- Use async operations for database/network calls
- Optimize for server performance
`,
    },
  },
}

type TemplateKey = keyof typeof TEMPLATES

export const InitCommand = cmd({
  command: "init <template> [name]",
  describe: "initialize a new project from a template",
  builder: (yargs: Argv) => {
    return yargs
      .positional("template", {
        describe: "project template",
        type: "string",
        choices: Object.keys(TEMPLATES) as TemplateKey[],
      })
      .positional("name", {
        describe: "project name",
        type: "string",
        default: "my-project",
      })
      .option("list", {
        alias: "l",
        describe: "list available templates",
        type: "boolean",
        default: false,
      })
  },
  handler: async (args) => {
    if (args.list) {
      console.log(UI.logo())
      console.log("\nAvailable templates:\n")
      for (const [key, template] of Object.entries(TEMPLATES)) {
        console.log(`  ${key.padEnd(12)} - ${template.name}`)
        console.log(`  ${"".padEnd(12)}   ${template.description}`)
        console.log()
      }
      return
    }

    const template = TEMPLATES[args.template as TemplateKey]
    if (!template) {
      console.error(`Unknown template: ${args.template}`)
      console.error(`Run 'lotioncode init --list' to see available templates`)
      process.exit(1)
    }

    const projectName = args.name
    const projectDir = path.join(process.cwd(), projectName)

    // Check if directory already exists
    if (fs.existsSync(projectDir)) {
      console.error(`Directory already exists: ${projectDir}`)
      process.exit(1)
    }

    console.log(UI.logo())
    console.log(`\nCreating ${template.name}...`)
    console.log(`Project: ${projectName}`)
    console.log(`Location: ${projectDir}\n`)

    // Create project directory
    fs.mkdirSync(projectDir, { recursive: true })

    // Convert project name to camelCase for Java
    const projectNameCamel = projectName
      .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
      .replace(/^(.)/, (_, char) => char.toUpperCase())

    // Create files
    for (const [filePath, content] of Object.entries(template.files)) {
      const fullPath = path.join(projectDir, filePath)
      const dir = path.dirname(fullPath)

      // Create directory if needed
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      // Replace placeholders
      const processedContent = content
        .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
        .replace(/\{\{PROJECT_NAME_CAMEL\}\}/g, projectNameCamel)

      fs.writeFileSync(fullPath, processedContent)
    }

    console.log(`✓ Created ${Object.keys(template.files).length} files`)
    console.log(`\nNext steps:\n`)
    console.log(`  cd ${projectName}`)

    if (args.template === "minecraft") {
      console.log(`  mvn clean package`)
      console.log(`\nThen copy target/${projectName}-1.0.0.jar to your server's plugins folder`)
    } else {
      console.log(`  npm install`)
      console.log(`  npm run dev`)
    }

    console.log()
  },
})
