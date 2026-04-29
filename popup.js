// ============ OpenLock - COMBINED EXTENSION ============
// Password Generator + Vault + TOTP Authenticator + Autofill

// ========== INITIALIZATION & UTILITIES ==========

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (msg) toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ========== PASSWORD GENERATOR MODULE ==========

// Character Sets
const charSets = {
    all: {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+~|}{[]:;?><,./-='
    },
    read: {
        upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
        lower: 'abcdefghijkmnopqrstuvwxyz',
        numbers: '23456789',
        symbols: '!@#$%^&*_+~?-='
    }
};

const syllables = [
    'ba', 'be', 'bi', 'bo', 'bu', 'by', 'ca', 'ce', 'ci', 'co', 'cu', 'cy',
    'da', 'de', 'di', 'do', 'du', 'dy', 'fa', 'fe', 'fi', 'fo', 'fu', 'fy',
    'ga', 'ge', 'gi', 'go', 'gu', 'gy', 'ha', 'he', 'hi', 'ho', 'hu', 'hy',
    'ja', 'je', 'ji', 'jo', 'ju', 'jy', 'ka', 'ke', 'ki', 'ko', 'ku', 'ky',
    'la', 'le', 'li', 'lo', 'lu', 'ly', 'ma', 'me', 'mi', 'mo', 'mu', 'my',
    'na', 'ne', 'ni', 'no', 'nu', 'ny', 'pa', 'pe', 'pi', 'po', 'pu', 'py',
    'ra', 're', 'ri', 'ro', 'ru', 'ry', 'sa', 'se', 'si', 'so', 'su', 'sy',
    'ta', 'te', 'ti', 'to', 'tu', 'ty', 'va', 've', 'vi', 'vo', 'vu', 'vy',
    'wa', 'we', 'wi', 'wo', 'wu', 'wy', 'ya', 'ye', 'yi', 'yo', 'yu',
    'za', 'ze', 'zi', 'zo', 'zu', 'zy'
];

const presets = {
    custom: null,
    gmail: { length: 16, type: 'all', upper: true, lower: true, numbers: true, symbols: true },
    wifi: { length: 20, type: 'read', upper: true, lower: true, numbers: true, symbols: false },
    apple: { length: 16, type: 'all', upper: true, lower: true, numbers: true, symbols: false },
    crypto: { length: 32, type: 'all', upper: true, lower: true, numbers: true, symbols: true },
    pin: { length: 6, type: 'all', upper: false, lower: false, numbers: true, symbols: false }
};

let currentType = 'all';

// DOM Elements for Generator
const passwordText = document.getElementById('passwordText');
const copyBtn = document.getElementById('copyBtn');
const lengthSlider = document.getElementById('lengthSlider');
const lengthValue = document.getElementById('lengthValue');
const generateBtn = document.getElementById('generateBtn');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.getElementById('strengthText');
const entropyText = document.getElementById('entropyText');
const saveBtn = document.getElementById('saveBtn');
const toggleVisibilityBtn = document.getElementById('toggleVisibilityBtn');
const chkUpper = document.getElementById('chkUpper');
const chkLower = document.getElementById('chkLower');
const chkNumbers = document.getElementById('chkNumbers');
const chkSymbols = document.getElementById('chkSymbols');
const typeRadios = document.getElementsByName('pwdType');
const presetBtns = document.querySelectorAll('.preset-btn');

function getSecureRandomValue(max) {
    if (max <= 0) return 0;
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
}

function getRandomChar(str) {
    if (!str.length) return '';
    return str.charAt(getSecureRandomValue(str.length));
}

