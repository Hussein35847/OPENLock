// ============ BACKGROUND SERVICE WORKER ============
// Handles background tasks and communication with content scripts

// Extract domain from URL for matching
function getDomain(url) {
    try {
        const hostname = new URL(url).hostname;
        return hostname.replace('www.', '');
    } catch (e) {
        return '';
    }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // Save password from auto-generation or signup
    if (request.type === 'savePendingPassword') {
        chrome.storage.local.get(['vault_entries'], (result) => {
            const entries = result.vault_entries || [];
            const domain = getDomain(request.website || 'unknown');
            
            entries.push({
                id: Date.now().toString(),
                domain: domain,
                website: request.website,
                password: request.password,
                username: request.username || '',
                timestamp: Date.now()
            });
            
            chrome.storage.local.set({ vault_entries: entries });
            sendResponse({ saved: true });
        });
    }
    
    // Form submitted - offer to save
    if (request.type === 'formSubmitted') {
        const domain = getDomain(sender.url);
        chrome.storage.local.get(['vault_entries'], (result) => {
            const entries = result.vault_entries || [];
            
            // Check if we already have this password saved for this domain
            const existing = entries.find(e => e.domain === domain);
            
            // Only send response back to content script
            sendResponse({ 
                shouldPrompt: !existing,
                domain: domain,
                title: sender.tab?.title || ''
            });
        });
    }
    
    // Get saved passwords for domain
    if (request.type === 'getAutofillData') {
        const domain = getDomain(request.domain);
        chrome.storage.local.get(['vault_entries'], (result) => {
            const entries = result.vault_entries || [];
            const matching = entries.find(e => e.domain === domain);
            
            sendResponse({
                found: !!matching,
                username: matching?.username || '',
                password: matching?.password || ''
            });
        });
    }
    
    // Send autofill data to content script
    if (request.type === 'autofillRequest') {
        const domain = getDomain(request.domain);
        chrome.storage.local.get(['vault_entries'], (result) => {
            const entries = result.vault_entries || [];
            const matching = entries.find(e => e.domain === domain);
            
            if (matching) {
                sendResponse({
                    success: true,
                    username: matching.username,
                    password: matching.password
                });
            } else {
                sendResponse({
                    success: false,
                    message: 'No saved password for this site'
                });
            }
        });
    }
    
    // Get all saved passwords (for popup vault)
    if (request.type === 'getAllPasswords') {
        chrome.storage.local.get(['vault_entries'], (result) => {
            sendResponse({ entries: result.vault_entries || [] });
        });
    }
});

// Keep service worker alive
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepAlive') {
        console.log('OpenLock service worker alive');
    }
});

chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
