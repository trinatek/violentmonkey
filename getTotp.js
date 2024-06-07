// @require     https://raw.githubusercontent.com/trinatek/violentmonkey/main/getTotp.js

/**
 * Generates a TOTP code from a cleaned 2FA secret key using the specified hash type.
 * 
 * @param {string} secretKey - Secret key from the 2FA provider.
 * @param {string} hashAlgo - Hash algorithm (SHA-1, SHA-256, or SHA-512).
 * 
 * @returns {Promise<string>} - The generated TOTP code.
 * @throws {Error} - Throws an error if TOTP generation fails.
 */
async function generateTotp(secretKey, hashAlgo = "SHA-1") {
  
  return main(secretKey, hashAlgo);

  /**
   * @param {string} secretKey
   * @param {string} hashAlgo
   * 
   * @returns {Promise<string>}
   * @throws {Error}
   */
  async function main(secretKey, hashAlgo) {
    try {
      const time = getCurrentTimeStep();
      const key = convertBase32ToUint8Array(secretKey.replace(/\s+/g, ""));
      const timeBuffer = createTimeBuffer(time);
      validateSelectedHashAlgo(hashAlgo);
      const cryptoKey = await getCryptoKey(key, hashAlgo);
      
      return formatOtp(
        await getHmac(cryptoKey, timeBuffer)
      );
      
    } catch (error) {
      throw new Error(`Failed to generate TOTP: ${error.message}`);
    }
  }

  /**
   * @returns {number}
   */
  function getCurrentTimeStep() {
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = 30;
    
    return Math.floor(epoch / timeStep);
  }

  /**
   * @param {string} base32
   * 
   * @returns {Uint8Array}
   * @throws {Error}
   */
  function convertBase32ToUint8Array(base32) {
    try {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
      const bits = base32
        .toUpperCase()
        .split("")
        .map((char) => alphabet.indexOf(char))
        .filter((val) => val !== -1)
        .map((val) => val.toString(2).padStart(5, "0"))
        .join("");
        
      return new Uint8Array(
        Array.from(
          { length: Math.floor(bits.length / 8) }, (_, i) => 
            parseInt(bits.slice(i * 8, i * 8 + 8), 2)
        )
      );
      
    } catch (error) {
      throw new Error(`Failed to convert base32 string: ${error.message}`);
    }
  }

  /**
   * @param {string} hashAlgo
   * 
   * @returns {void}
   * @throws {Error}
   */
  function validateSelectedHashAlgo(hashAlgo) {
    const supportedAlgos = ["SHA-1", "SHA-256", "SHA-512"];
    
    if (supportedAlgos.includes(hashAlgo.toUpperCase())) return;

    throw new Error("Invalid hash algorithm. Use 'SHA-1', 'SHA-256', or 'SHA-512'.");
  }

  /**
   * @param {Uint8Array} secretKeyUint8Array
   * @param {string} hashAlgo
   * 
   * @returns {Promise<CryptoKey>}
   * @throws {Error}
   */
  async function getCryptoKey(secretKeyUint8Array, hashAlgo) {
    
    return await crypto.subtle.importKey(
      "raw",
      secretKeyUint8Array,
      { name: "HMAC", hash: { name: hashAlgo.toUpperCase() } },
      false,
      ["sign"]
    );
  }

  /**
   * @param {CryptoKey} cryptoKey
   * @param {ArrayBuffer} timeBuffer
   * 
   * @returns {Promise<Uint8Array>}
   * @throws {Error}
   */
  async function getHmac(cryptoKey, timeBuffer) {
    
    return new Uint8Array(
      await crypto.subtle.sign("HMAC", cryptoKey, timeBuffer)
    );
  }

  /**
   * @param {Uint8Array} hmac
   * 
   * @returns {string}
   * @throws {Error}
   */
  function formatOtp(hmac) {
    
    return generateOtp(hmac)
      .toString()
      .padStart(6, "0");
  }

  /**
   * @param {number} time
   * 
   * @returns {ArrayBuffer}
   * @throws {Error}
   */
  function createTimeBuffer(time) {
    try {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setUint32(4, time, false);
      
      return buffer;
      
    } catch (error) {
      throw new Error(`Failed to create time buffer: ${error.message}`);
    }
  }

  /**
   * @param {Uint8Array} hmac
   * 
   * @returns {number}
   * @throws {Error}
   */
  function generateOtp(hmac) {
    try {
      const offset = hmac[hmac.length - 1] & 0xf;
      const binary = ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

      return binary % 1000000;
      
    } catch (error) {
      throw new Error(`Failed to generate OTP: ${error.message}`);
    }
  }
}
