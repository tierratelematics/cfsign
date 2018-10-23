/**
 * Convert a single line base64 string in PEM format.
 * @param key - The key string
 * @param type - The type of key, by default private RSA.
 * @returns The key in PEM format
 */
export function pemFormat(key: string, type: string = "RSA PRIVATE KEY"): string {
    const chunks = Math.ceil(key.length / 64);
    const lines = new Array(chunks + 2);
    lines[0] = `-----BEGIN ${type}-----`;
    for (let i = 0; i < chunks; i++) {
        lines[i + 1] = key.substr(i * 64, 64);
    }
    lines[chunks + 1] = `-----END ${type}-----`;
    return lines.join("\n");
}
