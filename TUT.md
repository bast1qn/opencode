# LotionCode Installation Guide

Complete guide to install LotionCode on Debian 12 and migrate data from OpenCode.

## 🚀 Mega Quick Start: Install + Migrate Everything

**Copy and paste this ONE block** to install LotionCode AND migrate all OpenCode data:

```bash
#!/bin/bash
set -e

echo "🚀 Installing LotionCode + Migrating from OpenCode..."

# Update system and install dependencies
sudo apt update && sudo apt install -y curl unzip git

# Install Bun
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

# Create directories
mkdir -p ~/.local/bin ~/.local/share/lotioncode ~/.local/state/lotioncode ~/.config/lotioncode

# Download and install LotionCode
cd /tmp
curl -L -o lotioncode-linux-x64.zip "https://github.com/R44VC0RP/lotioncode/releases/latest/download/lotioncode-linux-x64.zip"
unzip -o lotioncode-linux-x64.zip
chmod +x lotioncode-linux-x64/bin/lotioncode
cp lotioncode-linux-x64/bin/lotioncode ~/.local/bin/
sudo cp lotioncode-linux-x64/bin/lotioncode /usr/local/bin/

# Verify installation
echo "✅ LotionCode installed: $(lotioncode --version)"

# Check if OpenCode exists and migrate
if [ -d "$HOME/.local/share/opencode" ]; then
    echo "📦 OpenCode data found. Migrating to LotionCode..."
    lotioncode migrate --from opencode
    echo "✅ Migration complete!"
else
    echo "ℹ️  No OpenCode data found. Skipping migration."
fi

echo ""
echo "🎉 LotionCode is ready! Start with: lotioncode"
```

---

## 🔄 Quick Start (Install Only)

If you only want to install LotionCode without migrating:

```bash
# Update system and install dependencies
sudo apt update && sudo apt install -y curl unzip git

# Install Bun (required for LotionCode)
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

# Create directories
mkdir -p ~/.local/bin ~/.local/share/lotioncode ~/.local/state/lotioncode ~/.config/lotioncode

# Download latest LotionCode release
cd /tmp
curl -L -o lotioncode-linux-x64.zip "https://github.com/R44VC0RP/lotioncode/releases/latest/download/lotioncode-linux-x64.zip"
unzip -o lotioncode-linux-x64.zip
chmod +x lotioncode-linux-x64/bin/lotioncode

# Install to system
cp lotioncode-linux-x64/bin/lotioncode ~/.local/bin/
sudo cp lotioncode-linux-x64/bin/lotioncode /usr/local/bin/

# Verify installation
lotioncode --version

echo "✅ LotionCode installed successfully!"
```

---

## Step-by-Step Installation

### 1. System Requirements

```bash
# Update your system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl unzip git build-essential
```

### 2. Install Bun Runtime

LotionCode requires Bun (a fast JavaScript runtime).

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Add Bun to your PATH
export PATH="$HOME/.bun/bin:$PATH"
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify Bun installation
bun --version
```

### 3. Install LotionCode

#### Option A: Download Pre-built Binary (Recommended)

```bash
# Create local bin directory
mkdir -p ~/.local/bin

# Download latest release
cd /tmp
curl -L -o lotioncode-linux-x64.zip \
  "https://github.com/R44VC0RP/lotioncode/releases/latest/download/lotioncode-linux-x64.zip"

# Extract
unzip -o lotioncode-linux-x64.zip

# Make executable and install
chmod +x lotioncode-linux-x64/bin/lotioncode
cp lotioncode-linux-x64/bin/lotioncode ~/.local/bin/

# Optional: Install system-wide
sudo cp lotioncode-linux-x64/bin/lotioncode /usr/local/bin/

# Verify
lotioncode --version
```

#### Option B: Build from Source

```bash
# Clone repository
git clone https://github.com/R44VC0RP/lotioncode.git
cd lotioncode

# Install dependencies
bun install

# Build
LOTIONCODE_VERSION="1.1.50" bun run packages/lotioncode/script/build.ts --single

# Install
cp packages/lotioncode/dist/lotioncode-linux-x64/bin/lotioncode ~/.local/bin/
sudo cp packages/lotioncode/dist/lotioncode-linux-x64/bin/lotioncode /usr/local/bin/
```

### 4. Configure PATH

Ensure `~/.local/bin` is in your PATH:

```bash
# Add to PATH if not already there
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
  source ~/.bashrc