function shuffleString(str) {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = getSecureRandomValue(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

function generateStandard(length, type) {
    const useUpper = chkUpper.checked;
    const useLower = chkLower.checked;
    const useNumbers = chkNumbers.checked;
    const useSymbols = chkSymbols.checked;

    if (!useUpper && !useLower && !useNumbers && !useSymbols) return '';

    let allowedChars = '';
    const sets = charSets[type];
    let result = '';

    if (useUpper) { allowedChars += sets.upper; result += getRandomChar(sets.upper); }
    if (useLower) { allowedChars += sets.lower; result += getRandomChar(sets.lower); }
    if (useNumbers) { allowedChars += sets.numbers; result += getRandomChar(sets.numbers); }
    if (useSymbols) { allowedChars += sets.symbols; result += getRandomChar(sets.symbols); }

    for (let i = result.length; i < length; i++) {
        result += getRandomChar(allowedChars);
    }
    return shuffleString(result);
}

function generatePronounceable(length) {
    const useUpper = chkUpper.checked;
    const useLower = chkLower.checked;
    if (!useUpper && !useLower) return '';

    let result = '';
    while (result.length < length) {
        let syl = syllables[getSecureRandomValue(syllables.length)];
        if (useUpper && !useLower) {
            syl = syl.toUpperCase();
        } else if (useUpper && useLower) {
            if (getSecureRandomValue(2) === 1) {
                syl = syl.charAt(0).toUpperCase() + syl.slice(1);
            }
        }
        result += syl;
    }
    return result.substring(0, length);
}

function generatePassword() {
    const length = parseInt(lengthSlider.value);
    let password = '';

    if (currentType === 'say') {
        password = generatePronounceable(length);
    } else {
        password = generateStandard(length, currentType);
    }

    if (!password || password.length === 0) {
        password = 'Select an option!';
        passwordText.value = password;
        if (entropyText) entropyText.textContent = '';
        updateStrength(0);
        return;
    }

    passwordText.value = password;
    calculateStrength(password);
}

function calculateEntropy(password, type) {
    if (!password) return 0;

    let poolSize = 0;
    if (type === 'say') {
        const syllablesCount = Math.max(1, Math.round(password.length / 2));
        return syllablesCount * Math.log2(syllables.length);
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^A-Za-z0-9]/.test(password);

    if (hasUpper) poolSize += 26;
    if (hasLower) poolSize += 26;
    if (hasNumbers) poolSize += 10;
    if (hasSymbols) poolSize += 32;

    if (type === 'read') {
        if (hasUpper) poolSize -= 2;
        if (hasLower) poolSize -= 1;
        if (hasNumbers) poolSize -= 2;
        if (hasSymbols) poolSize -= 18;
    }

    if (poolSize === 0) return 0;
    return password.length * Math.log2(poolSize);
}

function calculateStrength(password) {
    if (!password) {
        updateStrength(0);
        if (entropyText) entropyText.textContent = '';
        return;
    }
    const entropy = Math.round(calculateEntropy(password, currentType));
    if (entropyText) entropyText.textContent = `~${entropy} bits`;

    const score = Math.max(0, Math.min(100, (entropy / 90) * 100));
    updateStrength(score, entropy);
}

function updateStrength(score, entropy = 0) {
    let color = '';
    let text = '';
    let width = Math.min(100, score) + '%';

    if (score === 0) {
        color = 'transparent';
        text = '';
        width = '0%';
    } else if (entropy < 40) {
        color = 'var(--danger)';
        text = 'Weak';
    } else if (entropy < 70) {
        color = 'var(--warning)';
        text = 'Medium';
    } else {
        color = 'var(--success)';
        text = 'Strong';
    }

    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
    strengthText.style.color = color;
}

function updateCheckboxState() {
    const isSay = currentType === 'say';
    chkNumbers.disabled = isSay;
    chkSymbols.disabled = isSay;
    chkNumbers.parentElement.classList.toggle('disabled', isSay);
    chkSymbols.parentElement.classList.toggle('disabled', isSay);

    if (isSay) {
        chkNumbers.checked = false;
        chkSymbols.checked = false;
        if (!chkUpper.checked && !chkLower.checked) {
            chkLower.checked = true;
        }
    }
}

function setCustomPreset() {
    presetBtns.forEach(b => b.classList.remove('active'));
    const customBtn = document.querySelector('.preset-btn[data-preset="custom"]');
    if (customBtn) customBtn.classList.add('active');
}

function togglePasswordVisibility(inputEl, btnEl) {
    if (inputEl.type === 'password') {
        inputEl.type = 'text';
    } else {
        inputEl.type = 'password';
    }
}

// Password Generator Event Listeners
generateBtn.addEventListener('click', generatePassword);

lengthSlider.addEventListener('input', (e) => {
    lengthValue.textContent = e.target.value;
    setCustomPreset();
    generatePassword();
});

typeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentType = e.target.value;
        updateCheckboxState();
        setCustomPreset();
        generatePassword();
    });
});

[chkUpper, chkLower, chkNumbers, chkSymbols].forEach(chk => {
    chk.addEventListener('change', () => {
        setCustomPreset();
        generatePassword();
    });
});

presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        presetBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const presetKey = e.target.getAttribute('data-preset');
        if (presetKey !== 'custom') {
            const config = presets[presetKey];
            lengthSlider.value = config.length;
            lengthValue.textContent = config.length;

            document.querySelector(`input[name="pwdType"][value="${config.type}"]`).checked = true;
            currentType = config.type;

            chkUpper.checked = config.upper;
            chkLower.checked = config.lower;
            chkNumbers.checked = config.numbers;
            chkSymbols.checked = config.symbols;

            updateCheckboxState();
            generatePassword();
        }
    });
});

copyBtn.addEventListener('click', () => {
    if (!passwordText.value) return;
    navigator.clipboard.writeText(passwordText.value).then(() => {
        copyBtn.classList.add('copied');
        showToast("Password Copied!");
        setTimeout(() => copyBtn.classList.remove('copied'), 2000);
    });
});

if (toggleVisibilityBtn) {
    toggleVisibilityBtn.addEventListener('click', () => {
        togglePasswordVisibility(passwordText, toggleVisibilityBtn);
    });
}

passwordText.addEventListener('input', (e) => {
    calculateStrength(e.target.value);
});

// ========== VAULT MODULE ==========

let vaultKey = null;
let decryptedVault = [];
let pendingSaveMode = false;

const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes auto-lock timeout
let autoLockTimer = null;

// Auto-lock functions
function resetAutoLockTimer() {
    if (autoLockTimer) clearTimeout(autoLockTimer);
    if (vaultKey) {
        autoLockTimer = setTimeout(() => {
            lockVault();
            showToast("Vault auto-locked due to inactivity");
        }, AUTO_LOCK_MS);
    }
}

function lockVault() {
    vaultKey = null;
    decryptedVault = [];
    if (autoLockTimer) {
        clearTimeout(autoLockTimer);
        autoLockTimer = null;
    }
    vaultModal.style.display = 'none';
    vaultLocked.style.display = 'block';
}

