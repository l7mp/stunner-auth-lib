# @l7mp/stunner-auth-lib

A library to create ICE configuration and TURN credentials for the [STUNner Kubernetes ingress
gateway for WebRTC](https://github.com/l7mp/stunner).

```javascript
const StunnerAuth = require('@l7mp/stunner-auth-lib');

var credentials = StunnerAuth.getStunnerCredentials({
    secret: "my-shared-secret",
    duration: 24*60*60,
});
```

## Installation

Install from NPM.

```sh
$ npm install @l7mp/stunner-auth-lib
```

## Usage 

This library simplifies generating `plaintext` and `longterm` STUN/TURN credentials and ICE server
configuration for accessing the [STUNner Kubernetes ingress gateway for WebRTC
](https://github.com/l7mp/stunner). 

The intended use is to ease the generation of STUN/TURN credentials and ICE server configuration
stanza in the WebRTC application server. The application server can send these back to the WebRTC
clients in the course of the WebSocket/JSON call setup process. Clients can then use the STUN/TURN
credentials and ICE server configuration received from the application server to authenticate with
STUNner, in order to reach the WebRTC media plane deployed into Kubernetes.

### Configuration

The library depends on the current STUNner configuration for generating STUN/TURN credentials,
which can be made available to the application server by mapping the [STUNner Kubernetes
`ConfigMap`](https://github.com/l7mp/stunner#configuration) as environment variables into the pod
running the application server. The below is a Kubernetes pod template snippet shows how to do
this.

``` yaml
...
spec:
  containers:
  - name: stunnerd
    image: l7mp/stunnerd:latest
    ...
    envFrom:
      - configMapRef:
          name: stunner-config
...
```

The library uses the following [STUNner
configuration](https://github.com/l7mp/stunner#configuration) parameters.

* `STUNNER_PUBLIC_ADDR` (no default, must be
  [customized](https://github.com/l7mp/stunner#learning-the-external-ip-and-port)): STUNner public
  IP address.
* `STUNNER_PUBLIC_PORT` (default: 3478): STUNner public port.
* `STUNNER_REALM` (default: `stunner.l7mp.io`): STUN/TURN realm.
* `STUNNER_AUTH_TYPE` (default: `plaintext`): [STUNner authentication
  mode]((https://github.com/l7mp/stunner/tree/main/doc/AUTH.md)); either `plaintext` or `longterm`.
* `STUNNER_USERNAME` (default: `user`):
  [username](https://www.rfc-editor.org/rfc/rfc8489.html#section-14.3) for `plaintext`
  authentication.
* `STUNNER_PASSWORD` (default: `pass`): password for `plaintext` authentication.
* `STUNNER_SHARED_SECRET` (default: `secret`): the shared secret for `longterm` authentication.

By default, UDP is assumed as the STUN/TURN transport; see the [STUNner
documentation](https://github.com/l7mp/stunner/tree/main/doc/README.md) on how to enable STUN/TURN
over TCP, TLS and DTLS.  For most configuration parameters the library specifies sane
defaults. Defaults are overridden by the environment variables (i.e., the STUNner configuration),
which can in turn be overridden in the function arguments specified on the library calls.

### Generating ICE configuration

The recommended usage is generating the [ICE
configuration](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer) along with the
STUNner credentials in a single step and sending it back the WebRTC clients during call setup.

* Generate a full [ICE configuration
  object](https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer) on
  the [WebRTC application server](https://bloggeek.me/webrtc-server)
  ```javascript
  const StunnerAuth = require('@l7mp/stunner-auth-lib');
  ...
  var ICE_config = StunnerAuth.getIceConfig({
    address: '1.2.3.4',            // ovveride STUNNER_PUBLIC_ADDR
    port: 3478,                    // ovveride STUNNER_PUBLIC_PORT
    auth_type: 'plaintext',        // override STUNNER_AUTH_TYPE
    username: 'my-user',           // override STUNNER_USERNAME
    password: 'my-password',       // override STUNNER_PASSWORD
    ice_transport_policy: 'relay', // override STUNNER_ICE_TRANSPORT_POLICY
  });
  console.log(ICE_config);
  ```
  Output:
  ```javascript
  {
    iceServers: [
      {
        url: 'turn:1.2.3.4:3478?transport=udp',
        username: 'my-user',
        credential: 'my-password'
      }
    ],
    iceTransportPolicy: 'relay'
  }
  ```
* Send the generated ICE configuration to the clients during the WebSocket/JSON call setup process
  (e.g., during user registration) and use this configuration in the clients to initialize the WebRTC
  [`PeerConnection`](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection).
  ```javascript
  var ICE_config = <Read ICE configuration from the WebSocket API>
  var pc = new RTCPeerConnection(ICE_config);
  ```

### Generating STUN/TURN credentials

Alternatively, you can simply generate a new STUN/TURN long-term credential that you can use for
authenticating with STUNner.

```javascript
var cred = StunnerAuth.getStunnerCredentials({
    auth_type: 'longterm',   // override STUNNER_AUTH_TYPE
    secret: 'my-secret',     // override STUNNER_SHARED_SECRET
    duration: 24 * 60 * 60,  // lifetime the longterm credential is effective
});
console.log(`STUNner credentials: ${cred.username} / ${cred.credential}`);
```

Output:
```
STUNner credentials: 1652118264 / nRU+Iz2ENeP2Y3sDXzSRsFRDs8s=
```

## Help

STUNner development is coordinated in Discord, send
[us](https://github.com/l7mp/stunner/blob/main/AUTHORS) an email to ask an invitation.

## License

Copyright 2021-2022 by its authors. Some rights reserved. See
[AUTHORS](https://github.com/l7mp/stunner/blob/main/AUTHORS).

MIT License - see [LICENSE](/LICENSE) for full text.

## Acknowledgments

Initial code adopted from
[@rojo2/turn-credentials](https://www.npmjs.com/package/@rojo2/turn-credentials).