fi

# Verify
which lotioncode
```

---

## Migrating from OpenCode

If you have OpenCode installed and want to migrate your data to LotionCode:

### Quick Migration Command

```bash
# Preview what will be migrated
lotioncode migrate --from opencode --dry-run

# Migrate everything (OpenCode overwrites LotionCode)
lotioncode migrate --from opencode
```

### What Gets Migrated

| Data Type       | Description                              |
| --------------- | ---------------------------------------- |
| **Auth**        | API keys, OAuth tokens, credentials      |
| **Sessions**    | All conversation history                 |
| **Messages**    | Complete message threads                 |
| **Projects**    | Project metadata and settings            |
| **Config**      | Agents, plugins, themes, custom commands |
| **State**       | Model preferences, prompt history        |
| **Antigravity** | Provider account settings                |

### Selective Migration

```bash
# Only migrate authentication
lotioncode migrate --from opencode --auth

# Only migrate sessions and config
lotioncode migrate --from opencode --sessions --config

# Migrate auth + config + state
lotioncode migrate --from opencode --auth --config --state
```

### Migration Options

```bash
# Show help
lotioncode migrate --help

# Preview changes without applying
lotioncode migrate --from opencode --dry-run

# Migrate specific data types
lotioncode migrate --from opencode \
  --auth \
  --sessions \
  --projects \
  --config \
  --state \
  --antigravity
```

---

## Manual Data Migration (If Automatic Fails)

If the automatic migration doesn't work, you can manually copy the files:

```bash
# Create LotionCode directories
mkdir -p ~/.local/share/lotioncode
mkdir -p ~/.local/state/lotioncode
mkdir -p ~/.config/lotioncode

# Copy authentication
cp ~/.local/share/opencode/auth.json ~/.local/share/lotioncode/

# Copy storage (sessions, messages, etc.)
cp -r ~/.local/share/opencode/storage ~/.local/share/lotioncode/

# Copy state (model preferences, etc.)
cp ~/.local/state/opencode/model.json ~/.local/state/lotioncode/ 2>/dev/null || true
cp ~/.local/state/opencode/kv.json ~/.local/state/lotioncode/ 2>/dev/null || true
cp ~/.local/state/opencode/prompt-history.jsonl ~/.local/state/lotioncode/ 2>/dev/null || true