// Activity event listeners to reset auto-lock timer
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(evt => {
    document.addEventListener(evt, resetAutoLockTimer, true);
});

const openVaultBtn = document.getElementById('openVaultBtn');
const loginModal = document.getElementById('loginModal');
const masterPasswordInput = document.getElementById('masterPasswordInput');
const toggleMasterVisibilityBtn = document.getElementById('toggleMasterVisibilityBtn');
const unlockVaultBtn = document.getElementById('unlockVaultBtn');
const cancelLoginBtn = document.getElementById('cancelLoginBtn');
const saveConfirmModal = document.getElementById('saveConfirmModal');
const saveNameInput = document.getElementById('saveNameInput');
const confirmSaveBtn = document.getElementById('confirmSaveBtn');
const cancelSaveBtn = document.getElementById('cancelSaveBtn');
const vaultModal = document.getElementById('vaultUnlocked');
const vaultLocked = document.getElementById('vaultLocked');
const vaultList = document.getElementById('vaultList');
const lockVaultBtn = document.getElementById('lockVaultBtn');

// Generate random salt for vault encryption
async function generateSalt() {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    return btoa(String.fromCharCode(...salt));
}

// Get or create vault salt
async function getVaultSalt() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['vault_salt'], async (result) => {
            if (result.vault_salt) {
                resolve(result.vault_salt);
            } else {
                const newSalt = await generateSalt();
                chrome.storage.local.set({ vault_salt: newSalt });
                resolve(newSalt);
            }
        });
    });
}

async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode(salt),
            iterations: 200000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

async function encryptData(text, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(text)
    );

    const ivStr = btoa(String.fromCharCode(...iv));
    const cipherStr = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    return { iv: ivStr, data: cipherStr };
}

async function decryptData(encryptedObj, key) {
    try {
        const iv = new Uint8Array(atob(encryptedObj.iv).split('').map(c => c.charCodeAt(0)));
        const data = new Uint8Array(atob(encryptedObj.data).split('').map(c => c.charCodeAt(0)));

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
        );
        const dec = new TextDecoder();
        return dec.decode(decrypted);
    } catch (e) {
        return null;
    }
}

async function saveVaultToStorage() {
    if (!vaultKey) return;
    const testEnc = await encryptData("vault-ok", vaultKey);
    const recordsEnc = await encryptData(JSON.stringify(decryptedVault), vaultKey);

    chrome.storage.local.set({
        enc_vault: JSON.stringify({
            test: testEnc,
            records: recordsEnc
        })
    });
}

function openModal(modal) {
    modal.style.display = 'flex';
}

function closeModals() {
    loginModal.style.display = 'none';
    saveConfirmModal.style.display = 'none';
    masterPasswordModal.style.display = 'none';
    ['settingsModal', 'changePasswordModal'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

// Sanitize text to prevent XSS
function sanitizeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderVaultItems() {
    vaultList.innerHTML = '';

    if (decryptedVault.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'vault-empty';
        emptyDiv.textContent = 'Your vault is empty. Generate and save passwords here!';
        vaultList.appendChild(emptyDiv);
    } else {
        decryptedVault.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'vault-item';
            div.dataset.id = item.id;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'vault-item-info';
            
            const nameEl = document.createElement('strong');
            nameEl.textContent = sanitizeHTML(item.name);
            
            const dateEl = document.createElement('small');
            dateEl.textContent = item.date || 'Unknown date';
            
            infoDiv.appendChild(nameEl);
            infoDiv.appendChild(dateEl);

            const btnDiv = document.createElement('div');
            btnDiv.className = 'vault-item-actions';

            const copyBtn = document.createElement('button');
            copyBtn.className = 'icon-btn';
            copyBtn.title = 'Copy Password';
            copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(item.password);
                copyBtn.classList.add('copied');
                showToast("Password Copied!");
                setTimeout(() => copyBtn.classList.remove('copied'), 1500);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'icon-btn danger';
            deleteBtn.title = 'Delete';
            deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
            deleteBtn.addEventListener('click', async () => {
                if (confirm("Delete this password? This cannot be undone.")) {
                    decryptedVault = decryptedVault.filter(i => i.id !== item.id);
                    await saveVaultToStorage();
                    renderVaultItems();
                    showToast("Password deleted");
                }
            });

            btnDiv.appendChild(copyBtn);
            btnDiv.appendChild(deleteBtn);
            div.appendChild(infoDiv);
            div.appendChild(btnDiv);
            vaultList.appendChild(div);
        });
    }
}

unlockVaultBtn.addEventListener('click', async () => {
    const pwd = masterPasswordInput.value;
    if (!pwd) return;

    const salt = await getVaultSalt();
    const key = await deriveKey(pwd, salt);

    chrome.storage.local.get(['enc_vault'], async (result) => {
        const vaultDataStr = result.enc_vault;

        if (!vaultDataStr) {
            vaultKey = key;
            decryptedVault = [];
            closeModals();
            if (pendingSaveMode) {
                pendingSaveMode = false;
                openModal(saveConfirmModal);
            } else {
                vaultLocked.style.display = 'none';
                vaultModal.style.display = 'block';
            }
            showToast("Vault initialized!");
            return;
        }

        try {
            const vaultData = JSON.parse(vaultDataStr);
            const testStr = await decryptData(vaultData.test, key);
            if (testStr !== 'vault-ok') throw new Error("Wrong password");

            vaultKey = key;
            const recordsStr = await decryptData(vaultData.records, key);
            decryptedVault = JSON.parse(recordsStr);

            masterPasswordInput.value = '';
            closeModals();
            if (pendingSaveMode) {
                pendingSaveMode = false;
                openModal(saveConfirmModal);
            } else {
                renderVaultItems();
                vaultLocked.style.display = 'none';
                vaultModal.style.display = 'block';
            }
            showToast("Vault Unlocked");
        } catch (e) {
            showToast("Incorrect Master Password!");
        }
    });
});

