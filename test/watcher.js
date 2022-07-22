const fs     = require('fs');
const os     = require('os');
const path   = require('path');
const assert = require('chai').assert;

process.env.STUNNER_CONFIG_FILENAME = "";
const auth   = require('../index.js');

const READ_TIMEOUT = 1000;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('config file mode', ()  => {
    let cred;
    let username;
    
    context('credentials: fallback', () => {

        // empty config file
        it('no config file',        () => { assert.isUndefined(auth.config.stunner_config, 'file'); });
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
        it('wrong config file', async () => {
            auth.config.init({config_file: "wrong_test.conf"});
            await sleep(READ_TIMEOUT);
            
            assert.isUndefined(auth.config.stunner_config, 'file');
        });

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

        it('stop',       () => {
            auth.config.stop();
            assert.isUndefined(auth.config.stunner_config, 'stop');
        });
    });
        
    context('credentials: correct config', () => {
        it('config-1', async () => {
            auth.config.init({config_file: "test/test1.conf"});
            await sleep(READ_TIMEOUT);

            assert.isDefined(auth.config.stunner_config, 'file');
        });

        it('getStunnerCredentials',   () => {
            cred = auth.getStunnerCredentials();
            assert.isDefined(cred, "defined");
        });
        
        it('username',   () => { assert.equal(cred.username, 'testuser'); });
        it('credential', () => { assert.equal(cred.credential, 'testpass'); });
        it('realm',      () => { assert.equal(cred.realm, 'testrealm'); });

        it('config-2', async () => {
            auth.config.init({config_file: "test/test2.conf"});
            await sleep(READ_TIMEOUT);

            assert.isDefined(auth.config.stunner_config, 'file');
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

        it('stop',       () => {
            auth.config.stop();
            assert.isUndefined(auth.config.stunner_config, 'stop');
        });
    });

    context('credentials: watcher', () => {
        let tmp_dir;
        const filename = 'stunner.conf';
        let conf;
        
        it('empty config file', async () => {
            tmp_dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stunner_auth_lib_test'));
            conf = path.join(tmp_dir, filename);
            auth.config.init({config_file: conf});
            await sleep(READ_TIMEOUT);

            assert.isUndefined(auth.config.stunner_config, 'file');
        });

        // default
        it('getStunnerCredentials', () => { cred = auth.getStunnerCredentials(); assert.isDefined(cred, "defined");});
        it('username',              () => { assert.equal(cred.username, 'user'); });
        it('credential',            () => { assert.equal(cred.credential, 'pass'); });
        it('realm',                 () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });
        
        // overwrite 1
        it('overwrite: config-1', async () => {
            fs.copyFileSync('test/test1.conf', conf);
            await sleep(READ_TIMEOUT);

            assert.isDefined(auth.config.stunner_config, 'file');
        });

        it('getStunnerCredentials',   () => {
            cred = auth.getStunnerCredentials();
            assert.isDefined(cred, "defined");
        });
        
        it('username',   () => { assert.equal(cred.username, 'testuser'); });
        it('credential', () => { assert.equal(cred.credential, 'testpass'); });
        it('realm',      () => { assert.equal(cred.realm, 'testrealm'); });

        // overwrite 2
        it('overwrite: config-2', async () => {
            fs.copyFileSync('test/test2.conf', conf);
            await sleep(READ_TIMEOUT);

            assert.isDefined(auth.config.stunner_config, 'file');
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

        // truncate
        it('unlink', async () => {
            fs.unlinkSync(conf);
            await sleep(READ_TIMEOUT);

            assert.isUndefined(auth.config.stunner_config, 'file');
        });
        
        it('getStunnerCredentials', () => { cred = auth.getStunnerCredentials(); assert.isDefined(cred, "defined");});
        it('username',              () => { assert.equal(cred.username, 'user'); });
        it('credential',            () => { assert.equal(cred.credential, 'pass'); });
        it('realm',                 () => { assert.equal(cred.realm, 'stunner.l7mp.io'); });
        
        it('stop',       () => {
            auth.config.stop();
            try {
                if(tmp_dir){ fs.rmSync(tmpDir, { recursive: true });}
            } catch (e) {
                // ignore
            }

            assert.isUndefined(auth.config.stunner_config, 'stop');
        });
    });

    context('iceconfig', async () => {
        let config;
        let username;
        
        it('no config file',  async () => {
            process.env.STUNNER_CONFIG_FILENAME = "";
            auth.config.init();
            await sleep(READ_TIMEOUT);

            assert.isUndefined(auth.config.stunner_config, 'file');
            assert.isUndefined(auth.getIceConfig());
        });

        it('config-1', async () => {
            auth.config.init({config_file: "test/test1.conf"});
            await sleep(READ_TIMEOUT);
            assert.isDefined(auth.config.stunner_config, 'file');
        });
        it('config',      () => { config = auth.getIceConfig(); assert.isDefined(config); });
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

        it('config-2', async () => {
            auth.config.init({config_file: "test/test2.conf"});
            await sleep(READ_TIMEOUT);
            assert.isDefined(auth.config.stunner_config, 'file');
        });
        it('config',           () => { config = auth.getIceConfig(); assert.isDefined(config); });
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

        it('config-1-from-env', async () => {
            process.env.STUNNER_CONFIG_FILENAME = "test/test1.conf";
            auth.config.init();
            await sleep(READ_TIMEOUT);
            
            assert.isDefined(auth.config.stunner_config, 'file');
        });
        it('config',      () => { config = auth.getIceConfig(); assert.isDefined(config); });
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

        it('stop',       () => {
            auth.config.stop();
            assert.isUndefined(auth.config.stunner_config, 'stop');
        });
    });

    context('iceconfig: watcher', () => {
        let tmp_dir;
        const filename = 'stunner.conf';
        let conf;
        
        it('empty config file', async () => {
            tmp_dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stunner_auth_lib_test'));
            conf = path.join(tmp_dir, filename);
            auth.config.init({config_file: conf});
            await sleep(READ_TIMEOUT);

            assert.isUndefined(auth.config.stunner_config, 'file');
            assert.isUndefined(auth.getIceConfig());
        });

        // overwrite 1
        it('overwrite: config-1', async () => {
            fs.copyFileSync('test/test1.conf', conf);
            await sleep(READ_TIMEOUT);
            assert.isDefined(auth.config.stunner_config, 'file');
        });

        it('config',      () => { config = auth.getIceConfig(); assert.isDefined(config); });
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
        it('overwrite: config-2', async () => {
            fs.copyFileSync('test/test2.conf', conf);
            await sleep(READ_TIMEOUT);

            assert.isDefined(auth.config.stunner_config, 'file');
        });
        it('config',           () => { config = auth.getIceConfig(); assert.isDefined(config); });
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

        // revert
        it('revert: config-1', async () => {
            fs.copyFileSync('test/test1.conf', conf);
            await sleep(READ_TIMEOUT);

            assert.isDefined(auth.config.stunner_config, 'file');
        });
        it('config',      () => { config = auth.getIceConfig(); assert.isDefined(config); });
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

        it('stop',       () => {
            auth.config.stop();
            try {
                if(tmp_dir){ fs.rmSync(tmpDir, { recursive: true });}
            } catch (e) {
                // ignore
            }

            assert.isUndefined(auth.config.stunner_config, 'stop');
        });
    });
});