# Copy config (agents, plugins, themes)
cp -r ~/.config/opencode/agent ~/.config/lotioncode/ 2>/dev/null || true
cp -r ~/.config/opencode/agents ~/.config/lotioncode/ 2>/dev/null || true
cp -r ~/.config/opencode/plugin ~/.config/lotioncode/ 2>/dev/null || true
cp -r ~/.config/opencode/plugins ~/.config/lotioncode/ 2>/dev/null || true
cp -r ~/.config/opencode/themes ~/.config/lotioncode/ 2>/dev/null || true
cp -r ~/.config/opencode/skill ~/.config/lotioncode/ 2>/dev/null || true
cp -r ~/.config/opencode/skills ~/.config/lotioncode/ 2>/dev/null || true
cp ~/.config/opencode/*.json ~/.config/lotioncode/ 2>/dev/null || true

# Copy antigravity accounts
cp ~/.config/opencode/antigravity-accounts.json ~/.config/lotioncode/ 2>/dev/null || true

echo "✅ Manual migration complete!"
```

---

## First Run

After installation and migration:

```bash
# Start LotionCode
lotioncode

# Or start in a specific directory
cd /path/to/your/project
lotioncode

# Or with a prompt
lotioncode --prompt "Explain this codebase"
```

---

## Troubleshooting

### Permission Denied

```bash
# Fix permissions
chmod +x ~/.local/bin/lotioncode
chmod +x /usr/local/bin/lotioncode
```

### Command Not Found

```bash
# Check if in PATH
echo $PATH | grep ".local/bin"

# Add to PATH
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Missing Dependencies

```bash
# Install missing packages
sudo apt install -y curl unzip git

# Reinstall Bun if needed
curl -fsSL https://bun.sh/install | bash
```

### Migration Issues

```bash
# Check if OpenCode data exists
ls -la ~/.local/share/opencode/

# Check LotionCode directories
ls -la ~/.local/share/lotioncode/

# Run migration with verbose output
lotioncode migrate --from opencode --dry-run
```

---

## 🔄 Update LotionCode

### Automatic Update Script

Create this script to easily update LotionCode when new versions are released:

```bash
# Create update script
mkdir -p ~/.local/bin
cat > ~/.local/bin/update-lotioncode << 'EOF'
#!/bin/bash
set -e

echo "🔄 Updating LotionCode..."

# Save current version
OLD_VERSION=$(lotioncode --version 2>/dev/null || echo "none")
echo "Current version: $OLD_VERSION"

# Download latest
cd /tmp
curl -L -o lotioncode-linux-x64.zip \
  "https://github.com/R44VC0RP/lotioncode/releases/latest/download/lotioncode-linux-x64.zip"
unzip -o lotioncode-linux-x64.zip

# Install new version
chmod +x lotioncode-linux-x64/bin/lotioncode
cp lotioncode-linux-x64/bin/lotioncode ~/.local/bin/
sudo cp lotioncode-linux-x64/bin/lotioncode /usr/local/bin/

# Show new version
NEW_VERSION=$(lotioncode --version)
echo "✅ Updated to: $NEW_VERSION"

if [ "$OLD_VERSION" != "$NEW_VERSION" ]; then
    echo "🎉 Successfully updated from $OLD_VERSION to $NEW_VERSION!"
else
    echo "ℹ️  Already on latest version"
fi
EOF

chmod +x ~/.local/bin/update-lotioncode

echo "✅ Update script created! Use: update-lotioncode"
```

### Manual Update

```bash
# Download latest version
cd /tmp
curl -L -o lotioncode-linux-x64.zip \
  "https://github.com/R44VC0RP/lotioncode/releases/latest/download/lotioncode-linux-x64.zip"
unzip -o lotioncode-linux-x64.zip

# Install new version
cp lotioncode-linux-x64/bin/lotioncode ~/.local/bin/
sudo cp lotioncode-linux-x64/bin/lotioncode /usr/local/bin/

# Verify
lotioncode --version
```

### Update from Source (Latest Code Changes)

If you want the absolute latest code changes (not just releases):

```bash
# Clone or update repository
if [ -d "$HOME/lotioncode" ]; then
    cd ~/lotioncode
    git pull origin dev
else
    cd ~
    git clone https://github.com/R44VC0RP/lotioncode.git
    cd lotioncode
fi

# Install dependencies
bun install

# Build latest version
LOTIONCODE_VERSION="dev" bun run packages/lotioncode/script/build.ts --single

# Install
cp packages/lotioncode/dist/lotioncode-linux-x64/bin/lotioncode ~/.local/bin/
sudo cp packages/lotioncode/dist/lotioncode-linux-x64/bin/lotioncode /usr/local/bin/

# Verify
lotioncode --version
echo "✅ Built and installed from latest source!"
```

---

## Uninstall

```bash
# Remove binaries
rm ~/.local/bin/lotioncode
sudo rm /usr/local/bin/lotioncode

# Remove data (optional)
rm -rf ~/.local/share/lotioncode
rm -rf ~/.local/state/lotioncode
rm -rf ~/.config/lotioncode

echo "✅ LotionCode uninstalled"
```

---

## Useful Commands

```bash
# Show help
lotioncode --help

# Show version
lotioncode --version

# List all sessions
lotioncode session list

# Export session data
lotioncode export <session-id>

# Import session data
lotioncode import <file.json>

# Manage providers
lotioncode auth

# Start web interface
lotioncode web
```

---

## Directory Structure

After installation, LotionCode uses these directories:

```
~/.local/share/lotioncode/     # Data (sessions, messages, auth)
~/.local/state/lotioncode/     # State (preferences, history)
~/.config/lotioncode/          # Config (agents, plugins, themes)
~/.local/bin/lotioncode        # Binary (user install)
/usr/local/bin/lotioncode      # Binary (system install)
```

---

## Support

- GitHub Issues: https://github.com/R44VC0RP/lotioncode/issues
- Documentation: https://lotioncode.ai/docs

---

**Happy Coding with LotionCode! 🚀**