openVaultBtn.addEventListener('click', () => {
    if (!vaultKey) {
        masterPasswordInput.value = '';
        openModal(loginModal);
    } else {
        renderVaultItems();
        vaultLocked.style.display = 'none';
        vaultModal.style.display = 'block';
    }
});

saveBtn.addEventListener('click', () => {
    if (!passwordText.value) return;

    if (!vaultKey) {
        masterPasswordInput.value = '';
        openModal(loginModal);
        pendingSaveMode = true;
    } else {
        openModal(saveConfirmModal);
    }
});

confirmSaveBtn.addEventListener('click', async () => {
    const name = saveNameInput.value.trim() || 'Untitled';
    const pwd = passwordText.value;

    decryptedVault.push({
        id: Date.now().toString(),
        name,
        password: pwd,
        date: new Date().toLocaleDateString()
    });

    await saveVaultToStorage();
    closeModals();
    saveNameInput.value = '';
    showToast(`Saved to Vault!`);

    saveBtn.classList.add('saved');
    setTimeout(() => saveBtn.classList.remove('saved'), 2000);
});

cancelLoginBtn.addEventListener('click', closeModals);
cancelSaveBtn.addEventListener('click', closeModals);
lockVaultBtn.addEventListener('click', () => {
    vaultKey = null;
    decryptedVault = [];
    vaultModal.style.display = 'none';
    vaultLocked.style.display = 'block';
    showToast("Vault locked");
});

if (toggleMasterVisibilityBtn) {
    toggleMasterVisibilityBtn.addEventListener('click', () => {
        togglePasswordVisibility(masterPasswordInput, toggleMasterVisibilityBtn);
    });
}

// ========== TOTP AUTHENTICATOR MODULE ==========

// TOTP Core Functions
function base32ToUint8Array(base32) {
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    for (let i = 0; i < base32.length; i++) {
        const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
        if (val === -1) continue;
        bits += val.toString(2).padStart(5, '0');
    }
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(bits.substring(i * 8, i * 8 + 8), 2);
    }
    return bytes;
}

async function generateTOTP(secret) {
    try {
        const keyBytes = base32ToUint8Array(secret);
        const epoch = Math.floor(Date.now() / 1000);
        const timeStep = Math.floor(epoch / 30);

        const timeBuffer = new ArrayBuffer(8);
        const timeView = new DataView(timeBuffer);
        timeView.setUint32(0, 0, false);
        timeView.setUint32(4, timeStep, false);

        const key = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'HMAC', hash: 'SHA-1' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', key, timeBuffer);
        const view = new DataView(signature);
        const offset = view.getUint8(19) & 0x0f;
        const p = view.getUint32(offset, false) & 0x7fffffff;

        const otp = (p % 1000000).toString().padStart(6, '0');
        return otp.substring(0, 3) + ' ' + otp.substring(3);
    } catch (e) {
        return "------";
    }
}

// TOTP State
let otpAccounts = [];
let lastTimeStep = 0;

// OTP DOM Elements
const accountsList = document.getElementById('accounts-list');
const addBtn = document.getElementById('add-btn');
const addModal = document.getElementById('add-modal');
const cancelBtn = document.getElementById('cancel-btn');
const addForm = document.getElementById('add-form');
const progressBar = document.getElementById('progress-bar');
const startScanBtn = document.getElementById('start-scan-btn');
const stopScanBtn = document.getElementById('stop-scan-btn');
const readerContainer = document.getElementById('reader-container');
const uploadScanBtn = document.getElementById('upload-scan-btn');
const scanPageBtn = document.getElementById('scan-page-btn');
const qrFileInput = document.getElementById('qr-file-input');

let html5QrcodeScanner = null;

function saveOTPAccounts() {
    chrome.storage.local.set({ open_otp_accounts: otpAccounts });
}

function loadOTPAccounts(callback) {
    chrome.storage.local.get(['open_otp_accounts'], function(result) {
        otpAccounts = result.open_otp_accounts || [];
        callback();
    });
}

