import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const SESSION_KEY = 'schoolerp_session';

// B1 Hardening: Simple Obfuscation to avoid plaintext inspection of backups
// In a full RC, we'd use @capacitor-community/secure-storage (Keychain/Keystore)
// but for a minimal JS patch we use AES-GCM or XOR + Base64
async function encrypt(value: string): Promise<string> {
  const enc = new TextEncoder();
  const encoded = enc.encode(value);
  
  // Use a hardcoded salt + app salt derived from Capacitor bundle for RC1
  // This is better than plaintext but not as good as native Keychain.
  const salt = 'erp-' + (Capacitor.isNativePlatform() ? 'native' : 'web');
  const buffer = Array.from(encoded).map((b, i) => b ^ salt.charCodeAt(i % salt.length));
  
  return btoa(String.fromCharCode(...buffer));
}

async function decrypt(value: string): Promise<string> {
  const binary = atob(value);
  const salt = 'erp-' + (Capacitor.isNativePlatform() ? 'native' : 'web');
  const buffer = Array.from(binary).map((c, i) => c.charCodeAt(0) ^ salt.charCodeAt(i % salt.length));
  
  return new TextDecoder().decode(new Uint8Array(buffer));
}

export async function saveSession(session: any) {
  const raw = JSON.stringify(session);
  const encrypted = await encrypt(raw);
  
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({
      key: SESSION_KEY,
      value: encrypted,
    });
  } else {
    localStorage.setItem(SESSION_KEY, encrypted);
  }
}

export async function loadSession(): Promise<any | null> {
  let encryptedValue: string | null = null;
  
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: SESSION_KEY });
    encryptedValue = value;
  } else {
    encryptedValue = localStorage.getItem(SESSION_KEY);
  }
  
  if (!encryptedValue) return null;
  
  try {
    const raw = await decrypt(encryptedValue);
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to decrypt session', e);
    return null;
  }
}

export async function clearSession() {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key: SESSION_KEY });
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}
