import { createSign } from "crypto";

import { dateToEpochTime, Policy } from "./policy";
import { encode } from "./safeBase64";

export interface KeyPair {
    id: string;
    privateKeyPem: string;
}

export abstract class AbstractSignature {

    constructor(private readonly keyPairId: string, private readonly signature: string) {
    }

    public addToUrl(url: string): string {
        const queryStringParams = this.toQueryStringParams();
        const qs = Object.getOwnPropertyNames(queryStringParams)
            .map(param => `${param}=${queryStringParams[param]}`)
            .join("&");
        const sep = url.includes("?") ? "&" : "?";
        return `${url}${sep}${qs}`;
    }

    public toQueryStringParams(): {[k: string]: string} {
        return {
            "Key-Pair-Id": this.keyPairId,
            "Signature": this.signature
        };
    }

    public toCookies(): {[k: string]: string} {
        const queryParams = this.toQueryStringParams();
        const cookies: {[k: string]: string} = {};
        for (const param of Object.getOwnPropertyNames(queryParams)) {
            cookies[`CloudFront-${param}`] = queryParams[param];
        }
        return cookies;
    }
}

export class CannedPolicySignature extends AbstractSignature {

    constructor(keyPairId: string, signature: string, private readonly expires: number) {
        super(keyPairId, signature);
    }

    public toQueryStringParams(): {[k: string]: string} {
        const params = super.toQueryStringParams();
        params["Expires"] = `${this.expires}`;
        return params;
    }
}

export class CustomPolicySignature extends AbstractSignature {

    constructor(keyPairId: string, signature: string, private readonly safePolicyStr: string) {
        super(keyPairId, signature);
    }

    public toQueryStringParams(): {[k: string]: string} {
        const params = super.toQueryStringParams();
        params["Policy"] = this.safePolicyStr;
        return params;
    }
}

export class Signer {

    constructor(private readonly keyPair: KeyPair) {
    }

    public signUrl(url: string, expiration: Date): string {
        const expires = dateToEpochTime(expiration);
        const cannedPolicy: Policy = {
            Statement: [{
                Resource: url,
                // JSON keys MUST be in this order for the canned policy
                // tslint:disable-next-line:object-literal-sort-keys
                Condition: { DateLessThan: expires },
            }]
        };
        const policyStr = JSON.stringify(cannedPolicy);
        const signature = this.signature(policyStr);
        const cannedSignature = new CannedPolicySignature(this.keyPair.id, signature, expires["AWS:EpochTime"]);
        return cannedSignature.addToUrl(url);
    }

    public sign(policy: Policy): CustomPolicySignature {
        const policyStr = JSON.stringify(policy);
        const signature = this.signature(policyStr);
        return new CustomPolicySignature(this.keyPair.id, signature, encode(policyStr));
    }

    private signature(str: string): string {
        const sign = createSign("RSA-SHA1");
        sign.update(str);
        const base64 = sign.sign(this.keyPair.privateKeyPem, "base64");
        return encode(base64);
    }

}
