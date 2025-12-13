# 📦 GitHub APK Hosting & Release Management Guide

**Complete guide for hosting your APK on GitHub and managing updates**

---

## 🎯 Overview

This guide covers:
1. **Initial Setup** - Host your first APK on GitHub
2. **Release Management** - Create organized releases
3. **Update Process** - Handle APK updates efficiently
4. **Best Practices** - Professional workflow

---

## 📋 Prerequisites

- ✅ APK already built using EAS/Expo
- ✅ GitHub account
- ✅ Git installed on your system
- ✅ Your APK file location known

---

# Part 1: Initial GitHub Setup

## Step 1: Locate Your Built APK

After building with EAS, download your APK:

```bash
# If you built with EAS, download from:
# https://expo.dev/accounts/[your-account]/projects/ojt-tracker-mobile/builds

# APK will be named something like:
# build-[build-id].apk
# or
# ojt-tracker-mobile-[version].apk
```

**Rename your APK for clarity:**
```bash
# Example naming convention:
OJT-Tracker-v1.0.0-release.apk
```

---

## Step 2: Initialize Git (if not already done)

```bash
# Navigate to your project folder
cd e:\OJT-TRACKER-MOBILE

# Check if git is already initialized
git status

# If not initialized, run:
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: OJT Tracker Mobile App"
```

---

## Step 3: Create GitHub Repository

### Option A: Using GitHub Website

1. Go to https://github.com/new
2. **Repository name:** `ojt-tracker-mobile`
3. **Description:** "Mobile OJT (On-the-Job Training) Tracker App"
4. **Visibility:** 
   - ✅ **Public** (if you want anyone to download)
   - ⚠️ **Private** (if you want controlled access)
5. **DON'T** initialize with README, .gitignore, or license (you already have these)
6. Click **Create repository**

### Option B: Using GitHub CLI

```bash
# Install GitHub CLI if needed
# Download from: https://cli.github.com/

# Login
gh auth login

# Create repository
gh repo create ojt-tracker-mobile --public --source=. --remote=origin
```

---

## Step 4: Push Your Code to GitHub

```bash
# Add remote (if not already added)
git remote add origin https://github.com/YOUR_USERNAME/ojt-tracker-mobile.git

# Verify remote
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

---

# Part 2: Create Your First GitHub Release

## Step 5: Prepare Release Assets

**Create a releases folder:**
```bash
mkdir releases
```

**Copy your APK:**
```bash
# Copy and rename your APK
copy path\to\your\build.apk releases\OJT-Tracker-v1.0.0-release.apk
```

**⚠️ Important: DO NOT commit APK files to git!**

Add to your `.gitignore`:
```bash
# Add these lines to .gitignore
releases/
*.apk
*.aab
builds/
```

---

## Step 6: Create GitHub Release (Method 1: Web Interface)

### Using GitHub Website (Recommended for first-timers)

1. **Go to your repository:**
   ```
   https://github.com/YOUR_USERNAME/ojt-tracker-mobile
   ```

2. **Click "Releases"** (right sidebar) → **"Create a new release"**

3. **Fill in release details:**
   
   **Tag version:**
   ```
   v1.0.0
   ```
   *(Click "Create new tag: v1.0.0 on publish")*

   **Release title:**
   ```
   OJT Tracker v1.0.0 - Initial Release
   ```

   **Description template:**
   ```markdown
   ## 🎉 OJT Tracker v1.0.0 - Initial Release
   
   ### 📱 What's New
   - ✨ Initial release of OJT Tracker mobile app
   - ⏱️ Time tracking with start/stop functionality
   - 📊 Daily and weekly reports
   - 📝 Log management with photo attachments
   - 👤 User profile management
   - 🔐 Secure authentication
   - 📴 Offline support
   
   ### 📥 Download & Installation
   
   **For Android Users:**
   1. Download `OJT-Tracker-v1.0.0-release.apk` below
   2. Enable "Install from Unknown Sources" in your phone settings
   3. Open the APK file and install
   4. Launch the app and create an account
   
   ### 📋 System Requirements
   - Android 6.0 (Marshmallow) or higher
   - 50 MB free storage space
   - Internet connection for initial setup and sync
   
   ### 🐛 Known Issues
   - None at this time
   
   ### 📞 Support
   For issues or questions, please open an issue on GitHub.
   
   ### 📄 License
   [Your License Here]
   ```

4. **Upload APK:**
   - Drag and drop `OJT-Tracker-v1.0.0-release.apk` into the upload area
   - Or click "Attach binaries" and select your APK

5. **Additional options:**
   - ✅ Check "Set as the latest release"
   - ⚠️ Optional: Check "Create a discussion for this release"

6. **Click "Publish release"** 🚀

---

## Step 7: Create GitHub Release (Method 2: Command Line)

**Using GitHub CLI:**

```bash
# Create a release with your APK
gh release create v1.0.0 \
  path/to/OJT-Tracker-v1.0.0-release.apk \
  --title "OJT Tracker v1.0.0 - Initial Release" \
  --notes "First stable release of OJT Tracker mobile app. 
  
