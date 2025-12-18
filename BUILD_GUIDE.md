# 📱 LifeSaver App - APK Build Guide

## 🎯 Quick Start - Build APK

### **Recommended: Preview Build (For Testing)**

```bash
eas build --platform android --profile preview
```

This creates an **APK file** you can directly install on Android devices.

---

## 📋 Detailed Build Steps

### **Step 1: Ensure You're Logged In**

```bash
eas login
# You're already logged in as: bavin
```

### **Step 2: Choose Your Build Type**

#### **Option A: Preview APK (For Testing/Distribution)**
```bash
eas build --platform android --profile preview
```

**Features:**
- ✅ Builds APK file (easy to install)
- ✅ Internal distribution
- ✅ No Google Play Store needed
- ✅ Share directly with testers
- ⏱️ Build time: ~10-15 minutes

#### **Option B: Custom APK Build**
```bash
eas build --platform android --profile apk
```

**Features:**
- ✅ APK with custom configuration
- ✅ Direct install on devices
- ✅ Good for demos and testing

#### **Option C: Production AAB (For Google Play Store)**
```bash
eas build --platform android --profile production
```

**Features:**
- ✅ Creates AAB (Android App Bundle)
- ✅ Required for Google Play Store
- ✅ Auto-increments version
- ✅ Optimized for all devices

### **Step 3: Wait for Build to Complete**

```
Building project...
┌──────────────────────────────────┐
│ Build in progress                │
│ This may take 10-15 minutes      │
│ You can close this terminal      │
└──────────────────────────────────┘

✅ Build successful!
Download: https://expo.dev/accounts/...
```

### **Step 4: Download Your APK**

After build completes:
1. Click the download link provided
2. Or visit: https://expo.dev/builds
3. Download the APK file
4. Install on Android device

---

## 🔧 Build Configuration (Already Set Up)

### **eas.json** ✅
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"  // ✅ Builds APK instead of AAB
      }
    },
    "apk": {
      "android": {
        "buildType": "apk"  // ✅ Custom APK profile
      }
    },
    "production": {
      "autoIncrement": true  // ✅ Auto version bump
    }
  }
}
```

### **app.json** ✅
```json
{
  "android": {
    "package": "com.lifesaver.blooddonation",  // ✅ Unique package name
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE"
    ],
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#DC143C"
    }
  }
}
```

---

## 📦 Alternative: Local Build (If You Have Android Studio)

### **Prerequisites:**
- Android Studio installed
- Android SDK configured
- Java JDK installed

### **Commands:**
```bash
# Install EAS CLI globally (if not already)
npm install -g eas-cli

# Configure local builds
eas build:configure

# Run local build
eas build --platform android --local --profile preview
```

⚠️ **Note:** Local builds require significant setup. Cloud builds (recommended) are much easier!

---

## 🎯 Recommended Build Command

For most use cases, use this:

```bash
eas build --platform android --profile preview
```

### **Why?**
✅ Creates APK (not AAB)
✅ Easy to install on devices
✅ No Play Store required
✅ Perfect for testing and demo
✅ Can share via file transfer

---

## 📲 Installing the APK

### **After Download:**

1. **Transfer to Android device:**
   - USB transfer
   - Email to yourself
   - Cloud storage (Drive, Dropbox)
   - Direct download on phone

2. **Enable "Install Unknown Apps":**
   - Settings → Security
   - Enable "Install from Unknown Sources"
   - Or allow for specific app (Chrome, Files, etc.)

3. **Install APK:**
   - Tap the APK file
   - Click "Install"
   - Open app

---

## 🔍 Check Build Status

### **Online Dashboard:**
Visit: https://expo.dev/accounts/bavin/projects/lifesaver-blood-donation/builds

### **Command Line:**
```bash
eas build:list
```

---

## ⚙️ Build Profiles Explained

| Profile | Build Type | Use Case | Output |
|---------|------------|----------|--------|
| **preview** | APK | Testing, sharing | .apk file |
| **apk** | APK | Custom builds | .apk file |
| **production** | AAB | Play Store | .aab file |
| **development** | Development | Dev/testing | Dev client |

---

## 🚨 Troubleshooting

### **Build Failed?**

1. **Check dependencies:**
```bash
npm install
```

2. **Clear cache:**
```bash
npx expo start --clear
```

3. **Update EAS CLI:**
```bash
npm install -g eas-cli@latest
```

### **Can't Install APK?**

1. Enable "Install from Unknown Sources" on Android
2. Check if you have enough storage
3. Try uninstalling old version first

---

## 📊 Build Size Optimization (Optional)

To reduce APK size, you can enable ProGuard:

```json
// In eas.json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk",
    "gradleCommand": ":app:assembleRelease",
    "enableProguardInReleaseBuilds": true
  }
}
```

---

## 🎉 Quick Reference

**Just want an APK to test?** Run this:
```bash
eas build --platform android --profile preview
```

**Want to publish to Play Store?** Run this:
```bash
eas build --platform android --profile production
```

---

## 📱 Your App Details

- **Name:** LifeSaver - Blood Donation
- **Package:** com.lifesaver.blooddonation
- **Version:** 1.0.0
- **Platform:** Android
- **SDK:** Expo 49

---

Ready to build? Run the preview command to get your APK! 🚀

