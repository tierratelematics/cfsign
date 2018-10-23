# cfsign

A Typescript/Javascript lib for working with CloudFront signatures in NodeJs.

## Getting started

Install `cfsign` from [npm](https://www.npmjs.com/package/cfsign).

Instantiate a signer with your key configuration:

```javascript
import { Signer } from "cfsign";
const signer = new Signer({
    id: "APKAXXXXXXXXXXXXXXXX", 
    privateKeyPem: "-----BEGIN RSA PRIVATE KEY-----\nXXXX..."
});
```

As per [AWS documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html),
`cfsign` supports short-ish URLs, signed using a "canned" policy. In this
case a URL and an expiration date will do:

```javascript
const expiration = new Date(new Date().getTime() + 10*60*1000);
const signedUrl = signer.signUrl(`https://xyz.cloudfront.net/example/path`, expiration);
```

To sign a more complex policy, just build one and then get the resulting
cookies or query parameters.

```javascript
const policy = {
    Statement: [{
        Condition: {
            DateGreaterThan: { "AWS:EpochTime": 0 },
            DateLessThan: { "AWS:EpochTime": 1 },
            IpAddress: { "AWS:SourceIp": "1.1.1.0/24" }
        },
        Resource: "http://test.com/folder/*"
    }]
};
const signature = sut.sign(policy);

const cookies = signature.toCookies();
const signedUrl = signature.addToUrl("http://test.com/folder/file");
```

In typescript the `Policy` type will help you to write a correct policy.

## Extra utils

If you prefer to set the key via a single line string, rather than a PEM,
there's `pemFormat()`:

```javascript
import { pemFormat } from "cfsign/lib/keyUtils";
const signer = new Signer({
    id: "APKAXXXXXXXXXXXXXXXX", 
    privateKeyPem: pemFormat("XXXX")
});
```

Refer to typedocs or tests for further details and examples.
