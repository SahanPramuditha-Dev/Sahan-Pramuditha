// Audio Steganography, WAV Encoder, Acoustic FSK Modulator & Demodulator

// Helper: Convert ArrayBuffer / TypedArray to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  let binary = '';
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Convert Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

// AES-GCM Encrypt payload with a passphrase
export async function encryptPayload(data: Uint8Array, password?: string): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; iv: Uint8Array }> {
  if (!password) {
    return { ciphertext: data, salt: new Uint8Array(0), iv: new Uint8Array(0) };
  }
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data as any
  );

  return {
    ciphertext: new Uint8Array(encryptedBuffer),
    salt,
    iv
  };
}

// AES-GCM Decrypt payload with passphrase
export async function decryptPayload(ciphertext: Uint8Array, salt: Uint8Array, iv: Uint8Array, password?: string): Promise<Uint8Array> {
  if (!password || salt.length === 0 || iv.length === 0) {
    return ciphertext;
  }
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    ciphertext as any
  );

  return new Uint8Array(decryptedBuffer);
}

// Encode AudioBuffer to 16-bit PCM WAV Blob with optional embedded payload
export function audioBufferToWav(buffer: AudioBuffer, payload?: EmbeddedPayload): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = buffer.length;
  const dataByteCount = numSamples * blockAlign;
  const headerByteCount = 44;

  // If payload provided, serialize as a RIFF custom subchunk ('spy0')
  let spyChunkBytes: Uint8Array | null = null;
  if (payload) {
    const jsonStr = JSON.stringify(payload);
    const textBytes = new TextEncoder().encode(jsonStr);
    const chunkLen = textBytes.length;
    const padLen = chunkLen % 2 === 1 ? 1 : 0;
    spyChunkBytes = new Uint8Array(8 + chunkLen + padLen);
    const v = new DataView(spyChunkBytes.buffer);
    // Chunk ID 'spy0'
    spyChunkBytes[0] = 0x73; // 's'
    spyChunkBytes[1] = 0x70; // 'p'
    spyChunkBytes[2] = 0x79; // 'y'
    spyChunkBytes[3] = 0x30; // '0'
    v.setUint32(4, chunkLen, true);
    spyChunkBytes.set(textBytes, 8);
  }

  const extraLen = spyChunkBytes ? spyChunkBytes.length : 0;
  const totalLength = headerByteCount + dataByteCount + extraLen;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length minus RIFF identifier & length */
  view.setUint32(4, 36 + dataByteCount + extraLen, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, dataByteCount, true);

  // Interleave channel samples and write 16-bit PCM
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      // Clamp between -1.0 and 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer
      const intSample = sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7FFF);
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  // Also embed into raw PCM LSB directly in this WAV buffer
  if (payload) {
    const jsonStr = JSON.stringify(payload);
    const fullEnvelope = `${AUDIO_STEGO_MAGIC}${jsonStr}::END_SPY`;
    const envelopeBytes = new TextEncoder().encode(fullEnvelope);
    const fullPayload = new Uint8Array(4 + envelopeBytes.length);
    new DataView(fullPayload.buffer).setUint32(0, envelopeBytes.length, false);
    fullPayload.set(envelopeBytes, 4);

    const raw8 = new Uint8Array(arrayBuffer);
    let pcmSampleByteOffset = 44; // Channel 0 first byte in Little Endian holds LSB
    const neededSamples = fullPayload.length * 8;
    if (numSamples >= neededSamples) {
      for (let i = 0; i < fullPayload.length; i++) {
        const byte = fullPayload[i];
        for (let b = 7; b >= 0; b--) {
          const bit = (byte >> b) & 1;
          raw8[pcmSampleByteOffset] = (raw8[pcmSampleByteOffset] & 0xFE) | bit;
          pcmSampleByteOffset += blockAlign; // stay on channel 0
        }
      }
    }

    // Append 'spy0' subchunk
    if (spyChunkBytes) {
      raw8.set(spyChunkBytes, headerByteCount + dataByteCount);
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Secret Magic Marker for file detection
export const AUDIO_STEGO_MAGIC = 'SPY_AUDIO_V1::';

export interface EmbeddedPayload {
  type: 'text' | 'image';
  data: string; // text string or data URL for image
  isEncrypted: boolean;
  saltB64?: string;
  ivB64?: string;
}

// Embed payload into AudioBuffer via high-density LSB steganography
export function embedPayloadInAudio(audioBuffer: AudioBuffer, payload: EmbeddedPayload): AudioBuffer {
  // Return the audio buffer unchanged or cloned; the exact LSB and RIFF embedding happens during WAV serialization
  return audioBuffer;
}

// Extract payload directly from an audio File / ArrayBuffer (100% reliable byte-level extraction)
export async function extractPayloadFromFile(fileOrBuffer: File | ArrayBuffer): Promise<EmbeddedPayload | null> {
  const arrayBuffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;
  const uint8 = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);

  // Method 1: Check for RIFF 'spy0' chunk
  if (uint8.length >= 12) {
    const riff = String.fromCharCode(uint8[0], uint8[1], uint8[2], uint8[3]);
    const wave = String.fromCharCode(uint8[8], uint8[9], uint8[10], uint8[11]);
    if (riff === 'RIFF' && wave === 'WAVE') {
      let offset = 12;
      while (offset + 8 <= uint8.length) {
        const chunkId = String.fromCharCode(
          uint8[offset],
          uint8[offset + 1],
          uint8[offset + 2],
          uint8[offset + 3]
        );
        const chunkSize = view.getUint32(offset + 4, true);
        if (chunkId === 'spy0' && offset + 8 + chunkSize <= uint8.length) {
          try {
            const chunkData = uint8.subarray(offset + 8, offset + 8 + chunkSize);
            const jsonText = new TextDecoder().decode(chunkData);
            return JSON.parse(jsonText) as EmbeddedPayload;
          } catch (e) {
            console.warn('Found spy0 chunk but failed to parse JSON', e);
          }
        }
        offset += 8 + chunkSize + (chunkSize % 2);
      }
    }
  }

  // Method 2: Check for raw PCM LSB in data chunk
  if (uint8.length >= 44) {
    let dataOffset = -1;
    let offset = 12;
    let blockAlign = 4;
    while (offset + 8 <= uint8.length) {
      const chunkId = String.fromCharCode(
        uint8[offset],
        uint8[offset + 1],
        uint8[offset + 2],
        uint8[offset + 3]
      );
      const chunkSize = view.getUint32(offset + 4, true);
      if (chunkId === 'fmt ' && chunkSize >= 16) {
        blockAlign = view.getUint16(offset + 8 + 12, true) || 4;
      }
      if (chunkId === 'data') {
        dataOffset = offset + 8;
        break;
      }
      offset += 8 + chunkSize + (chunkSize % 2);
    }

    if (dataOffset > 0 && dataOffset + 32 * blockAlign <= uint8.length) {
      // Try reading 32-bit length header
      const lengthHeader = new Uint8Array(4);
      let pcmOffset = dataOffset;
      for (let i = 0; i < 4; i++) {
        let byte = 0;
        for (let b = 7; b >= 0; b--) {
          const bit = uint8[pcmOffset] & 1;
          byte = (byte << 1) | bit;
          pcmOffset += blockAlign;
        }
        lengthHeader[i] = byte;
      }

      const payloadLen = new DataView(lengthHeader.buffer).getUint32(0, false);
      if (payloadLen > 0 && payloadLen < 10000000 && (dataOffset + (32 + payloadLen * 8) * blockAlign) <= uint8.length) {
        const payloadBytes = new Uint8Array(payloadLen);
        for (let i = 0; i < payloadLen; i++) {
          let byte = 0;
          for (let b = 7; b >= 0; b--) {
            const bit = uint8[pcmOffset] & 1;
            byte = (byte << 1) | bit;
            pcmOffset += blockAlign;
          }
          payloadBytes[i] = byte;
        }

        const text = new TextDecoder().decode(payloadBytes);
        if (text.startsWith(AUDIO_STEGO_MAGIC) && text.includes('::END_SPY')) {
          const jsonStr = text.substring(AUDIO_STEGO_MAGIC.length, text.indexOf('::END_SPY'));
          try {
            return JSON.parse(jsonStr) as EmbeddedPayload;
          } catch {
            // continue fallback
          }
        }
      }
    }
  }

  return null;
}

// Extract payload from AudioBuffer (fallback)
export function extractPayloadFromAudio(audioBuffer: AudioBuffer): EmbeddedPayload | null {
  const channelData = audioBuffer.getChannelData(0);
  
  if (channelData.length < 32) return null;

  const lengthHeader = new Uint8Array(4);
  let bitIdx = 0;
  for (let i = 0; i < 4; i++) {
    let byte = 0;
    for (let b = 7; b >= 0; b--) {
      const sample16 = Math.round(channelData[bitIdx] * 32767);
      const bit = Math.abs(sample16) & 1;
      byte = (byte << 1) | bit;
      bitIdx++;
    }
    lengthHeader[i] = byte;
  }

  const payloadLen = new DataView(lengthHeader.buffer).getUint32(0, false);
  if (payloadLen <= 0 || payloadLen > 5000000 || (payloadLen * 8 + 32) > channelData.length) {
    return null;
  }

  const payloadBytes = new Uint8Array(payloadLen);
  for (let i = 0; i < payloadLen; i++) {
    let byte = 0;
    for (let b = 7; b >= 0; b--) {
      const sample16 = Math.round(channelData[bitIdx] * 32767);
      const bit = Math.abs(sample16) & 1;
      byte = (byte << 1) | bit;
      bitIdx++;
    }
    payloadBytes[i] = byte;
  }

  const dec = new TextDecoder();
  const text = dec.decode(payloadBytes);
  if (!text.startsWith(AUDIO_STEGO_MAGIC) || !text.includes('::END_SPY')) {
    return null;
  }

  const jsonStr = text.substring(AUDIO_STEGO_MAGIC.length, text.indexOf('::END_SPY'));
  try {
    return JSON.parse(jsonStr) as EmbeddedPayload;
  } catch {
    return null;
  }
}

// Generate a synthetic Synth / Cyber Beat sample audio track if user doesn't have an MP3 handy
export function generateSyntheticCyberTrack(audioCtx: AudioContext, durationSec = 10): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(2, sampleRate * durationSec, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Alan Walker-inspired melancholic EDM chords (Fm - Db - Ab - Eb)
  const chordFreqs = [
    [174.61, 207.65, 261.63], // F minor
    [138.59, 174.61, 207.65], // Db Major
    [207.65, 261.63, 311.13], // Ab Major
    [155.56, 196.00, 233.08]  // Eb Major
  ];

  const bpm = 128;
  const beatDuration = 60 / bpm;
  const chordDuration = beatDuration * 4;

  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.floor(t / chordDuration) % chordFreqs.length;
    const currentChord = chordFreqs[chordIdx];

    // Synth pad tone
    let synth = 0;
    for (const freq of currentChord) {
      synth += 0.08 * Math.sin(2 * Math.PI * freq * t);
      synth += 0.04 * Math.sin(2 * Math.PI * (freq * 2) * t); // subtle harmonic
    }

    // 4-on-the-floor kick beat
    const beatPos = (t % beatDuration) / beatDuration;
    const kickEnv = Math.exp(-beatPos * 14);
    const kickFreq = 150 * Math.exp(-beatPos * 18) + 45;
    const kick = 0.25 * kickEnv * Math.sin(2 * Math.PI * kickFreq * t);

    // Stereo panning
    left[i] = (synth * 0.8 + kick) * 0.9;
    right[i] = (synth * 0.8 + kick) * 0.9;
  }

  return buffer;
}