async function renderOTPAccounts() {
    if (otpAccounts.length === 0) {
        accountsList.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-secondary);">No accounts yet</div>';
        return;
    }

    accountsList.innerHTML = '';
    for (let i = 0; i < otpAccounts.length; i++) {
        const account = otpAccounts[i];
        const otp = await generateTOTP(account.secret);

        const card = document.createElement('div');
        card.style.cssText = 'padding:1rem; border:1px solid var(--surface-border); border-radius:8px; margin-bottom:0.75rem;';

        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';

        const infoDiv = document.createElement('div');
        const issuerEl = document.createElement('strong');
        issuerEl.textContent = account.issuer;
        const nameEl = document.createElement('small');
        nameEl.style.cssText = 'color:var(--text-secondary);';
        nameEl.textContent = account.name;
        infoDiv.appendChild(issuerEl);
        infoDiv.appendChild(document.createElement('br'));
        infoDiv.appendChild(nameEl);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-btn';
        deleteBtn.title = 'Delete';
        deleteBtn.textContent = '\uD83D\uDDED';
        deleteBtn.addEventListener('click', () => {
            if (confirm("Delete this account?")) {
                otpAccounts.splice(i, 1);
                saveOTPAccounts();
                renderOTPAccounts();
                showToast("Account deleted");
            }
        });

        headerDiv.appendChild(infoDiv);
        headerDiv.appendChild(deleteBtn);

        const otpDiv = document.createElement('div');
        otpDiv.style.cssText = 'font-size:1.5rem; font-weight:bold; letter-spacing:2px; margin-top:0.75rem; text-align:center; font-family:monospace; cursor:pointer;';
        otpDiv.textContent = otp;
        otpDiv.addEventListener('click', () => {
            navigator.clipboard.writeText(otp.replace(/\s/g, ''));
            showToast("OTP Copied!");
        });

        card.appendChild(headerDiv);
        card.appendChild(otpDiv);
        accountsList.appendChild(card);
    }
    updateOTPProgress();
}

function updateOTPProgress() {
    const epoch = Math.floor(Date.now() / 1000);
    const remaining = 30 - (epoch % 30);
    const percentage = (remaining / 30) * 100;
    progressBar.style.width = percentage + '%';

    if (remaining <= 5) {
        progressBar.style.backgroundColor = 'var(--danger)';
    } else {
        progressBar.style.backgroundColor = 'var(--primary)';
    }

    const currentTimeStep = Math.floor(epoch / 30);
    if (currentTimeStep !== lastTimeStep) {
        lastTimeStep = currentTimeStep;
        renderOTPAccounts();
    }
}

function onScanSuccess(decodedText) {
    try {
        const url = new URL(decodedText);
        if (url.protocol !== 'otpauth:') throw new Error('Not an otpauth URI');
        if (url.hostname !== 'totp') throw new Error('Not a TOTP code');

        let path = decodeURIComponent(url.pathname).replace(/^\//, '');
        let issuer = url.searchParams.get('issuer') || '';
        let account = path;

        if (path.includes(':')) {
            const parts = path.split(':');
            if (!issuer) issuer = parts[0];
            account = parts[1].trim();
        }

        const secret = url.searchParams.get('secret');
        if (!secret) throw new Error('No secret found');

        otpAccounts.push({ issuer, name: account, secret: secret.toUpperCase() });
        saveOTPAccounts();
        renderOTPAccounts();

        stopOTPScanner();
        addModal.style.display = 'none';
        showToast('Account added!');
    } catch (e) {
        showToast("Invalid QR code");
    }
}

function startOTPScanner() {
    if (typeof Html5Qrcode === 'undefined') {
        showToast("Scanner library loading...");
        return;
    }
    startScanBtn.style.display = 'none';
    readerContainer.style.display = 'block';
    stopScanBtn.style.display = 'block';

    html5QrcodeScanner = new Html5Qrcode("reader");
    html5QrcodeScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess
    ).catch(err => {
        showToast("Camera access failed");
        stopOTPScanner();
    });
}

function stopOTPScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().catch(e => console.error(e)).finally(() => {
            html5QrcodeScanner.clear();
            html5QrcodeScanner = null;
        });
    }
    startScanBtn.style.display = 'block';
    readerContainer.style.display = 'none';
    stopScanBtn.style.display = 'none';
}

// OTP Event Listeners
addBtn.addEventListener('click', () => {
    addModal.style.display = 'flex';
});

cancelBtn.addEventListener('click', () => {
    addModal.style.display = 'none';
    addForm.reset();
    stopOTPScanner();
});

addForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const issuer = document.getElementById('otp-issuer').value.trim();
    const name = document.getElementById('otp-account').value.trim();
    const secret = document.getElementById('otp-secret').value.replace(/\s+/g, '').toUpperCase();

    const base32Regex = /^[A-Z2-7]+=*$/;
    if (!base32Regex.test(secret)) {
        showToast("Invalid Secret. Must be Base32.");
        return;
    }

    otpAccounts.push({ issuer, name, secret });
    saveOTPAccounts();

    addModal.style.display = 'none';
    addForm.reset();

    renderOTPAccounts();
    showToast("Account added!");
});

startScanBtn.addEventListener('click', startOTPScanner);
stopScanBtn.addEventListener('click', stopOTPScanner);

uploadScanBtn.addEventListener('click', () => {
    if (typeof Html5Qrcode === 'undefined') {
        showToast("Scanner loading...");
        return;
    }
    qrFileInput.click();
});

qrFileInput.addEventListener('change', e => {
    if (e.target.files.length === 0) return;

    const file = e.target.files[0];
    const html5QrCode = new Html5Qrcode("reader");

    html5QrCode.scanFile(file, true)
        .then(decodedText => {
            onScanSuccess(decodedText);
        })
        .catch(err => {
            showToast("No QR code found in image");
        })
        .finally(() => {
            html5QrCode.clear();
            qrFileInput.value = "";
        });
});

scanPageBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
            if (chrome.runtime.lastError) {
                showToast("Error capturing tab");
                return;
            }

            fetch(dataUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "screenshot.png", { type: "image/png" });
                    const html5QrCode = new Html5Qrcode("reader");

                    html5QrCode.scanFile(file, true)
                        .then(decodedText => {
                            onScanSuccess(decodedText);
                        })
                        .catch(err => {
                            showToast("No QR code on page");
                        })
                        .finally(() => {
                            html5QrCode.clear();
                        });
                });
        });
    }
});

// Update OTP progress every second
setInterval(updateOTPProgress, 100);

// ========== TAB NAVIGATION ==========

const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');

        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

// ========== THEME TOGGLE ==========

const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIconSun = document.getElementById('themeIconSun');
const themeIconMoon = document.getElementById('themeIconMoon');
const themeIconAuto = document.getElementById('themeIconAuto');

function updateThemeIcons(theme) {
    if (themeIconSun) themeIconSun.style.display = theme === 'light' ? 'block' : 'none';
    if (themeIconMoon) themeIconMoon.style.display = theme === 'dark' ? 'block' : 'none';
    if (themeIconAuto) themeIconAuto.style.display = theme === 'auto' ? 'block' : 'none';
}

function setTheme(theme) {
    chrome.storage.local.set({ theme: theme });

    let effectiveTheme = theme;
    if (theme === 'auto') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    const html = document.documentElement;
    html.setAttribute('data-theme', effectiveTheme);
    html.style.colorScheme = theme;
    
    updateThemeIcons(theme);
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        chrome.storage.local.get(['theme'], (result) => {
            const current = result.theme || 'auto';
            const themes = ['auto', 'light', 'dark'];
            const next = themes[(themes.indexOf(current) + 1) % themes.length];
            setTheme(next);
        });
    });
}

// Initialize theme on load
function initTheme() {
    chrome.storage.local.get(['theme'], (result) => {
        const savedTheme = result.theme || 'auto';
        setTheme(savedTheme);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

// ========== MASTER PASSWORD & SETTINGS ==========

const settingsBtn = document.getElementById('settingsBtn');
const masterPasswordModal = document.getElementById('masterPasswordModal');
const newMasterPassword = document.getElementById('newMasterPassword');
const confirmMasterPassword = document.getElementById('confirmMasterPassword');
const toggleNewMasterBtn = document.getElementById('toggleNewMasterBtn');
const toggleConfirmMasterBtn = document.getElementById('toggleConfirmMasterBtn');
const createMasterPasswordBtn = document.getElementById('createMasterPasswordBtn');
const cancelMasterPasswordBtn = document.getElementById('cancelMasterPasswordBtn');
const passwordStrengthIndicator = document.getElementById('passwordStrengthIndicator');
const strengthLevel = document.getElementById('strengthLevel');

// Change password modal (now static in HTML)
const changePasswordModal = document.getElementById('changePasswordModal');

function calculatePasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
}

function updatePasswordStrengthDisplay() {
    const pwd = newMasterPassword.value;
    if (!pwd) {
        passwordStrengthIndicator.style.display = 'none';
        return;
    }

    passwordStrengthIndicator.style.display = 'block';
    const strength = calculatePasswordStrength(pwd);
    let level, color;

    if (strength <= 2) {
        level = 'Weak';
        color = '#ef4444';
    } else if (strength <= 4) {
        level = 'Fair';
        color = '#f59e0b';
    } else if (strength <= 5) {
        level = 'Good';
        color = '#3b82f6';
    } else {
        level = 'Strong';
        color = '#22c55e';
    }

    strengthLevel.textContent = level;
    passwordStrengthIndicator.style.background = color + '20';
    passwordStrengthIndicator.style.borderLeft = `3px solid ${color}`;
}

newMasterPassword.addEventListener('input', updatePasswordStrengthDisplay);

toggleNewMasterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    togglePasswordVisibility(newMasterPassword, toggleNewMasterBtn);
});

toggleConfirmMasterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    togglePasswordVisibility(confirmMasterPassword, toggleConfirmMasterBtn);
});

settingsBtn.addEventListener('click', () => {
    // Check if master password exists
    chrome.storage.local.get(['enc_vault'], (result) => {
        if (result.enc_vault) {
            // Vault exists - show settings options
            showSettingsOptions();
        } else {
            // No vault - show create password modal
            newMasterPassword.value = '';
            confirmMasterPassword.value = '';
            passwordStrengthIndicator.style.display = 'none';
            masterPasswordModal.style.display = 'flex';
        }
    });
});

function showSettingsOptions() {
    document.getElementById('settingsModal').style.display = 'flex';
}

function showChangePasswordModal() {
    const changePwdModal = document.getElementById('changePasswordModal');
    document.getElementById('currentPasswordInput').value = '';
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmNewPasswordInput').value = '';
    document.getElementById('changePasswordStrength').style.display = 'none';
    changePwdModal.style.display = 'flex';
}

