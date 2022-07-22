// @l7mp/stunner-auth-lib: A library to create ICE configuration and TURN credentials for the
// STUNner Kubernetes ingress gateway for WebRTC
//
// Copyright 2022 by its authors.
// Some rights reserved.
//
// Original code taken from: https://github.com/rojo2/turn-credentials

'use strict';

const crypto           = require('crypto');
const {watch,readFile} = require('node:fs/promises');
const {setTimeout}     = require('node:timers/promises');

/**
 * ICE configuration Options
 * @typedef {Object} IceConfigurationOptions
 * @property {string} address
 * @property {number} port
 * @property {string} protocol
 * @property {string} auth_type
 * @property {string} realm
 * @property {string} username
 * @property {string} password
 * @property {string} secret
 * @property {number} [duration=24*3600]
 * @property {string} [algorithm=sha1]
 * @property {string} [encoding=base64]
 */

/**
 * ICE Configuration
 * @typedef {Object} IceConfiguration
 * @property {array} IceServers
 * @property {string} iceTransportPolicy
 */

/**
 * TURN Credential Options
 * @typedef {Object} TurnCredentialOptions
 * @property {string} auth_type
 * @property {string} realm
 * @property {string} username
 * @property {string} password
 * @property {string} secret
 * @property {number} [duration=24*3600]
 * @property {string} [algorithm=sha1]
 * @property {string} [encoding=base64]
 */

/**
 * TURN Credentials
 * @typedef {Object} TurnCredentials
 * @property {string} username
 * @property {string} credential
 * @property {string} realm
 */

/**
 * STUNner config file name
 * @const {string}
 */
const STUNNER_CONFIG_FILENAME = '/etc/stunnerd/stunnerd.conf';

/**
 * STUNner public address
 * @const {string}
 */
const STUNNER_PUBLIC_ADDR = "";  // no default!

/**
 * STUNner public port
 * @const {string}
 */
const STUNNER_PUBLIC_PORT = 3478;

/**
 * STUNner default protocol
 * @const {string}
 */
const STUNNER_TRANSPORT_PROTOCOL = "UDP";

/**
 * STUNner UDP transport enabled (only used in fallback mode)
 * @const {string}
 */
const STUNNER_TRANSPORT_UDP_ENABLE = true;

/**
 * STUNner TCP transport enabled (only used in fallback mode)
 * @const {string}
 */
const STUNNER_TRANSPORT_TCP_ENABLE = false;

/**
 * STUNner authentication mode
 * @const {string}
 */
const STUNNER_AUTH_TYPE = 'plaintext';

/**
 * STUN/TURN realm.
 * @const {string}
 */
const STUNNER_REALM = 'stunner.l7mp.io';

/**
 * STUNner username for plaintext authentication.
 * @const {string}
 */
const STUNNER_USERNAME = 'user';

/**
 * STUNner password for plaintext authentication.
 * @const {string}
 */
const STUNNER_PASSWORD = 'pass';

/**
 * Shared secret for long-term credential authentication.
 * @const {string}
 */
const STUNNER_SHARED_SECRET = 'my-secret';

/**
 * Credential lifetime for long-term credential authentication.
 * @const {string}
 */
const DURATION = process.env.STUNNER_DURATION || (24 * 60 * 60);

/**
 * ICE transport policy: either 'all' (generate all ICE candidates) or 'relay' (consider TURN relay candidates only).
 * @const {string}
 */
const STUNNER_ICE_TRANSPORT_POLICY = 'relay';

/**
 * Algorithm
 * @const {string}
 */
const ALGORITHM = 'sha1';

/**
 * Encoding used
 * @const {string}
 */
const ENCODING = 'base64';

const CONFIG_FILE_READ_INTERVAL = 500;

/**
 * Creates ICE configuration for STUNner. If STUNner config file is available, ignores the options,
 * otherwise it falls back to operatorless mode: it uses environment variables overridden by the
 * options argument to generate the ICE server config
 * @param {ICEConfigurationOptions} [options]
 * @returns {ICEConfiguration}
 */
function getIceConfig(options){
    if(config.stunner_config !== undefined){
        return config.getIceConfig(options);
    }

    return getIceConfigFallback(options);
}

/**
 * Creates TURN credentials for STUNner
 * @param {TurnCredentialsOptions} [options]
 * @returns {TurnCredentials}
 */
// should get the same output as https://pkg.go.dev/github.com/pion/turn/v2#GenerateLongTermCredentials
function getStunnerCredentials(options){
    if(config.stunner_config !== undefined){
        return config.getStunnerCredentials(options);
    }

    return getStunnerCredentialsFallback(options);
}

/*********************************
 *
 * Default mode: watch the STUNner config file to generate an ICE server config
 *
 *********************************/
class StunnerConfig {
    constructor(options){
        // this.ac = new AbortController();        
        this.init(options);
    }

