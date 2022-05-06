const chai = require('chai').assert;
import * as StunnerAuth from '@l7mp/stunner-auth-lib';

process.env.STUNNER_PUBLIC_ADDR = "";
process.env.STUNNER_PUBLIC_PORT = "";
process.env.STUNNER_TRANSPORT_TCP = "";
process.env.STUNNER_TYPE = "";
process.env.STUNNER_REALM = "";
process.env.STUNNER_USERNAME = "";
process.env.STUNNER_PASSWORD = "";
process.env.STUNNER_SHARED_SECRET = "";
process.env.DURATION = "";

describe('generateStunnerCredentials', ()  => {
    context('no_default', () => {
        let cred = StunnerAuth.generateStunnerCredentials();
        it('username', () => { assert.equal(cred.username, 'user'); });
        it('password', () => { assert.equal(cred.username, 'pass'); });
        it('realm',    () => { assert.equal(cred.username, 'stunner.l7mp.io'); });
    });
    context('type: plaintext', () => {
        let cred = StunnerAuth.generateStunnerCredentials({type: 'plaintext'});
        it('username', () => { assert.equal(cred.username, 'user'); });
        it('password', () => { assert.equal(cred.username, 'pass'); });
        it('realm',    () => { assert.equal(cred.username, 'stunner.l7mp.io'); });
    });
    context('type: longterm', () => {
        let cred = StunnerAuth.generateStunnerCredentials({type: 'longterm'});
        it('username',   () => { assert.isNumber(cred.username); });
        it('duration-1', () => { assert.isAtLeast(Math.floor(Date.now()/1000), cred.username); });
        it('duration-1', () => { assert.isAtMost(cred.username, Math.floor(Date.now()/1000 + 24 * 60 * 60)); });
        it('password',   () => { assert.isNotEmpty(cred.password); });
        it('realm',      () => { assert.equal(cred.username, 'stunner.l7mp.io'); });
    });
    context('type: invalid', () => {
        assert.isUndefined(StunnerAuth.generateStunnerCredentials({type: 'invalid'}));
    });
    context('type: invalid, override', () => {
        process.env.STUNNER_TYPE = "invalid";
        assert.isUndefined(StunnerAuth.generateStunnerCredentials());
    });
    context('type: invalid, override-2', () => {
        process.env.STUNNER_TYPE = "plaintext";
        assert.isUndefined(StunnerAuth.generateStunnerCredentials({type: 'invalid'}));
    });
    context('type: longterm, override', () => {
        process.env.STUNNER_TYPE = "longterm";
        let cred = StunnerAuth.generateStunnerCredentials({type: 'plaintext'});
        it('username', () => { assert.equal(cred.username, 'user'); });
        it('password', () => { assert.equal(cred.username, 'pass'); });
        it('realm',    () => { assert.equal(cred.username, 'stunner.l7mp.io'); });
    });
    context('type: longterm, override', () => {
        process.env.STUNNER_TYPE = "plaintext";
        let cred = StunnerAuth.generateStunnerCredentials({type: 'longterm'});
        it('username',   () => { assert.isNumber(cred.username); });
        it('duration-1', () => { assert.isAtLeast(Math.floor(Date.now()/1000), cred.username); });
        it('duration-1', () => { assert.isAtMost(cred.username, Math.floor(Date.now()/1000 + 24 * 60 * 60)); });
        it('password',   () => { assert.isNotEmpty(cred.password); });
        it('realm',      () => { assert.equal(cred.username, 'stunner.l7mp.io'); });
    });
    context('type: longterm, duration', () => {
        process.env.STUNNER_TYPE = "longterm";
        process.env.DURATION = 100;
        let cred = StunnerAuth.generateStunnerCredentials();
        it('username',   () => { assert.isNumber(cred.username); });
        it('duration-1', () => { assert.isAtLeast(Math.floor(Date.now()/1000), cred.username); });
        it('duration-1', () => { assert.isAtMost(cred.username, Math.floor(Date.now()/1000 + 100)); });
        it('password',   () => { assert.isNotEmpty(cred.password); });
        it('realm',      () => { assert.equal(cred.username, 'stunner.l7mp.io'); });
    });
    context('realm', () => {
        process.env.STUNNER_REALM = "realm";
        let cred = StunnerAuth.generateStunnerCredentials();
        it('realm',    () => { assert.equal(cred.username, 'realm'); });
    });
    context('realm, override', () => {
        process.env.STUNNER_REALM = "realm";
        let cred = StunnerAuth.generateStunnerCredentials({realm: "another_realm"});
        it('realm',    () => { assert.equal(cred.username, 'another_realm'); });
    });
});