// === DEAD CODE GUARD: was dynamic creation, now replaced by showChangePasswordModal() above ===
function _obsolete_showChangePasswordModal_dynamicPart() {
    if (false) {
        changePwdModal = document.createElement('div');
        changePwdModal.id = 'changePasswordModal';
        changePwdModal.className = 'modal';
        changePwdModal.style.cssText = 'display:none;';
        changePwdModal.innerHTML = `
            <div class="modal-content">
                <h2>Change Master Password</h2>
                <p class="modal-subtitle">Enter your current password first</p>
                <div class="input-group">
                    <label for="currentPasswordInput">Current Password</label>
                    <input type="password" id="currentPasswordInput" placeholder="Enter current password">
                </div>
                <div class="input-group">
                    <label for="newPasswordInput">New Password</label>
                    <input type="password" id="newPasswordInput" placeholder="Create a strong password">
                </div>
                <div class="input-group">
                    <label for="confirmNewPasswordInput">Confirm New Password</label>
                    <input type="password" id="confirmNewPasswordInput" placeholder="Re-enter password">
                </div>
                <div id="changePasswordStrength" style="display:none; margin-bottom:1rem; padding:0.75rem; border-radius:6px; font-size:0.9rem; font-weight:600;">
                    Password Strength: <span id="changeStrengthLevel">Weak</span>
                </div>
                <div class="modal-actions">
                    <button id="cancelChangePasswordBtn" class="btn-secondary">Cancel</button>
                    <button id="verifyCurrentPasswordBtn" class="btn-primary">Change Password</button>
                </div>
            </div>
        `;
        document.body.appendChild(changePwdModal);

        const newPwdInput = document.getElementById('newPasswordInput');
        const changeStrengthDiv = document.getElementById('changePasswordStrength');
        const changeStrengthLevel = document.getElementById('changeStrengthLevel');

        newPwdInput.addEventListener('input', () => {
            const pwd = newPwdInput.value;
            if (!pwd) {
                changeStrengthDiv.style.display = 'none';
                return;
            }
            changeStrengthDiv.style.display = 'block';
            const strength = calculatePasswordStrength(pwd);
            let level, color;
            if (strength <= 2) {
                level = 'Weak';
                color = '#ef4444';
            } else if (strength <= 4) {
                level = 'Fair';
                color = '#f59e0b';
            } else if (strength <= 5) {
                level = 'Good';
                color = '#3b82f6';
            } else {
                level = 'Strong';
                color = '#22c55e';
            }
            changeStrengthLevel.textContent = level;
            changeStrengthDiv.style.background = color + '20';
            changeStrengthDiv.style.borderLeft = `3px solid ${color}`;
        });

        document.getElementById('verifyCurrentPasswordBtn').addEventListener('click', async () => {
            const currentPwd = document.getElementById('currentPasswordInput').value;
            const newPwd1 = document.getElementById('newPasswordInput').value;
            const newPwd2 = document.getElementById('confirmNewPasswordInput').value;

            if (!currentPwd || !newPwd1 || !newPwd2) {
                showToast('Please fill all fields');
                return;
            }

            if (newPwd1 !== newPwd2) {
                showToast('New passwords do not match!');
                return;
            }

            if (newPwd1.length < 8) {
                showToast('Password must be at least 8 characters');
                return;
            }

            // Verify current password
            const salt = await getVaultSalt();
            const currentKey = await deriveKey(currentPwd, salt);

            chrome.storage.local.get(['enc_vault'], async (result) => {
                try {
                    const vaultData = JSON.parse(result.enc_vault);
                    const testStr = await decryptData(vaultData.test, currentKey);
                    if (testStr !== 'vault-ok') throw new Error("Wrong password");

                    // Current password verified, now change to new password
                    const newSalt = await generateSalt();
                    const newKey = await deriveKey(newPwd1, newSalt);

                    // Re-encrypt vault with new key
                    const recordsStr = await decryptData(vaultData.records, currentKey);
                    const newTestEnc = await encryptData("vault-ok", newKey);
                    const newRecordsEnc = await encryptData(recordsStr, newKey);

                    // Save new salt and encrypted vault
                    chrome.storage.local.set({
                        vault_salt: newSalt,
                        enc_vault: JSON.stringify({
                            test: newTestEnc,
                            records: newRecordsEnc
                        })
                    });

                    vaultKey = newKey;
                    showToast('Master Password Changed!');
                    changePwdModal.style.display = 'none';

                    // Clear inputs
                    document.getElementById('currentPasswordInput').value = '';
                    document.getElementById('newPasswordInput').value = '';
                    document.getElementById('confirmNewPasswordInput').value = '';
                } catch (e) {
                    showToast("Current password is incorrect!");
                }
            });
        });

        document.getElementById('cancelChangePasswordBtn').addEventListener('click', () => {
            changePwdModal.style.display = 'none';
        });
    }
    changePwdModal.style.display = 'flex';
}

cancelMasterPasswordBtn.addEventListener('click', () => {
    masterPasswordModal.style.display = 'none';
});

createMasterPasswordBtn.addEventListener('click', async () => {
    const pwd1 = newMasterPassword.value;
    const pwd2 = confirmMasterPassword.value;

    if (!pwd1 || !pwd2) {
        showToast('Please enter both passwords');
        return;
    }

    if (pwd1 !== pwd2) {
        showToast('Passwords do not match!');
        return;
    }

    if (pwd1.length < 8) {
        showToast('Password must be at least 8 characters');
        return;
    }

    // Generate new salt and create vault
    const salt = await getVaultSalt();
    const key = await deriveKey(pwd1, salt);
    vaultKey = key;
    decryptedVault = [];
    await saveVaultToStorage();

    showToast('Master Password Created!');
    masterPasswordModal.style.display = 'none';
    newMasterPassword.value = '';
    confirmMasterPassword.value = '';
});