Features:
- Time tracking
- Daily reports
- Log management
- User profiles
- Offline support

Download the APK below and install on your Android device."
```

---

# Part 3: Handling APK Updates

## When to Create a New Release

Create a new release when you have:
- ✅ Bug fixes
- ✅ New features
- ✅ Performance improvements
- ✅ Security updates
- ✅ UI/UX changes

---

## Version Numbering Strategy

Follow **Semantic Versioning (SemVer):**

```
MAJOR.MINOR.PATCH
  1  . 0  .  0
```

- **MAJOR** (1.x.x): Breaking changes, major new features
- **MINOR** (x.1.x): New features, backward compatible
- **PATCH** (x.x.1): Bug fixes, minor improvements

**Examples:**
- `v1.0.0` → Initial release
- `v1.0.1` → Bug fix
- `v1.1.0` → New feature added
- `v2.0.0` → Major redesign

---

## Update Process Workflow

### Step 1: Update Version Numbers

**Edit `app.json`:**
```json
{
  "expo": {
    "version": "1.1.0",  // ← Update this
    "android": {
      "versionCode": 2,  // ← Increment this (MUST increase)
      "package": "com.yourname.ojttracker"
    }
  }
}
```

**Edit `package.json`:**
```json
{
  "name": "ojt-tracker-mobile",
  "version": "1.1.0",  // ← Update this
  ...
}
```

---

### Step 2: Rebuild Your APK

```bash
# Clean install dependencies
npm install

# Build with EAS
eas build --platform android --profile production

# Or for testing
eas build --platform android --profile preview
```

---

### Step 3: Download New APK

```bash
# Download from EAS dashboard
# https://expo.dev/accounts/[your-account]/projects/ojt-tracker-mobile/builds

# Rename downloaded APK
# Example: OJT-Tracker-v1.1.0-release.apk
```

---

### Step 4: Commit Code Changes

```bash
# Add changes
git add .

# Commit with descriptive message
git commit -m "Release v1.1.0: Added calendar view and export to PDF"

# Tag the commit
git tag -a v1.1.0 -m "Version 1.1.0"

