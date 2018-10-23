import expect = require("expect.js");

import { Policy } from "../src/policy";
import { CustomPolicySignature, Signer } from "../src/signer";

describe("Given a Signer", () => {
    const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQDpkME+vwDhp4qZNQ0AoneAIHxJVkZy0r+1tbwmrOy94RwoN0A0
0hej2rfR7gfc24YjTQfB8NIvKHttp26AGBLx/d9/0zKD2EbuVq8ReuD9VW5xqRVS
eL4G0jZq4tTypFL/JiwYuqo3DZuriYmz35WDRZrUidIXo8dwnXF/Ng6SowIDAQAB
AoGBALrYvn8/tajPqyTdN8WmMwsg8cyJZFo/FnZ7KEWYWNud1jSl3oti9t5x/lPG
pCuewjRDT01rJfnr3LHgG5oFqEC/mgfOQ5+jW1sThybyiL71x+s+87qp9K3ADQwb
1UkmwmOA39FwJRDi1SHjFYTgR+yh5gD7nTCKPZNPAdlBoSyBAkEA+JIaKoNeh9ys
4XzdFxSISdlCbnOZBMtyFEFsTxbS6cQFvwA50IRoQV2r82uzw+j4kLM6pj9dwnrA
ZDdBHPX6sQJBAPCL16TC2ANjNmOMWaXWGTcQwW2dNGpSXXvUPT/jDaRudnKUw28W
MnLCIDP5XAPIcqyIReo5CVZSgE9P4dpjT5MCQCI4Cr4bg6H0cSBBjjYlL3XrIMgP
xdrxHu1G7GAe5j4kLB5VK6BW+fs1p/xEsWSg58cTxVkplAC34VBqgt43xqECQGsp
IWxZEPqRXE2E3PswIhOR91npyswC3Xqo1pB7ijxSqZnqBBadAOR27vm4gPF+fve1
zc/GkQ5PurGamLc9vtkCQQDhaqZQOA3mKL6o+CVkshic6z3KdjuXAxMM5j4JgrPO
jXJcKKKT1j5L3UPS7ioFGsgjOdW7OQXhNQhlu5WZSwrA
-----END RSA PRIVATE KEY-----`;

    let sut: Signer;

    beforeEach(() => {
        sut = new Signer({ id: "keyPairId", privateKeyPem: privateKey });
    });

    context("When signing a single url", () => {
        it("Should return a signed url with a canned policy", () => {
            const signedUrl = sut.signUrl("http://test.com/file", new Date(1000));
            expect(signedUrl).to.match(/^http:\/\/test\.com\/file\?Key-Pair-Id=keyPairId&Signature=[^&]+&Expires=1$/);
        });
        it("Should preserve existing query string parameters", () => {
            const signedUrl = sut.signUrl("http://test.com/file?q=s", new Date(1000));
            expect(signedUrl).to.match(/^http:\/\/test\.com\/file\?q=s&/);
        });
    });

    context("When signing a custom policy", () => {
        let signature: CustomPolicySignature;
        const policy: Policy = {
            Statement: [{
                Condition: {
                    DateGreaterThan: { "AWS:EpochTime": 0 },
                    DateLessThan: { "AWS:EpochTime": 1 },
                    IpAddress: { "AWS:SourceIp": "1.1.1.0/24" }
                },
                Resource: "http://test.com/f/*"
            }]
        };

        beforeEach(() => {
            signature = sut.sign(policy);
        });

        it("Should provide CloudFront cookies", () => {
            const cookies = signature.toCookies();
            expect(cookies).to.have.property("CloudFront-Key-Pair-Id", "keyPairId");
            expect(cookies).to.have.property("CloudFront-Policy");
            expect(cookies).to.have.property("CloudFront-Signature");
            expect(Object.getOwnPropertyNames(cookies)).to.have.length(3);
        });

        it("Should be able to add the parameters to an url", () => {
            expect(signature.addToUrl("http://test.com/f/file")).to
                .match(/^http:\/\/test\.com\/f\/file\?Key-Pair-Id=keyPairId&Signature=[^&]+&Policy=[^&]+$/);
        });
    });

});
