class CharTranslator {

    private readonly regexp: RegExp;
    private _inverse: CharTranslator | undefined;

    constructor(private readonly replacements: {[k: string]: string}) {
        const keys = Object.getOwnPropertyNames(replacements);
        this.regexp = new RegExp(`[${keys.join().replace(/([-\[\]\\])/g, "\\$1")}]`, "g");
    }

    public apply(str: string): string {
        return str.replace(this.regexp,  match => this.replacements[match]);
    }

    get inverse(): CharTranslator {
        if (this._inverse) {
            return this._inverse;
        }
        const inverseReplacements: {[k: string]: string} = {};
        for (const key of Object.getOwnPropertyNames(this.replacements)) {
            inverseReplacements[this.replacements[key]] = key;
        }
        this._inverse = new CharTranslator(inverseReplacements);
        this._inverse._inverse = this;
        return this._inverse;
    }
}

const base64ToUrlSafe = new CharTranslator({
    "+": "-",
    "/": "~",
    "=": "_",
});

export function encode(base64: string): string {
    return base64ToUrlSafe.apply(base64);
}

export function decode(base64: string): string {
    return base64ToUrlSafe.inverse.apply(base64);
}
