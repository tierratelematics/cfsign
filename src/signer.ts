import { createSign } from "crypto";

import { dateToEpochTime, Policy } from "./policy";
import { encode } from "./safeBase64";

/**
 * Key configuration for a Signer
 */
export interface KeyPair {
    id: string;
    privateKeyPem: string;
}

/**
 * A CloudFront signature consisting of a few parameters to be utilized in
 * query string or as cookies.
 */
export interface Signature {
    /**
     * Adds signature paramters to a URL.
     * @param url - a CloudFront URL
     * @returns the URL with the signature parameters added
     */
    addToUrl(url: string): string;

    /**
     * @returns the query string paramters as a dictionary object
     */
    toQueryStringParams(): {[k: string]: string};

    /**
     * Gets the cookies for the signature. Note that you might want to set
     * path, expiration and other cookie attributes when setting them.
     * @returns the cookies as a dictionary object
     */
    toCookies(): {[k: string]: string};
}

abstract class AbstractSignature implements Signature {

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

class CannedPolicySignature extends AbstractSignature {

    constructor(keyPairId: string, signature: string, private readonly expires: number) {
        super(keyPairId, signature);
    }

    public toQueryStringParams(): {[k: string]: string} {
        const params = super.toQueryStringParams();
        params["Expires"] = `${this.expires}`;
        return params;
    }
}

class CustomPolicySignature extends AbstractSignature {

    constructor(keyPairId: string, signature: string, private readonly safePolicyStr: string) {
        super(keyPairId, signature);
    }

    public toQueryStringParams(): {[k: string]: string} {
        const params = super.toQueryStringParams();
        params["Policy"] = this.safePolicyStr;
        return params;
    }
}

/**
 * Entry point for signing CloudFront policies.
 */
export class Signer {

    constructor(private readonly keyPair: KeyPair) {
    }

    /**
     * Simple signature for a single URL using a canned policy.
     * @param url - The CloudFront URL
     * @param expiration - Date of validity end
     * @returns The signed url
     */
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

    /**
     * Sign arbitrary complex policies for wildcard resources or conditions
     * other than expiration.
     * @param policy - A custom policy
     * @returns a Signature for the policy
     */
    public sign(policy: Policy): Signature {
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
