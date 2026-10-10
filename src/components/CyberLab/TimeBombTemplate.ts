export const generateTimeBombHtml = (
  encryptedDataB64: string,
  ivB64: string,
  saltB64: string,
  vaultId: string,
  fileName: string,
  fileType: string,
  expiresAt: number,
  fileSize: number
) => {
  const formattedSize = (fileSize / 1024 / 1024).toFixed(2);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Time-Bomb Vault: ${fileName}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --bg-main: #F9FAFB;
      --bg-card: #FFFFFF;
      --accent: #2563EB;
      --text-main: #111827;
      --text-muted: #6B7280;
      --border: #E5E7EB;
      --danger: #DC2626;
      --success: #10B981;
    }
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      background: var(--bg-main); 
      color: var(--text-main); 
      display: flex; 
      flex-direction: column;
      justify-content: center; 
      align-items: center; 
      min-height: 100vh; 
      margin: 0; 
      padding: 1rem;
    }
    .card { 
      background: var(--bg-card); 
      padding: 2.5rem; 
      border-radius: 1.5rem; 
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); 
      width: 100%; 
      max-width: 420px; 
      border: 2px solid var(--border); 
      text-align: center;
      position: relative;
      overflow: hidden;
      transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .icon-wrapper {
      width: 4rem;
      height: 4rem;
      background: rgba(37, 99, 235, 0.1);
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem auto;
      transition: all 0.3s;
    }
    .icon-wrapper i {
      font-size: 1.75rem;
      color: var(--accent);
    }
    h1 { 
      margin: 0 0 0.5rem 0; 
      font-size: 1.5rem;
      font-weight: 800;
    }
    .subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 2rem;
      line-height: 1.5;
    }
    .file-info {
      display: flex;
      align-items: center;
      background: #F3F4F6;
      border: 1px solid var(--border);
      padding: 1rem;
      border-radius: 1rem;
      margin-bottom: 1.5rem;
      text-align: left;
    }
    .file-info i {
      font-size: 1.5rem;
      color: var(--accent);
      margin-right: 1rem;
    }
    .file-details {
      flex: 1;
      min-width: 0;
    }
    .file-name {
      font-weight: bold;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .file-size {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .timer-box {
      background: rgba(220, 38, 38, 0.05);
      border: 1px solid rgba(220, 38, 38, 0.15);
      border-radius: 1rem;
      padding: 1rem;
      margin-bottom: 2rem;
    }
    .timer-label {
      font-size: 0.75rem;
      font-weight: bold;
      color: var(--danger);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }
    .timer-countdown {
      font-size: 2rem;
      font-weight: 800;
      color: var(--danger);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      letter-spacing: -0.05em;
    }
    .input-group {
      position: relative;
      margin-bottom: 1.5rem;
    }
    input { 
      width: 100%; 
      padding: 1rem; 
      border-radius: 1rem; 
      border: 1px solid var(--border); 
      background: #FFFFFF; 
      color: var(--text-main); 
      box-sizing: border-box; 
      font-size: 1rem;
      transition: all 0.2s;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    button { 
      width: 100%; 
      padding: 1rem; 
      background: var(--accent); 
      color: white; 
      font-weight: bold; 
      font-size: 1rem;
      border: none; 
      border-radius: 1rem; 
      cursor: pointer; 
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }
    button:hover { 
      background: #1D4ED8; 
      transform: translateY(-1px);
      box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3);
    }
    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .error { 
      color: var(--danger); 
      background: rgba(220, 38, 38, 0.05);
      border: 1px solid rgba(220, 38, 38, 0.15);
      padding: 0.75rem;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem; 
      font-size: 0.875rem; 
      display: none;
      text-align: left;
    }
    .error i { margin-right: 0.5rem; }

    /* Animation Classes */
    @keyframes dissolveOut {
      0% { filter: grayscale(0) blur(0px); opacity: 1; transform: translateY(0); }
      30% { filter: grayscale(1) blur(4px); opacity: 0.7; transform: translateY(-10px); }
      100% { filter: grayscale(1) blur(15px); opacity: 0; transform: translateY(-40px); }
    }
    .anim-dissolve {
      animation: dissolveOut 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
      pointer-events: none;
    }
    
    @keyframes slowFadeIn {
      0% { opacity: 0; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }
    .anim-fade-in {
      animation: slowFadeIn 1s ease-out forwards;
    }

    @keyframes warningPulse {
      0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); transform: scale(1); }
      70% { box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); transform: scale(1.05); }
      100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); transform: scale(1); }
    }
    .anim-pulse {
      animation: warningPulse 2s infinite ease-in-out;
    }
  </style>
