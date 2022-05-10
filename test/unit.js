const assert                  = require('chai').assert;
const getStunnerCredentials   = require('../index.js').getStunnerCredentials;
const getIceConfig            = require('../index.js').getIceConfig;
const getLongtermForTimeStamp = require('../index.js').getLongtermForTimeStamp;

function cleanup(){
    delete process.env.STUNNER_PUBLIC_ADDR;
    delete process.env.STUNNER_PUBLIC_PORT;
    delete process.env.STUNNER_TRANSPORT_TCP;
    delete process.env.STUNNER_AUTH_TYPE;
    delete process.env.STUNNER_REALM;
    delete process.env.STUNNER_USERNAME;
    delete process.env.STUNNER_PASSWORD;
    delete process.env.STUNNER_SHARED_SECRET;
    delete process.env.DURATION;
    delete process.env.STUNNER_TRANSPORT_UDP_ENABLE;
    delete process.env.STUNNER_TRANSPORT_TCP_ENABLE;
}

describe('getStunnerCredentials', ()  => {
    context('no_default', () => {
        cleanup();
        let cred = getStunnerCredentials();
        
        it('username',   () => { assert.equal(cred.username, 'user'); });
        it('credential', () => { assert.equal(cred.credential, 'pass'); });
        it('realm',      () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });
    });
    context('auth_type: plaintext', () => {
        cleanup();
        let cred = getStunnerCredentials({auth_type: 'plaintext'});

        it('username',   () => { assert.equal(cred.username, 'user'); });
        it('credential', () => { assert.equal(cred.credential, 'pass'); });
        it('realm',      () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });
    });
    context('auth_type: longterm', () => {
        cleanup();
        let cred = getStunnerCredentials({auth_type: 'longterm'});
        let username = parseInt(cred.username);
        
        it('username',   () => { assert.isNotNaN(username); });
        it('duration-1', () => { assert.isAtMost(Math.floor(Date.now()/1000), username); });
        it('duration-2', () => { assert.isAtMost(username, Math.floor(Date.now()/1000 + 24 * 60 * 60)); });
        it('credential', () => { assert.isNotEmpty(cred.credential); });
        it('realm',      () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });
    });
    context('auth_type: invalid', () => {
        cleanup();
        assert.isUndefined(getStunnerCredentials({auth_type: 'invalid'}));
    });
    context('auth_type: invalid, override', () => {
        cleanup();
        process.env.STUNNER_AUTH_TYPE = "invalid";
        assert.isUndefined(getStunnerCredentials());
    });
    context('auth_type: invalid, override-2', () => {
        cleanup();
        process.env.STUNNER_AUTH_TYPE = "plaintext";
        assert.isUndefined(getStunnerCredentials({auth_type: 'invalid'}));
    });
    context('auth_type: longterm, override', () => {
        cleanup();
        process.env.STUNNER_AUTH_TYPE = "longterm";
        let cred = getStunnerCredentials({auth_type: 'plaintext'});

        it('username',   () => { assert.equal(cred.username, 'user'); });
        it('credential', () => { assert.equal(cred.credential, 'pass'); });
        it('realm',      () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });
    });
    context('auth_type: longterm, override', () => {
        cleanup();
        process.env.STUNNER_AUTH_TYPE = "plaintext";
        let cred = getStunnerCredentials({auth_type: 'longterm'});
        let username = parseInt(cred.username);
        
        it('username',   () => { assert.isNotNaN(username); });
        it('duration-1', () => { assert.isAtMost(Math.floor(Date.now()/1000), username); });
        it('duration-2', () => { assert.isAtMost(username, Math.floor(Date.now()/1000 + 24 * 60 * 60)); });
        it('credential', () => { assert.isNotEmpty(cred.credential); });
        it('realm',      () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });
    });
    context('auth_type: longterm, duration', () => {
        cleanup();
        process.env.STUNNER_AUTH_TYPE = "longterm";
        process.env.DURATION = 100;
        let cred = getStunnerCredentials();
        let username = parseInt(cred.username);
        
        it('username',   () => { assert.isNotNaN(username); });
        it('duration-1', () => { assert.isAtMost(Math.floor(Date.now()/1000), username); });
        it('duration-2', () => { assert.isAtMost(username, Math.floor(Date.now()/1000 + 100)); });
        it('credential', () => { assert.isNotEmpty(cred.credential); });
        it('realm',      () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });
    });
    context('realm', () => {
        cleanup();
        process.env.STUNNER_REALM = "realm";
        let cred = getStunnerCredentials();

        it('realm', () => { assert.equal(cred.realm, 'realm'); });
    });
    context('realm, override', () => {
        cleanup();
        process.env.STUNNER_REALM = "realm";
        let cred = getStunnerCredentials({realm: "another_realm"});

        it('realm', () => { assert.equal(cred.realm, 'another_realm'); });
    });
});