// ========== SETTINGS MODAL HANDLERS ==========

const settingsModal = document.getElementById('settingsModal');
const changePasswordOption = document.getElementById('changePasswordOption');
const clearVaultOption = document.getElementById('clearVaultOption');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const cancelChangePasswordBtn = document.getElementById('cancelChangePasswordBtn');
const confirmChangePasswordBtn = document.getElementById('confirmChangePasswordBtn');
const toggleCurrentPasswordBtn = document.getElementById('toggleCurrentPasswordBtn');
const toggleNewPasswordBtn = document.getElementById('toggleNewPasswordBtn');
const toggleConfirmNewPasswordBtn = document.getElementById('toggleConfirmNewPasswordBtn');
const currentPasswordInput = document.getElementById('currentPasswordInput');
const newPasswordInput = document.getElementById('newPasswordInput');
const confirmNewPasswordInput = document.getElementById('confirmNewPasswordInput');
const changePasswordStrength = document.getElementById('changePasswordStrength');
const changeStrengthLevel = document.getElementById('changeStrengthLevel');

if (changePasswordOption) {
    changePasswordOption.addEventListener('click', () => {
        settingsModal.style.display = 'none';
        showChangePasswordModal();
    });
}

if (clearVaultOption) {
    clearVaultOption.addEventListener('click', () => {
        if (confirm('This will delete all passwords in your vault. This action cannot be undone. Continue?')) {
            chrome.storage.local.remove(['enc_vault', 'vault_salt']);
            vaultKey = null;
            decryptedVault = [];
            vaultModal.style.display = 'none';
            vaultLocked.style.display = 'block';
            settingsModal.style.display = 'none';
            showToast('Vault cleared');
        }
    });
}

if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
}

if (cancelChangePasswordBtn) {
    cancelChangePasswordBtn.addEventListener('click', () => {
        changePasswordModal.style.display = 'none';
    });
}

if (toggleCurrentPasswordBtn) {
    toggleCurrentPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        togglePasswordVisibility(currentPasswordInput, toggleCurrentPasswordBtn);
    });
}

if (toggleNewPasswordBtn) {
    toggleNewPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        togglePasswordVisibility(newPasswordInput, toggleNewPasswordBtn);
    });
}

if (toggleConfirmNewPasswordBtn) {
    toggleConfirmNewPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        togglePasswordVisibility(confirmNewPasswordInput, toggleConfirmNewPasswordBtn);
    });
}

if (newPasswordInput) {
    newPasswordInput.addEventListener('input', () => {
        const pwd = newPasswordInput.value;
        if (!pwd) {
            changePasswordStrength.style.display = 'none';
            return;
        }
        changePasswordStrength.style.display = 'block';
        const strength = calculatePasswordStrength(pwd);
        let level, color;
        if (strength <= 2) {
            level = 'Weak';
            color = '#ef4444';
        } else if (strength <= 4) {
            level = 'Fair';
            color = '#f59e0b';
        } else if (strength <= 5) {
            level = 'Good';
            color = '#3b82f6';
        } else {
            level = 'Strong';
            color = '#22c55e';
        }
        changeStrengthLevel.textContent = level;
        changePasswordStrength.style.background = color + '20';
        changePasswordStrength.style.borderLeft = `3px solid ${color}`;
    });
}

if (confirmChangePasswordBtn) {
    confirmChangePasswordBtn.addEventListener('click', async () => {
        const currentPwd = currentPasswordInput.value;
        const newPwd1 = newPasswordInput.value;
        const newPwd2 = confirmNewPasswordInput.value;

        if (!currentPwd || !newPwd1 || !newPwd2) {
            showToast('Please fill all fields');
            return;
        }

        if (newPwd1 !== newPwd2) {
            showToast('New passwords do not match!');
            return;
        }

        if (newPwd1.length < 8) {
            showToast('Password must be at least 8 characters');
            return;
        }

        // Verify current password
        const salt = await getVaultSalt();
        const currentKey = await deriveKey(currentPwd, salt);

        chrome.storage.local.get(['enc_vault'], async (result) => {
            try {
                const vaultData = JSON.parse(result.enc_vault);
                const testStr = await decryptData(vaultData.test, currentKey);
                if (testStr !== 'vault-ok') throw new Error("Wrong password");

                // Current password verified, now change to new password
                const newSalt = await generateSalt();
                const newKey = await deriveKey(newPwd1, newSalt);

                // Re-encrypt vault with new key
                const recordsStr = await decryptData(vaultData.records, currentKey);
                const newTestEnc = await encryptData("vault-ok", newKey);
                const newRecordsEnc = await encryptData(recordsStr, newKey);

                // Save new salt and encrypted vault
                chrome.storage.local.set({
                    vault_salt: newSalt,
                    enc_vault: JSON.stringify({
                        test: newTestEnc,
                        records: newRecordsEnc
                    })
                });

                vaultKey = newKey;
                showToast('Master Password Changed!');
                changePasswordModal.style.display = 'none';

                // Clear inputs
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
                confirmNewPasswordInput.value = '';
                changePasswordStrength.style.display = 'none';
            } catch (e) {
                showToast("Current password is incorrect!");
            }
        });
    });
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', () => {
    updateCheckboxState();
    generatePassword();
    loadOTPAccounts(() => {
        renderOTPAccounts();
    });
});
