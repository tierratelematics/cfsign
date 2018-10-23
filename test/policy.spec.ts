import expect = require("expect.js");

import { dateToEpochTime } from "../src/policy";

describe("Given the policy module", () => {
    context("When converting a Date", () => {
        it("Should return the Unix epoch rounded up", () => {
            expect(dateToEpochTime(new Date(1001))).to.be.eql({"AWS:EpochTime": 2});
        });
    });
});