</head>
<body>
  <div class="card" id="vaultCard">
    <div class="icon-wrapper">
      <i class="fas fa-lock"></i>
    </div>
    <h1>Time-Bomb Vault</h1>
    <p class="subtitle">This encrypted payload requires a password to open. It relies on a cloud fragment that will be permanently destroyed when the timer runs out.</p>
    
    <div class="file-info">
      <i class="fas fa-file-alt"></i>
      <div class="file-details">
        <div class="file-name">${fileName.replace(/"/g, '&quot;')}</div>
        <div class="file-size">${formattedSize} MB</div>
      </div>
    </div>

    <div class="timer-box" id="timerBox">
      <div class="timer-label"><i class="fas fa-stopwatch mr-1"></i> Time Remaining</div>
      <div class="timer-countdown" id="countdown">Calculating...</div>
    </div>
    
    <div id="errorMsg" class="error"><i class="fas fa-exclamation-triangle"></i> <span id="errorText"></span></div>
    
    <div id="unlockForm">
      <div class="input-group">
        <input type="password" id="password" placeholder="Vault Password">
      </div>
      <button id="unlockBtn"><i class="fas fa-unlock"></i> Decrypt & Download</button>
    </div>
  </div>

  <p style="margin-top: 2rem; font-size: 0.75rem; color: var(--text-muted);"><i class="fas fa-shield-alt"></i> Decryption happens locally in your browser.</p>

  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore-compat.js"></script>
  
  <script>
    const vaultId = "${vaultId}";
    const encryptedDataB64 = "${encryptedDataB64}";
    const ivB64 = "${ivB64}";
    const saltB64 = "${saltB64}";
    const fileType = "${fileType}";
    const fileName = "${fileName.replace(/"/g, '\\"')}";
    const expiresAt = ${expiresAt};
    let isDestroyed = false;

    function triggerDestruction(msg) {
      if (isDestroyed) return;
      isDestroyed = true;
      
      const card = document.getElementById('vaultCard');
      
      // Wrap current innerHTML in a div to dissolve it smoothly
      const currentHTML = card.innerHTML;
      card.innerHTML = '<div id="dissolveTarget">' + currentHTML + '</div>';
      
      const target = document.getElementById('dissolveTarget');
      target.classList.add('anim-dissolve');
      
      setTimeout(() => {
        card.style.borderColor = 'var(--danger)';
        card.style.boxShadow = '0 0 40px rgba(220, 38, 38, 0.15)';
        
        card.innerHTML = \`
          <div class="anim-fade-in" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 1.5rem 0;">
            <div class="icon-wrapper anim-pulse" style="background: rgba(220, 38, 38, 0.05); border: 1px solid rgba(220, 38, 38, 0.1); width: 5rem; height: 5rem; margin-bottom: 2rem;">
              <i class="fas fa-shield-alt" style="color: var(--danger); font-size: 2.25rem;"></i>
            </div>
            <h1 style="color: var(--danger); font-size: 1.75rem; font-weight: 900; letter-spacing: -0.025em; margin-bottom: 1rem;">Access Revoked</h1>
            <p class="subtitle" style="margin-bottom: 0; font-size: 1rem; color: #4B5563; font-weight: 500; line-height: 1.6;">\${msg}</p>
          </div>
        \`;
      }, 1400); // Wait for dissolve to almost finish
    }

    // Countdown Timer Logic
    function updateTimer() {
      const now = Date.now();
      const diff = expiresAt - now;
      
      const timerEl = document.getElementById('countdown');
      const boxEl = document.getElementById('timerBox');
      
      if (diff <= 0) {
        if (!isDestroyed) {
          document.getElementById('unlockForm').style.display = 'none';
          triggerDestruction("The time limit has expired. The cloud fragment has been permanently wiped.");
        }
        return;
      }
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      let timeStr = "";
      if (d > 0) timeStr += d.toString().padStart(2, '0') + "d ";
      timeStr += h.toString().padStart(2, '0') + ":";
      timeStr += m.toString().padStart(2, '0') + ":";
      timeStr += s.toString().padStart(2, '0');
      
      if(timerEl) timerEl.innerText = timeStr;
    }
    
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    function showError(msg) {
      const errBox = document.getElementById('errorMsg');
      const errText = document.getElementById('errorText');
      if(errText) errText.innerText = msg;
      if(errBox) errBox.style.display = 'block';
    }

    // Firebase Config (Must match the generator's config)
    const firebaseConfig = {
      apiKey: "AIzaSyDlD6IpjbE__xCWFrqYPUhieAc_t120Htk",
      projectId: "sahan-pramuditha",
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    const _base64ToArrayBuffer = (base64) => {
      const binary_string = window.atob(base64);
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
    };

    const deriveKey = async (password, cloudFragment, saltBuffer) => {
      const enc = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password + cloudFragment),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );
      return window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: saltBuffer,
          iterations: 100000,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["decrypt"]
      );
    };

    document.getElementById('unlockBtn').addEventListener('click', async () => {
      if (isDestroyed) return;
      
      const password = document.getElementById('password').value;
      const btn = document.getElementById('unlockBtn');
      document.getElementById('errorMsg').style.display = 'none';
      
      if (!password) {
        showError("Please enter a password.");
        return;
      }
      
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Connecting...';

      try {
        const docRef = db.collection('timebombs').doc(vaultId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
          throw new Error("PAYLOAD DESTROYED");
        }
        
        const data = doc.data();
        
        // Enforce expiration: actively destroy the fragment if time is up
        if (Date.now() > data.expiresAt) {
          await docRef.delete();
          throw new Error("PAYLOAD EXPIRED");
        }
        
        const cloudFragment = data.cloudFragment;
        btn.innerHTML = '<i class="fas fa-lock-open"></i> Decrypting...';
        
        const iv = _base64ToArrayBuffer(ivB64);
        const salt = _base64ToArrayBuffer(saltB64);
        const encryptedData = _base64ToArrayBuffer(encryptedDataB64);
        
        const key = await deriveKey(password, cloudFragment, salt);
        
        let decryptedBuffer;
        try {
          decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(iv) },
            key,
            encryptedData
          );
        } catch(e) {
          // Password was wrong. Increment attempts.
          await docRef.update({ attempts: firebase.firestore.FieldValue.increment(1) });
          if (data.attempts >= 2) { // This was their 3rd attempt
            await docRef.delete();
            throw new Error("SELF-DESTRUCT");
          }
          throw new Error("Incorrect password. Attempts remaining: " + (2 - data.attempts));
        }
        
        clearInterval(timerInterval);
        
        const blob = new Blob([decryptedBuffer], { type: fileType });
        const url = URL.createObjectURL(blob);
        
        document.getElementById('unlockForm').style.display = 'none';
        document.getElementById('timerBox').style.display = 'none';
        
        const card = document.getElementById('vaultCard');
        card.innerHTML = \`
          <div class="icon-wrapper" style="background: rgba(16, 185, 129, 0.1);"><i class="fas fa-check" style="color: var(--success);"></i></div>
          <h1>Decryption Successful</h1>
          <p class="subtitle" style="margin-bottom: 1rem;">Your file has been securely decrypted and is ready to download.</p>
          <div class="file-info" style="margin-bottom: 1.5rem;">
            <i class="fas fa-file-alt"></i>
            <div class="file-details">
              <div class="file-name">\${fileName.replace(/"/g, '&quot;')}</div>
              <div class="file-size">${formattedSize} MB</div>
            </div>
          </div>
          <a href="\${url}" download="\${fileName.replace(/"/g, '&quot;')}" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 1rem; background: var(--success); color: white; font-weight: bold; font-size: 1rem; border-radius: 1rem; text-decoration: none; box-sizing: border-box; transition: transform 0.2s; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);"><i class="fas fa-download"></i> Download File</a>
        \`;
        
      } catch (err) {
        if (err.message.includes("EXPIRED") || err.message.includes("DESTRUCT") || err.message.includes("DESTROYED")) {
          clearInterval(timerInterval);
          document.getElementById('unlockForm').style.display = 'none';
          triggerDestruction(err.message === "SELF-DESTRUCT" 
            ? "3 Failed attempts. The payload has permanently wiped itself."
            : "The cloud fragment was not found. It may have expired or been deleted."
          );
        } else {
          showError(err.message || "An error occurred.");
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-unlock"></i> Decrypt & Download';
        }
      }
    });
  </script>
</body>
</html>`;
};