describe('generateIceConfig', ()  => {
    context('no_default', () => {
        assert.isUndefined(StunnerAuth.generateIceConfig());
    });
    context('address', () => {
        let config = StunnerAuth.generateIceConfig({address: '1.2.3.4'});
        it('config',      () => { assert.isDefined(config); });
        it('servers-def', () => { assert.isDefined(config.IceServers); });
        it('servers-len', () => { assert.isNotEmpty(config.IceServers); });
        it('url',         () => { assert.isDefined(config.IceServers[0].url); });
        it('proto',       () => { assert.match(config.IceServers[0].url, /^turn/); });
        it('addr',        () => { assert.match(config.IceServers[0].url, /1\.2\.3\.4/); });
        it('port',        () => { assert.match(config.IceServers[0].url, /3478/); });
        it('proto',       () => { assert.match(config.IceServers[0].url, /transport=udp$/); });
        it('username',    () => { assert.equal(config.IceServers[0].username, 'user'); });
        it('password',    () => { assert.equal(config.IceServers[0].username, 'pass'); });
        it('policy',      () => { assert.isDefined(config.iceTransportPolicy); });
        it('relay',       () => { assert.equal(config.iceTransportPolicy, 'relay'); });
    });
    context('address-port, env', () => {
        process.env.STUNNER_PUBLIC_ADDRESS = "5.6.7.8";
        process.env.STUNNER_PUBLIC_PORT = 1111;
        let config = StunnerAuth.generateIceConfig();
        it('config',      () => { assert.isDefined(config); });
        it('servers-def', () => { assert.isDefined(config.IceServers); });
        it('servers-len', () => { assert.isNotEmpty(config.IceServers); });
        it('url',         () => { assert.isDefined(config.IceServers[0].url); });
        it('proto',       () => { assert.match(config.IceServers[0].url, /^turn/); });
        it('addr',        () => { assert.match(config.IceServers[0].url, /5\.6\.7\.8/); });
        it('port',        () => { assert.match(config.IceServers[0].url, /1111/); });
        it('proto',       () => { assert.match(config.IceServers[0].url, /transport=udp$/); });
        it('username',    () => { assert.equal(config.IceServers[0].username, 'user'); });
        it('password',    () => { assert.equal(config.IceServers[0].username, 'pass'); });
        it('policy',      () => { assert.isDefined(config.iceTransportPolicy); });
        it('relay',       () => { assert.equal(config.iceTransportPolicy, 'relay'); });
    });
    context('address-port, env override', () => {
        process.env.STUNNER_PUBLIC_ADDRESS = "5.6.7.8";
        process.env.STUNNER_PUBLIC_PORT = 1111;
        let config = StunnerAuth.generateIceConfig({address: '4.3.2.1', port: 3333});
        it('config',      () => { assert.isDefined(config); });
        it('servers-def', () => { assert.isDefined(config.IceServers); });
        it('servers-len', () => { assert.isNotEmpty(config.IceServers); });
        it('url',         () => { assert.isDefined(config.IceServers[0].url); });
        it('proto',       () => { assert.match(config.IceServers[0].url, /^turn/); });
        it('addr',        () => { assert.match(config.IceServers[0].url, /4\.3\.2\.1/); });
        it('port',        () => { assert.match(config.IceServers[0].url, /333/); });
        it('proto',       () => { assert.match(config.IceServers[0].url, /transport=udp$/); });
        it('username',    () => { assert.equal(config.IceServers[0].username, 'user'); });
        it('password',    () => { assert.equal(config.IceServers[0].username, 'pass'); });
        it('policy',      () => { assert.isDefined(config.iceTransportPolicy); });
        it('relay',       () => { assert.equal(config.iceTransportPolicy, 'relay'); });
    });
});
