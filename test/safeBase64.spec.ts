import expect = require("expect.js");

import { decode, encode } from "../src/safeBase64";

describe("Given the safeBase64 module", () => {
    const base64 = "Pz8/Pj4+Lg=="; //  decoded = "???>>>."
    const safeBase64 = "Pz8~Pj4-Lg__";

    context("When encoding", () => {
        it("Should translate characters as expected by CloudFront", () => {
            expect(encode(base64)).to.be(safeBase64);
        });
    });

    context("When inverting the replacements", () => {
        it("Should revert to the original string", () => {
            expect(decode(safeBase64)).to.be(base64);
        });
    });
});
