import expect = require("expect.js");

import { pemFormat } from "../src/keyUtils";

describe("Given the keyUtils module", () => {
    context("When a key is not in PEM format", () => {
        const base64 = Buffer.alloc(64, "A").toString() +
            Buffer.alloc(64, "B").toString() +
            "CCCC";
        const pem = "-----BEGIN RSA PRIVATE KEY-----\n" +
            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n" +
            "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB\n" +
            "CCCC\n" +
            "-----END RSA PRIVATE KEY-----";

        it("Should format it as PEM", () => {
            expect(pemFormat(base64)).to.be(pem);
        });
    });
});
