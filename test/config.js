const fs     = require('fs');
const os     = require('os');
const path   = require('path');
const assert = require('chai').assert;

const auth   = require('../index.js');
const filename = 'stunner.conf';

describe('config file mode', ()  => {
    let cred;
    let username;
    
    context('credentials: fallback', () => {

        // empty config file
        it('getStunnerCredentials', () => { cred = auth.getStunnerCredentials(); assert.isDefined(cred, "defined");});
        it('username',              () => { assert.equal(cred.username, 'user'); });
        it('credential',            () => { assert.equal(cred.credential, 'pass'); });
        it('realm',                 () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });

        // override auth type
        it('getStunnerCredentials', () => {
            cred = auth.getStunnerCredentials({auth_type: 'plaintext'});
            assert.isDefined(cred, "defined");
        });
        it('username',              () => { assert.equal(cred.username, 'user'); });
        it('credential',            () => { assert.equal(cred.credential, 'pass'); });
        it('realm',                 () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });

        // override auth type
        it('getStunnerCredentials', () => {
            cred = auth.getStunnerCredentials({auth_type: 'longterm'});
            assert.isDefined(cred, "defined");
        });

        it('username defined',      () => { assert.isDefined(cred.username); });
        it('username',              () => { username = parseInt(cred.username); assert.isNotNaN(username); });
        it('duration-1',            () => { assert.isAtMost(Math.floor(Date.now()/1000), username); });
        it('duration-2',            () => { assert.isAtMost(username, Math.floor(Date.now()/1000 + 24 * 60 * 60)); });
        it('credential',            () => { assert.isNotEmpty(cred.credential); });
        it('realm',                 () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });

        // wrong config file
        it('getStunnerCredentials', () => { cred = auth.getStunnerCredentials();; assert.isDefined(cred, "defined");});
        it('username',              () => { assert.equal(cred.username, 'user'); });
        it('credential',            () => { assert.equal(cred.credential, 'pass'); });
        it('realm',                 () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });

        // override auth type
        it('getStunnerCredentials', () => { cred = auth.getStunnerCredentials({auth_type: 'plaintext'}); assert.isDefined(cred, "defined");});
        it('username',              () => { assert.equal(cred.username, 'user'); });
        it('credential',            () => { assert.equal(cred.credential, 'pass'); });
        it('realm',                 () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });

        // override auth type
        it('getStunnerCredentials', () => { cred = auth.getStunnerCredentials({auth_type: 'longterm'}); assert.isDefined(cred, "defined");});
        it('username defined',      () => { assert.isDefined(cred.username); });
        it('username',              () => { username = parseInt(cred.username); assert.isNotNaN(username); });
        it('duration-1',            () => { assert.isAtMost(Math.floor(Date.now()/1000), username); });
        it('duration-2',            () => { assert.isAtMost(username, Math.floor(Date.now()/1000 + 24 * 60 * 60)); });
        it('credential',            () => { assert.isNotEmpty(cred.credential); });
        it('realm',                 () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });

    });
        
    context('credentials: correct config', () => {
        it('getStunnerCredentials: config-1',   () => {
            cred = auth.getStunnerCredentials({config_file: "test/test1.conf"});
            assert.isDefined(cred, "defined");
        });
        
        it('username',   () => { assert.equal(cred.username, 'testuser'); });
        it('credential', () => { assert.equal(cred.credential, 'testpass'); });
        it('realm',      () => { assert.equal(cred.realm, 'testrealm'); });

        it('getStunnerCredentials: config-2',   () => {
            cred = auth.getStunnerCredentials({config_file: "test/test2.conf"});
            assert.isDefined(cred, "defined");
        });
        
        it('username defined',      () => { assert.isDefined(cred.username); });
        it('username',              () => { username = parseInt(cred.username); assert.isNotNaN(username); });
        it('duration-1',            () => { assert.isAtMost(Math.floor(Date.now()/1000), username); });
        it('duration-2',            () => { assert.isAtMost(username, Math.floor(Date.now()/1000 + 24 * 60 * 60)); });
        it('credential',            () => { assert.isNotEmpty(cred.credential); });
        it('realm',                 () => { assert.equal(cred.realm, 'testrealm2'); });
    });

    context('credentials: update', () => {
        let tmp_dir;
        let conf;
       
        it('mkdtemp', () => {
            tmp_dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stunner_auth_lib_test'));
            assert.isDefined(tmp_dir);

            conf = path.join(tmp_dir, filename);
            assert.isDefined(conf);

            process.env.STUNNER_CONFIG_FILENAME = conf;
        });
      
        // empty
        it('getStunnerCredentials: no-config', () => {
            cred = auth.getStunnerCredentials();
            assert.isDefined(cred, "defined");
        });
        it('username',              () => { assert.equal(cred.username, 'user'); });
        it('credential',            () => { assert.equal(cred.credential, 'pass'); });
        it('realm',                 () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });
        
        // overwrite 1
        it('overwrite 1', () => {
            try { fs.copyFileSync('test/test1.conf', conf); } catch(e) { assert.isNotOk(1, 'copy'); }
            assert.isOk(1, 'copy');
        });

        it('getStunnerCredentials',   () => {
            cred = auth.getStunnerCredentials();
            assert.isDefined(cred, "defined");
        });
        it('username',   () => { assert.equal(cred.username, 'testuser'); });
        it('credential', () => { assert.equal(cred.credential, 'testpass'); });
        it('realm',      () => { assert.equal(cred.realm, 'testrealm'); });

        // overwrite 2
        it('overwrite 2', () => {
            try { fs.copyFileSync('test/test2.conf', conf); } catch(e) { assert.isNotOk(1, 'copy'); }
            assert.isOk(1, 'copy');
        });

        it('getStunnerCredentials',   () => {
            cred = auth.getStunnerCredentials();
            assert.isDefined(cred, "defined");
        });
        
        it('username defined',      () => { assert.isDefined(cred.username); });
        it('username',              () => { username = parseInt(cred.username); assert.isNotNaN(username); });
        it('duration-1',            () => { assert.isAtMost(Math.floor(Date.now()/1000), username); });
        it('duration-2',            () => { assert.isAtMost(username, Math.floor(Date.now()/1000 + 24 * 60 * 60)); });
        it('credential',            () => { assert.isNotEmpty(cred.credential); });
        it('realm',                 () => { assert.equal(cred.realm, 'testrealm2'); });

        it('unlink', () => {
            try { fs.unlinkSync(conf); } catch(e) { assert.isNotOk(1, 'unlink failed'); }
            assert.isOk(1, 'unlink');
        });
        
        it('getStunnerCredentials', () => { cred = auth.getStunnerCredentials(); assert.isDefined(cred, "defined");});
        it('username',              () => { assert.equal(cred.username, 'user'); });
        it('credential',            () => { assert.equal(cred.credential, 'pass'); });
        it('realm',                 () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });
        
        it('rmtmpdir', () => {
            try { fs.rmSync(tmp_dir, { recursive: true }); } catch(e) { assert.isNotOk(1, 'rmdir failed'); }
            assert.isOk(1, 'rmdir');
        });
    });
    
    context('iceconfig', async () => {
        let config;
        let username;
        let tmp_dir;
        let conf;
        
        it('mkdtemp', () => {
            tmp_dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stunner_auth_lib_test'));
            assert.isDefined(tmp_dir);

            conf = path.join(tmp_dir, filename);
            assert.isDefined(conf);

            process.env.STUNNER_CONFIG_FILENAME = conf;
        });

        it('no config file',  async () => {
            assert.isUndefined(auth.getIceConfig());
        });

        // overwrite 1
        it('overwrite 1', () => {
            try { fs.copyFileSync('test/test1.conf', conf); } catch(e) { assert.isNotOk(1, 'copy'); }
            assert.isOk(1, 'copy');
        });

        it('config-1',    () => { config = auth.getIceConfig(); assert.isDefined(config); });
        it('servers-def', () => { assert.isDefined(config.iceServers); });
        it('servers-len', () => { assert.isNotEmpty(config.iceServers); });
        it('servers-len', () => { assert.lengthOf(config.iceServers, 2); });
        it('url',         () => { assert.isDefined(config.iceServers[0].url); });
        it('proto',       () => { assert.match(config.iceServers[0].url, /^turn/); });
        it('addr',        () => { assert.match(config.iceServers[0].url, /1\.2\.3\.4/); });
        it('port',        () => { assert.match(config.iceServers[0].url, /3478/); });
        it('proto',       () => { assert.match(config.iceServers[0].url, /transport=udp$/); });
        it('username',    () => { assert.equal(config.iceServers[0].username, 'testuser'); });
        it('credential',  () => { assert.equal(config.iceServers[0].credential, 'testpass'); });
        it('url',         () => { assert.isDefined(config.iceServers[1].url); });
        it('proto',       () => { assert.match(config.iceServers[1].url, /^turn/); });
        it('addr',        () => { assert.match(config.iceServers[1].url, /5\.6\.7\.8/); });
        it('port',        () => { assert.match(config.iceServers[1].url, /8743/); });
        it('proto',       () => { assert.match(config.iceServers[1].url, /transport=tcp$/); });
        it('username',    () => { assert.equal(config.iceServers[1].username, 'testuser'); });
        it('credential',  () => { assert.equal(config.iceServers[1].credential, 'testpass'); });
        it('policy',      () => { assert.isDefined(config.iceTransportPolicy); });
        it('relay',       () => { assert.equal(config.iceTransportPolicy, 'relay'); });

        // overwrite 2
        it('overwrite 2', () => {
            try { fs.copyFileSync('test/test2.conf', conf); } catch(e) { assert.isNotOK(1, 'copy'); }
            assert.isOk(1, 'copy');
        });

        it('config-2',         () => { config = auth.getIceConfig(); assert.isDefined(config); });
        it('servers-def',      () => { assert.isDefined(config.iceServers); });
        it('servers-len',      () => { assert.isNotEmpty(config.iceServers); });
        it('servers-len',      () => { assert.lengthOf(config.iceServers, 1); });
        it('url',              () => { assert.isDefined(config.iceServers[0].url); });
        it('proto',            () => { assert.match(config.iceServers[0].url, /^turn/); });
        it('addr',             () => { assert.match(config.iceServers[0].url, /5\.6\.7\.8/); });
        it('port',             () => { assert.match(config.iceServers[0].url, /8743/); });
        it('proto',            () => { assert.match(config.iceServers[0].url, /transport=udp$/); });
        it('username defined', () => { assert.isDefined(config.iceServers[0].username); });
        it('username',         () => { username = parseInt(config.iceServers[0].username); assert.isNotNaN(username); });
        it('duration-1',       () => { assert.isAtMost(Math.floor(Date.now()/1000), username); });
        it('duration-2',       () => { assert.isAtMost(username, Math.floor(Date.now()/1000 + 24 * 60 * 60)); });
        it('policy',           () => { assert.isDefined(config.iceTransportPolicy); });
        it('relay',            () => { assert.equal(config.iceTransportPolicy, 'relay'); });

        it('config-1-override', () => {
            config = auth.getIceConfig({config_file: 'test/test1.conf'});
            assert.isDefined(config);
        });
        it('servers-def', () => { assert.isDefined(config.iceServers); });
        it('servers-len', () => { assert.isNotEmpty(config.iceServers); });
        it('servers-len', () => { assert.lengthOf(config.iceServers, 2); });
        it('url',         () => { assert.isDefined(config.iceServers[0].url); });
        it('proto',       () => { assert.match(config.iceServers[0].url, /^turn/); });
        it('addr',        () => { assert.match(config.iceServers[0].url, /1\.2\.3\.4/); });
        it('port',        () => { assert.match(config.iceServers[0].url, /3478/); });
        it('proto',       () => { assert.match(config.iceServers[0].url, /transport=udp$/); });
        it('username',    () => { assert.equal(config.iceServers[0].username, 'testuser'); });
        it('credential',  () => { assert.equal(config.iceServers[0].credential, 'testpass'); });
        it('url',         () => { assert.isDefined(config.iceServers[1].url); });
        it('proto',       () => { assert.match(config.iceServers[1].url, /^turn/); });
        it('addr',        () => { assert.match(config.iceServers[1].url, /5\.6\.7\.8/); });
        it('port',        () => { assert.match(config.iceServers[1].url, /8743/); });
        it('proto',       () => { assert.match(config.iceServers[1].url, /transport=tcp$/); });
        it('username',    () => { assert.equal(config.iceServers[1].username, 'testuser'); });
        it('credential',  () => { assert.equal(config.iceServers[1].credential, 'testpass'); });
        it('policy',      () => { assert.isDefined(config.iceTransportPolicy); });
        it('relay',       () => { assert.equal(config.iceTransportPolicy, 'relay'); });

        it('unlink', () => {
            try { fs.unlinkSync(conf); } catch(e) { assert.isNotOk(1, 'unlink failed'); }
            assert.isOk(1, 'unlink');
        });

        it('no config file',  async () => {
            assert.isUndefined(auth.getIceConfig());
        });

        it('rmtmpdir', () => {
            try { fs.rmSync(tmp_dir, { recursive: true }); } catch(e) { assert.isNotOk(1, 'rmdir failed'); }
            assert.isOk(1, 'rmdir');
        });
    });
});