    async init(options){
        if(!options)options={};
        this.config_file = options.config_file ||
            process.env.STUNNER_CONFIG_FILENAME || STUNNER_CONFIG_FILENAME;            

        // abort old watcher and create a new one
        if(this.ac !== undefined){
            this.ac.abort();
        }
        this.ac = new AbortController();
        const { signal } = this.ac;
        const filename = this.config_file;
        
        try {
            const watcher = watch(filename, {signal});

            // initial read
            await this.read(filename);

            // watch
            for await (const event of watcher) {
                await this.read(filename);
            }
        } catch(err){
            if (err.name === 'AbortError'){
                return;
            }
            
            // console.error(`Could not read STUNNer config file ${filename}:`, err.toString());
            this.stunner_config = undefined;

            setTimeout(CONFIG_FILE_READ_INTERVAL, undefined, {signal}).then(
                () => { this.init(options); }).catch((err) => {
                    if (err.name === 'AbortError'){
                        return;
                    }
                });
        }
    }

    async read(filename){
        try {
            const data = await readFile(filename);
            const conf = JSON.parse(data);
            if(conf !== undefined &&
               conf.version !== undefined && conf.version === "v1alpha1" &&
               conf.auth !== undefined
              ){
                  this.stunner_config = conf;
                  console.log(`Successfully read STUNner config file ${filename}, version: ${this.stunner_config.version}`);
              } else {
                  throw new Error("Invalid config file");
              }
        } catch(err){
            // console.log(`Read error for ${filename}: ${err.toString()}`);
            throw err;
        }
    }

    stop(){
        if(this.ac !== undefined){
            this.ac.abort();
            this.ac = undefined;
            this.stunner_config = undefined;
        }
    }

    getIceConfig(options){
        if(this.stunner_config === undefined || this.stunner_config.listeners == undefined){
            return undefined;
        }
        
        if(!options)options={};
        let ice_transport_policy = options.ice_transport_policy ||
                process.env.STUNNER_ICE_TRANSPORT_POLICY || STUNNER_ICE_TRANSPORT_POLICY;
        
        const cred = getStunnerCredentials(options);
        var iceConfig = {
            iceServers: [],
            iceTransportPolicy: ice_transport_policy,
        };
        
        for(const l of this.stunner_config.listeners) {
            let address = options.address  || l.public_address || process.env.STUNNER_PUBLIC_ADDR  ||
                    STUNNER_PUBLIC_ADDR;
            let port = options.port || l.public_port || l.port || process.env.STUNNER_PUBLIC_PORT ||
                    STUNNER_PUBLIC_PORT;
            let proto = options.protocol || l.protocol || process.env.STUNNER_PROTOCOL ||
                    STUNNER_TRANSPORT_PROTOCOL;
            
            if(!address){
                console.error("getIceConfig: invalid STUNner public address in config file "+
                              this.config_file + ": ICE configuration will be invalid");
            }
            
            iceConfig.iceServers.push(
                {
                    url: `turn:${address}:${port}?transport=${proto}`,
                    username: cred.username,
                    credential: cred.credential,
                }
            );
        }
        
        return iceConfig;
    }
    
    getStunnerCredentials(options){
        if(!options)options={};
        let auth_type = options.auth_type || this.stunner_config.auth.type                 || STUNNER_AUTH_TYPE;
        let realm     = options.realm     || this.stunner_config.auth.realm                || STUNNER_REALM;
        let username  = options.username  || this.stunner_config.auth.credentials.username || STUNNER_USERNAME;
        let password  = options.password  || this.stunner_config.auth.credentials.password || STUNNER_PASSWORD;
        let secret    = options.secret    || this.stunner_config.auth.credentials.secret   || STUNNER_SHARED_SECRET;
        let duration  = options.duration  || process.env.STUNNER_DURATION                  || DURATION;
        let algorithm = options.algorithm || ALGORITHM;
        let encoding  = options.encoding  || ENCODING;
        
        switch (auth_type.toLowerCase()){
        case 'plaintext':
            return {
                username: username,
                credential: password,
                realm: realm,
            };

        case 'longterm':
            const timeStamp = Math.floor(Date.now() / 1000) + parseInt(duration);
            return getLongtermForTimeStamp(timeStamp, secret, realm, algorithm, encoding);

        default:
            console.error('getStunnerCredentialsFromStunnerConfig: invalid authentication type:', auth_type);
            return undefined;
        }
    };
};

/*********************************
 *
 * Fallback mode: as long as no STUNner config file is available, use the environment 
 * variables overridden by the options argument to generate the ICE server configs
 *
 *********************************/