describe('getIceConfig', ()  => {
    context('no_default', () => {
        cleanup();
        assert.isUndefined(getIceConfig());
    });
    context('address', () => {
        cleanup();
        let config = getIceConfig({address: '1.2.3.4'});
        
        it('config',      () => { assert.isDefined(config); });
        it('servers-def', () => { assert.isDefined(config.iceServers); });
        it('servers-len', () => { assert.isNotEmpty(config.iceServers); });
        it('url',         () => { assert.isDefined(config.iceServers[0].url); });
        it('proto',       () => { assert.match(config.iceServers[0].url, /^turn/); });
        it('addr',        () => { assert.match(config.iceServers[0].url, /1\.2\.3\.4/); });
        it('port',        () => { assert.match(config.iceServers[0].url, /3478/); });
        it('proto',       () => { assert.match(config.iceServers[0].url, /transport=udp$/); });
        it('username',    () => { assert.equal(config.iceServers[0].username, 'user'); });
        it('credential',  () => { assert.equal(config.iceServers[0].credential, 'pass'); });
        it('policy',      () => { assert.isDefined(config.iceTransportPolicy); });
        it('relay',       () => { assert.equal(config.iceTransportPolicy, 'relay'); });
    });
    context('address-port, env', () => {
        cleanup();
        process.env.STUNNER_PUBLIC_ADDR = "5.6.7.8";
        process.env.STUNNER_PUBLIC_PORT = 1111;
        let config = getIceConfig();
        
        it('config',      () => { assert.isDefined(config); });
        it('servers-def', () => { assert.isDefined(config.iceServers); });
        it('servers-len', () => { assert.isNotEmpty(config.iceServers); });
        it('url',         () => { assert.isDefined(config.iceServers[0].url); });
        it('proto',       () => { assert.match(config.iceServers[0].url, /^turn/); });
        it('addr',        () => { assert.match(config.iceServers[0].url, /5\.6\.7\.8/); });
        it('port',        () => { assert.match(config.iceServers[0].url, /1111/); });
        it('proto',       () => { assert.match(config.iceServers[0].url, /transport=udp$/); });
        it('username',    () => { assert.equal(config.iceServers[0].username, 'user'); });
        it('credential',  () => { assert.equal(config.iceServers[0].credential, 'pass'); });
        it('policy',      () => { assert.isDefined(config.iceTransportPolicy); });
        it('relay',       () => { assert.equal(config.iceTransportPolicy, 'relay'); });
    });
    context('address-port, env override', () => {
        cleanup();
        process.env.STUNNER_PUBLIC_ADDR = "5.6.7.8";
        process.env.STUNNER_PUBLIC_PORT = 1111;
        let config = getIceConfig({address: '4.3.2.1', port: 3333});
        
        it('config',      () => { assert.isDefined(config); });
        it('servers-def', () => { assert.isDefined(config.iceServers); });
        it('servers-len', () => { assert.isNotEmpty(config.iceServers); });
        it('url',         () => { assert.isDefined(config.iceServers[0].url); });
        it('proto',       () => { assert.match(config.iceServers[0].url, /^turn/); });
        it('addr',        () => { assert.match(config.iceServers[0].url, /4\.3\.2\.1/); });
        it('port',        () => { assert.match(config.iceServers[0].url, /3333/); });
        it('proto',       () => { assert.match(config.iceServers[0].url, /transport=udp$/); });
        it('username',    () => { assert.equal(config.iceServers[0].username, 'user'); });
        it('credential',  () => { assert.equal(config.iceServers[0].credential, 'pass'); });
        it('policy',      () => { assert.isDefined(config.iceTransportPolicy); });
        it('relay',       () => { assert.equal(config.iceTransportPolicy, 'relay'); });
    });
    context('enable tcp', () => {
        cleanup();
        process.env.STUNNER_TRANSPORT_TCP_ENABLE = "1";
        let config = getIceConfig({address: '4.3.2.1'});

        it('config',      () => { assert.isDefined(config); });
        it('servers-def', () => { assert.isDefined(config.iceServers); });
        it('servers-len', () => { assert.equal(config.iceServers.length, 2); });
        it('url-1',       () => { assert.isDefined(config.iceServers[0].url); });
        it('proto-1',     () => { assert.match(config.iceServers[0].url, /^turn/); });
        it('addr-1',      () => { assert.match(config.iceServers[0].url, /4\.3\.2\.1/); });
        it('port-1',      () => { assert.match(config.iceServers[0].url, /3478/); });
        it('proto-1',     () => { assert.match(config.iceServers[0].url, /transport=udp$/); });
        it('username-1',  () => { assert.equal(config.iceServers[0].username, 'user'); });
        it('credential-1',() => { assert.equal(config.iceServers[0].credential, 'pass'); });
        it('url-2',       () => { assert.isDefined(config.iceServers[1].url); });
        it('proto-2',     () => { assert.match(config.iceServers[1].url, /^turn/); });
        it('addr-2',      () => { assert.match(config.iceServers[1].url, /4\.3\.2\.1/); });
        it('port-2',      () => { assert.match(config.iceServers[1].url, /3478/); });
        it('proto-2',     () => { assert.match(config.iceServers[1].url, /transport=tcp$/); });
        it('username-2',  () => { assert.equal(config.iceServers[1].username, 'user'); });
        it('credential-2',() => { assert.equal(config.iceServers[1].credential, 'pass'); });
        it('policy',      () => { assert.isDefined(config.iceTransportPolicy); });
        it('relay',       () => { assert.equal(config.iceTransportPolicy, 'relay'); });
    });
    context('enable tcp, env override', () => {
        cleanup();
        process.env.STUNNER_TRANSPORT_UDP_ENABLE = "0";
        process.env.STUNNER_TRANSPORT_TCP_ENABLE = "0";
        let config = getIceConfig({address: '4.3.2.1', transport_udp_enable: 1, transport_tcp_enable: 1});
       
        it('config',      () => { assert.isDefined(config); });
        it('servers-def', () => { assert.isDefined(config.iceServers); });
        it('servers-len', () => { assert.equal(config.iceServers.length, 2); });
        it('url-1',       () => { assert.isDefined(config.iceServers[0].url); });
        it('proto-1',     () => { assert.match(config.iceServers[0].url, /^turn/); });
        it('addr-1',      () => { assert.match(config.iceServers[0].url, /4\.3\.2\.1/); });
        it('port-1',      () => { assert.match(config.iceServers[0].url, /3478/); });
        it('proto-1',     () => { assert.match(config.iceServers[0].url, /transport=udp$/); });
        it('username-1',  () => { assert.equal(config.iceServers[0].username, 'user'); });
        it('credential-1',() => { assert.equal(config.iceServers[0].credential, 'pass'); });
        it('url-2',       () => { assert.isDefined(config.iceServers[1].url); });
        it('proto-2',     () => { assert.match(config.iceServers[1].url, /^turn/); });
        it('addr-2',      () => { assert.match(config.iceServers[1].url, /4\.3\.2\.1/); });
        it('port-2',      () => { assert.match(config.iceServers[1].url, /3478/); });
        it('proto-2',     () => { assert.match(config.iceServers[1].url, /transport=tcp$/); });
        it('username-2',  () => { assert.equal(config.iceServers[1].username, 'user'); });
        it('credential-2',() => { assert.equal(config.iceServers[1].credential, 'pass'); });
        it('policy',      () => { assert.isDefined(config.iceTransportPolicy); });
        it('relay',       () => { assert.equal(config.iceTransportPolicy, 'relay'); });
    });
    context('disable udp - 1', () => {
        cleanup();
        process.env.STUNNER_TRANSPORT_TCP_ENABLE = "1";
        process.env.STUNNER_TRANSPORT_UDP_ENABLE = "0";
        let config = getIceConfig({address: '4.3.2.1'});
        
        it('config',      () => { assert.isDefined(config); });
        it('servers-def', () => { assert.isDefined(config.iceServers); });
        it('servers-len', () => { assert.equal(config.iceServers.length, 1); });
        it('url-1',       () => { assert.isDefined(config.iceServers[0].url); });
        it('proto-1',     () => { assert.match(config.iceServers[0].url, /transport=tcp$/); });
    });
    context('disable udp - 2', () => {
        cleanup();
        process.env.STUNNER_TRANSPORT_TCP_ENABLE = "1";
        process.env.STUNNER_TRANSPORT_UDP_ENABLE = "";
        let config = getIceConfig({address: '4.3.2.1'});
        
        it('config',      () => { assert.isDefined(config); });
        it('servers-def', () => { assert.isDefined(config.iceServers); });
        it('servers-len', () => { assert.equal(config.iceServers.length, 1); });
        it('url-1',       () => { assert.isDefined(config.iceServers[0].url); });
        it('proto-1',     () => { assert.match(config.iceServers[0].url, /transport=tcp$/); });
    });
    context('disable all - 1', () => {
        cleanup();
        process.env.STUNNER_TRANSPORT_UDP_ENABLE = "0";
        process.env.STUNNER_TRANSPORT_TCP_ENABLE = "0";
        let config = getIceConfig({address: '4.3.2.1'});

        it('config',      () => { assert.isDefined(config); });
        it('servers-def', () => { assert.isDefined(config.iceServers); });
        it('servers-len', () => { assert.equal(config.iceServers.length, 0); });
    });
    context('disable all - 2', () => {
        cleanup();
        process.env.STUNNER_TRANSPORT_UDP_ENABLE = "";
        process.env.STUNNER_TRANSPORT_TCP_ENABLE = "";
        let config = getIceConfig({address: '4.3.2.1'});

        it('config',      () => { assert.isDefined(config); });
        it('servers-def', () => { assert.isDefined(config.iceServers); });
        it('servers-len', () => { assert.equal(config.iceServers.length, 0); });
    });
});

describe('longterm - STUNner compatibility', ()  => {
    let tests = [
        [1652173256, "my-secret", "CguKE5jD1SnJajHjrQEwyx+pHBk="],
        [1652173361, "my-secret", "X54Uk1dmF1fhXy2nGfyNdLSddvk="],
        [1652173411, "my-secret", "qaTqeZNcAov2fd6IYZZPsJhlLuY="],
        [1652173494, "another-secret", "e64kdQvh7aW5rqb2PauFwjJ/CFs="],
        [1652177046, "another-secret", "igZpgV86ECJutlpW9AOr2IOQASU="],
        [1652209461, "another-secret", "98pQ6dr9x2f5f7kUxRq+6xU3qOY="],
    ];

    let i = 0;
    for (const t of tests) {
        context(`longterm-${i++}`, () => {
            cleanup();
            // should be integer
            let username = t[0];
            // gets integer username
            let c = getLongtermForTimeStamp(username, t[1], "dummy-realm", "sha1", "base64");
            // returns stringified username
            it('username',   () => { assert.equal(c.username, `${username}`) });
            it('credential', () => { assert.equal(c.credential, t[2]) });
        });
    }
});
