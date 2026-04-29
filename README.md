<img width="1254" height="1254" alt="icon" src="https://github.com/user-attachments/assets/4742db46-ea20-48be-910c-97373566c9c8" />

# 🔐 OpenLock

**OpenLock** is a privacy-first browser extension that combines a **Password Manager** and **TOTP (2FA) Authenticator** in one secure, lightweight tool.

> 🧠 Built for users who want full control — no servers, no tracking, everything stored locally.

---

## ✨ Features

* 🔑 **Password Manager**

  * Store and manage credentials securely
  * Quick copy & autofill-ready structure

* 🔐 **TOTP Generator (2FA)**

  * Generate 6-digit codes for services like GitHub, Google, etc.
  * Built-in countdown timer

* 🔒 **Client-Side Encryption**

  * All data encrypted using Web Crypto API (AES-GCM)
  * Master password protection

* 💾 **Local-First Storage**

  * Everything stored on your device (`chrome.storage.local`)
  * No backend, no cloud, no data collection

* 🔄 **Manual Sync (Secure Backup)**

  * Export encrypted vault as a file
  * Import on another device anytime

---

## 🧩 Why OpenLock?

Most tools rely on cloud sync and servers.
OpenLock takes a different approach:

* ✅ Full privacy (your data never leaves your device)
* ✅ No accounts required
* ✅ No risk of server breaches
* ✅ Works completely offline

---

## 🚀 Installation

### Load as Unpacked Extension

1. Download or clone this repository
2. Open Chrome and go to:

   ```
   chrome://extensions/
   ```
3. Enable **Developer Mode**
4. Click **Load unpacked**
5. Select the project folder

---

## ⚙️ Usage

### First Setup

* Set a **master password**
* This is used to encrypt and unlock your vault

### Add Password

* Go to **Passwords tab**
* Click **+ Add**
* Save credentials securely

### Add TOTP

* Go to **TOTP tab**
* Add your secret key (from QR or manual entry)
* Codes refresh every 30 seconds

---

## 🔄 Backup & Sync (No Server)

OpenLock uses a **client-only sync model**:

### Export Vault

* Go to Settings → Backup
* Download encrypted `.json` file

### Import Vault

* Upload your backup file
* Enter master password to decrypt

> 💡 Tip: Store your backup in your own cloud (Google Drive, Dropbox, USB)

---

## 🔐 Security Model

* AES-GCM encryption
* PBKDF2 key derivation
* Unique IV per encryption
* No plaintext storage
* No master password storage

> ⚠️ If you lose your master password, your data cannot be recovered.

##

---

## 🛣️ Roadmap

* [ ] Autofill support
* [ ] PIN / auto-lock system
* [ ] Better import (QR scanning)
* [ ] UI/UX improvements
* [ ] Optional local backup reminders

---

## 🤝 Contributing

Contributions, ideas, and feedback are welcome!
Feel free to open an issue or submit a pull request.

---

## 🔥 Vision

OpenLock is built on one idea:

> **Security tools should not require trust in a server — only trust in code.**