function getIceConfigFallback(options){
    if(!options)options={};
    let address   = options.address   || process.env.STUNNER_PUBLIC_ADDR   || STUNNER_PUBLIC_ADDR;
    let port      = options.port      || process.env.STUNNER_PUBLIC_PORT   || STUNNER_PUBLIC_PORT;
    let auth_type = options.auth_type || process.env.STUNNER_AUTH_TYPE     || STUNNER_AUTH_TYPE;
    let realm     = options.realm     || process.env.STUNNER_REALM         || STUNNER_REALM;
    let username  = options.username  || process.env.STUNNER_USERNAME      || STUNNER_USERNAME;
    let password  = options.password  || process.env.STUNNER_PASSWORD      || STUNNER_PASSWORD;
    let secret    = options.secret    || process.env.STUNNER_SHARED_SECRET || STUNNER_SHARED_SECRET;
    let duration  = options.duration  || process.env.STUNNER_DURATION      || DURATION;
    let ice_transport_policy = options.ice_transport_policy ||
            process.env.STUNNER_ICE_TRANSPORT_POLICY || STUNNER_ICE_TRANSPORT_POLICY;
    let algorithm = options.algorithm || ALGORITHM;
    let encoding  = options.encoding  || ENCODING;

    // special-case boolean conf
    let transport_udp_enable = STUNNER_TRANSPORT_UDP_ENABLE;
    if ("STUNNER_TRANSPORT_UDP_ENABLE" in process.env){
        transport_udp_enable = process.env.STUNNER_TRANSPORT_UDP_ENABLE;
        if(transport_udp_enable === "0") transport_udp_enable = false;
    }
    if (typeof options.transport_udp_enable !== 'undefined') {
        transport_udp_enable = options.transport_udp_enable;
    }

    let transport_tcp_enable = STUNNER_TRANSPORT_TCP_ENABLE;
    if ("STUNNER_TRANSPORT_TCP_ENABLE" in process.env){
        transport_tcp_enable = process.env.STUNNER_TRANSPORT_TCP_ENABLE;
        if(transport_tcp_enable === "0") transport_tcp_enable = false;
    }
    if (typeof options.transport_tcp_enable !== 'undefined') {
        transport_tcp_enable = options.transport_tcp_enable;
    }
    
    if(!address){
        console.error("getIceConfig: invalid STUNner public address, please set " +
                      "STUNNER_PUBLIC_ADDR or specify the address as an argument");
        return undefined;
    }
    
    const cred = getStunnerCredentials({
        auth_type: auth_type,
        realm: realm, 
        username: username,
        password: password,
        secret: secret,
        duration: duration,
        ice_transport_policy: ice_transport_policy,
        algorithm: algorithm,
        encoding: encoding,
    });
    
    var config = {
        iceServers: [],
        iceTransportPolicy: ice_transport_policy,
    };

    if(transport_udp_enable){
        config.iceServers.push(
            {
                url: `turn:${address}:${port}?transport=udp`,
                username: cred.username,
                credential: cred.credential,
            }
        );
    }

    if(transport_tcp_enable){
        config.iceServers.push(
            {
                url: `turn:${address}:${port}?transport=tcp`,
                username: cred.username,
                credential: cred.credential,
            }
        );
    }
    return config;
}

/**
 * Creates TURN credentials for STUNner
 * @param {TurnCredentialsOptions} [options]
 * @returns {TurnCredentials}
 */
// should get the same output as https://pkg.go.dev/github.com/pion/turn/v2#GenerateLongTermCredentials
function getStunnerCredentialsFallback(options){
    if(!options)options={};
    let auth_type = options.auth_type || process.env.STUNNER_AUTH_TYPE     || STUNNER_AUTH_TYPE;
    let realm     = options.realm     || process.env.STUNNER_REALM         || STUNNER_REALM;
    let username  = options.username  || process.env.STUNNER_USERNAME      || STUNNER_USERNAME;
    let password  = options.password  || process.env.STUNNER_PASSWORD      || STUNNER_PASSWORD;
    let secret    = options.secret    || process.env.STUNNER_SHARED_SECRET || STUNNER_SHARED_SECRET;
    let duration  = options.duration  || process.env.STUNNER_DURATION      || DURATION;
    let algorithm = options.algorithm || ALGORITHM;
    let encoding  = options.encoding  || ENCODING;

    switch (auth_type.toLowerCase()){
    case 'plaintext':
        return {
            username: username,
            credential: password,
            realm: realm,
        };
    case 'longterm':
        const timeStamp = Math.floor(Date.now() / 1000) + parseInt(duration);
        return getLongtermForTimeStamp(timeStamp, secret, realm, algorithm, encoding);
    default:
        console.error('getStunnerCredentialsFallback: invalid authentication type:', auth_type);
        return undefined;
    }
}

// separated out for testing
function getLongtermForTimeStamp(timeStamp, secret, realm, algorithm, encoding){
    // console.log(timeStamp, secret, realm, algorithm, encoding);
    const hmac = crypto.createHmac(algorithm, secret);
    const password = hmac.update(Buffer.from(`${timeStamp}`, 'utf-8'));
    // console.log(password.digest('hex'));
    const credential = password.digest(encoding);
    return {
        username: `${timeStamp}`,
        credential: credential,
        realm: realm,
    };
}

var config = new StunnerConfig();

module.exports.getIceConfig = getIceConfig;
module.exports.getStunnerCredentials = getStunnerCredentials;
module.exports.getLongtermForTimeStamp = getLongtermForTimeStamp;
module.exports.config = config;
