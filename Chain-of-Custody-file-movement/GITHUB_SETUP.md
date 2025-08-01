# 🚀 GitHub Setup Instructions

Follow these steps to add your Chain of Custody system to GitHub.

## 📋 **Prerequisites**

1. **Git installed** on your computer
2. **GitHub account** (username: yashikart)
3. **Command line access** (PowerShell/Terminal)

## 🔧 **Step 1: Initialize Git Repository**

Open PowerShell in your project directory and run:

```powershell
# Navigate to your project directory
cd C:\Users\Yashika\Chain-of-Custody-file-movement

# Initialize Git repository
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: Complete Chain of Custody file movement system

Features:
- Legal-grade chain of custody tracking
- Forensic hash verification (MD5, SHA1, SHA256, SHA512)
- React web interface with drag & drop upload
- Professional CSV/XML reporting
- IPFS-like distributed storage simulation
- Complete audit trails
- Postman testing collection
- Cross-platform hash generation utilities
- Court-ready documentation"
```

## 🌐 **Step 2: Create GitHub Repository**

### Option A: Using GitHub Website (Recommended)

1. **Go to GitHub:** https://github.com
2. **Sign in** with username: yashikart
3. **Click "New repository"** (green button)
4. **Repository settings:**
   - **Repository name:** `Chain-of-Custody-file-movement`
   - **Description:** `Legal-grade chain of custody tracking system for digital evidence and sensitive documents`
   - **Visibility:** Public (or Private if you prefer)
   - **Initialize:** Leave unchecked (we already have files)
5. **Click "Create repository"**

### Option B: Using GitHub CLI (if installed)

```powershell
# Create repository using GitHub CLI
gh repo create Chain-of-Custody-file-movement --public --description "Legal-grade chain of custody tracking system for digital evidence and sensitive documents"
```

## 🔗 **Step 3: Connect Local Repository to GitHub**

```powershell
# Add GitHub remote
git remote add origin https://github.com/yashikart/Chain-of-Custody-file-movement.git

# Verify remote was added
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

## 📝 **Step 4: Verify Upload**

1. **Visit your repository:** https://github.com/yashikart/Chain-of-Custody-file-movement
2. **Check that all files are uploaded**
3. **Verify README displays correctly**

## 🏷️ **Step 5: Create First Release (Optional)**

```powershell
# Create and push a tag for v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0: Complete Chain of Custody System

Features:
- Full chain of custody tracking
- Multi-algorithm hash verification
- React web interface
- CSV/XML export capabilities
- IPFS simulation
- Comprehensive documentation
- Postman testing suite"

git push origin v1.0.0
```

Then on GitHub:
1. **Go to "Releases"** tab
2. **Click "Create a new release"**
3. **Select tag:** v1.0.0
4. **Release title:** "Chain of Custody System v1.0.0"
5. **Describe the release** and click "Publish release"

## 🔧 **Step 6: Set Up Repository Settings**

### Topics (for discoverability)
Add these topics to your repository:
- `chain-of-custody`
- `digital-forensics`
- `file-tracking`
- `hash-verification`
- `legal-tech`
- `evidence-management`
- `nodejs`
- `react`
- `security`
- `compliance`

### Branch Protection (Optional)
1. **Go to Settings > Branches**
2. **Add rule for main branch**
3. **Enable:** "Require pull request reviews"

## 📊 **Step 7: Add Repository Badges**

Your README already includes badges for:
- ✅ MIT License
- ✅ Node.js version
- ✅ React version

## 🎯 **Step 8: Future Updates**

For future changes:

```powershell
# Make your changes, then:
git add .
git commit -m "Description of changes"
git push origin main
```

## 🔍 **Troubleshooting**

### Authentication Issues
If you get authentication errors:

```powershell
# Use personal access token instead of password
# Go to GitHub Settings > Developer settings > Personal access tokens
# Generate new token with repo permissions
```

### Large Files
If you have large files:

```powershell
# Check file sizes
git ls-files | xargs ls -la

# Use Git LFS for files > 100MB
git lfs track "*.large-extension"
```

### Permission Denied
```powershell
# Check remote URL
git remote get-url origin

# Update if needed
git remote set-url origin https://github.com/yashikart/Chain-of-Custody-file-movement.git
```

## ✅ **Success Checklist**

- [ ] Repository created on GitHub
- [ ] All files uploaded successfully
- [ ] README displays correctly with badges
- [ ] License file present
- [ ] .gitignore working (no sensitive files uploaded)
- [ ] CI/CD pipeline runs successfully
- [ ] Repository topics added
- [ ] First release created (optional)

## 🎉 **You're Done!**

Your Chain of Custody system is now on GitHub at:
**https://github.com/yashikart/Chain-of-Custody-file-movement**

Share this repository with:
- Legal professionals
- Security teams
- Compliance officers
- Digital forensics experts
- Open source community

## 📞 **Need Help?**

If you encounter issues:
1. Check GitHub's documentation
2. Review error messages carefully
3. Ensure all prerequisites are met
4. Try the troubleshooting steps above