# Push to GitHub
git push origin main
git push origin v1.1.0
```

---

### Step 5: Create New GitHub Release

**Using GitHub Website:**

1. Go to **Releases** → **"Draft a new release"**
2. **Tag:** `v1.1.0`
3. **Title:** `OJT Tracker v1.1.0 - Calendar View & PDF Export`
4. **Description:**
   ```markdown
   ## 🚀 What's New in v1.1.0
   
   ### ✨ New Features
   - 📅 Calendar view for logs
   - 📄 Export reports to PDF
   - 🔔 Enhanced notifications
   
   ### 🐛 Bug Fixes
   - Fixed timer synchronization issue
   - Resolved offline mode crashes
   - Improved photo upload reliability
   
   ### 📥 Download
   Download `OJT-Tracker-v1.1.0-release.apk` below to update.
   
   ### ⚠️ Important Notes
   - This update requires Android 6.0 or higher
   - Offline data will be preserved during update
   - No need to uninstall previous version
   
   ### 📊 Changes Since v1.0.0
   - [View full changelog](https://github.com/YOUR_USERNAME/ojt-tracker-mobile/compare/v1.0.0...v1.1.0)
   ```
5. Upload `OJT-Tracker-v1.1.0-release.apk`
6. **Publish release**

**Using GitHub CLI:**
```bash
gh release create v1.1.0 \
  path/to/OJT-Tracker-v1.1.0-release.apk \
  --title "OJT Tracker v1.1.0 - Calendar View & PDF Export" \
  --notes-file CHANGELOG.md
```

---

# Part 4: Best Practices

## 🗂️ Project Structure

```
your-project/
├── .github/
│   └── workflows/          # CI/CD (optional)
├── app/                    # Your app code
├── assets/                 # Images, fonts
├── releases/              # Local APK storage (gitignored)
│   ├── v1.0.0/
│   │   └── OJT-Tracker-v1.0.0-release.apk
│   └── v1.1.0/
│       └── OJT-Tracker-v1.1.0-release.apk
├── .gitignore
├── README.md
├── CHANGELOG.md           # Track changes
└── package.json
```

---

## 📝 Maintain a CHANGELOG

**Create `CHANGELOG.md`:**
```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-01-15

### Added
- Calendar view for logs
- PDF export functionality
- Enhanced notifications

### Fixed
- Timer synchronization issues
- Offline mode crashes
- Photo upload reliability

### Changed
- Improved UI performance
- Updated icons

## [1.0.0] - 2024-12-13

### Added
- Initial release
- Time tracking
- Daily reports
- User profiles
```

---

## 📢 Release Checklist

Before each release:

```markdown
### Pre-Release Checklist

- [ ] Version numbers updated (app.json, package.json)
- [ ] CHANGELOG.md updated
- [ ] All tests passing
- [ ] No console.logs in production code
- [ ] Environment variables configured
- [ ] APK tested on physical device
- [ ] Release notes written
- [ ] Git tag created
- [ ] Code pushed to GitHub
- [ ] GitHub Release created
- [ ] APK uploaded to release
- [ ] Download link tested
- [ ] Installation tested on clean device
```

---

## 🔐 Security Best Practices

### 1. Never Commit Sensitive Data

**Always in `.gitignore`:**
```gitignore
# Sensitive
.env
.env.*
*.keystore
*.jks

# Build outputs
*.apk
*.aab
releases/
builds/

# Dependencies
node_modules/
```

### 2. Use GitHub Secrets for CI/CD

If using GitHub Actions:
```yaml
# .github/workflows/build.yml
env:
  EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

## 📊 Track Download Statistics

GitHub automatically tracks:
- Total downloads per release
- Downloads per asset
- Release views

**View stats:**
```
https://github.com/YOUR_USERNAME/ojt-tracker-mobile/releases
```

---

## 🔄 Update Notification System

### Option 1: Manual Check in App

**Create a version check:**
```typescript
// utils/version-check.ts
const GITHUB_RELEASES_API = 
  'https://api.github.com/repos/YOUR_USERNAME/ojt-tracker-mobile/releases/latest';

export async function checkForUpdates() {
  try {
    const response = await fetch(GITHUB_RELEASES_API);
    const data = await response.json();
    const latestVersion = data.tag_name; // e.g., "v1.1.0"
    const currentVersion = "v1.0.0"; // From app.json
    
    if (latestVersion !== currentVersion) {
      return {
        hasUpdate: true,
        latestVersion,
        downloadUrl: data.assets[0].browser_download_url
      };
    }
    return { hasUpdate: false };
  } catch (error) {
    console.error('Version check failed:', error);
    return { hasUpdate: false };
  }
}
```

### Option 2: Use EAS Update (Recommended)

For over-the-air updates without new APK:
```bash
# Install
npm install -g eas-cli

# Configure
eas update:configure

# Push update
eas update --branch production --message "Fixed login bug"
```

---

## 🌐 Create a Download Landing Page

**Create `DOWNLOAD.md` or add to README:**

```markdown
# 📥 Download OJT Tracker

## Latest Version: v1.1.0

### For Android
- [Download APK v1.1.0](https://github.com/YOUR_USERNAME/ojt-tracker-mobile/releases/download/v1.1.0/OJT-Tracker-v1.1.0-release.apk)
- **File size:** 45 MB
- **Requires:** Android 6.0+

### Installation Instructions

1. **Download** the APK file above
2. **Enable** "Install from Unknown Sources":
   - Go to Settings → Security
   - Enable "Unknown Sources" or "Install Unknown Apps"
3. **Open** the downloaded APK file
4. **Tap** "Install"
5. **Launch** the app

### Need Help?
- [Report an issue](https://github.com/YOUR_USERNAME/ojt-tracker-mobile/issues)
- [View documentation](https://github.com/YOUR_USERNAME/ojt-tracker-mobile/wiki)

### Previous Versions
- [v1.0.0](https://github.com/YOUR_USERNAME/ojt-tracker-mobile/releases/tag/v1.0.0)
```

---

# Part 5: Quick Reference Commands

## Common Git Commands

```bash
# Check status
git status

# Stage all changes
git add .

# Commit changes
git commit -m "Description of changes"

# Create version tag
git tag -a v1.1.0 -m "Version 1.1.0"

# Push code
git push origin main

# Push tags
git push origin --tags

# View all tags
git tag -l
```

## Common GitHub CLI Commands

```bash
# Create release with APK
gh release create v1.1.0 APK_FILE.apk --title "Title" --notes "Description"

# List releases
gh release list

# View release details
gh release view v1.1.0

# Delete release
gh release delete v1.1.0

# Upload additional asset to existing release
gh release upload v1.1.0 additional-file.apk
```

## Common EAS Commands

```bash
# Build APK
eas build --platform android --profile production

# Check build status
eas build:list

# Download latest build
eas build:download --platform android --latest

# View project info
eas project:info
```

---

# Part 6: Automation (Advanced)

## GitHub Actions for Automated Releases

**Create `.github/workflows/release.yml`:**

```yaml
name: Release APK

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build APK
        run: eas build --platform android --non-interactive --no-wait
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

---

# Part 7: Troubleshooting

## Common Issues

### ❌ "File too large" when uploading APK

**Solution:**
- GitHub has a 2GB file limit for releases
- If APK > 2GB, use GitHub Large File Storage (LFS)
- Or host on alternative platforms (Google Drive, Dropbox)

### ❌ Users can't install APK

**Solutions:**
1. Enable "Unknown Sources" in Android settings
2. Check APK is not corrupted (re-download)
3. Ensure Android version compatibility
4. Check if device has sufficient storage

### ❌ "Tag already exists"

**Solution:**
```bash
# Delete local tag
git tag -d v1.1.0

# Delete remote tag
git push origin --delete v1.1.0

# Create new tag
git tag -a v1.1.0 -m "Version 1.1.0"
git push origin v1.1.0
```

### ❌ Can't push to GitHub

**Solutions:**
```bash
# Check remote URL
git remote -v

# Update remote URL if needed
git remote set-url origin https://github.com/YOUR_USERNAME/ojt-tracker-mobile.git

# Use personal access token instead of password
# Generate at: https://github.com/settings/tokens
```

---

# Summary

## Your Complete Workflow

1. **Make changes** to your app code
2. **Update version** in app.json and package.json
3. **Commit changes** with descriptive message
4. **Build APK** using EAS Build
5. **Create git tag** for the version
6. **Push code and tags** to GitHub
7. **Create GitHub Release** with APK attached
8. **Test download and installation**
9. **Notify users** of new version

## Key Points to Remember

✅ **Never commit APK files to git**  
✅ **Always increment versionCode for Android**  
✅ **Use semantic versioning (MAJOR.MINOR.PATCH)**  
✅ **Write clear release notes**  
✅ **Test APK before publishing**  
✅ **Keep CHANGELOG.md updated**  
✅ **Tag commits with version numbers**  

---

## Need More Help?

- 📖 [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
- 📱 [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- 🔧 [Git Documentation](https://git-scm.com/doc)
- 💬 [GitHub Community](https://github.community/)

---

**Happy Releasing! 🚀**
