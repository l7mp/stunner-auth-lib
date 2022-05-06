// @l7mp/stunner-auth-lib: A library to create ICE configuration and TURN credentials for the
// STUNner Kubernetes ingress gateway for WebRTC
//
// Copyright 2022 by its authors.
// Some rights reserved.
//
// Original code taken from: https://github.com/rojo2/turn-credentials

'use strict';

const crypto = require('crypto');

/**
 * ICE configuration Options
 * @typedef {Object} IceConfigurationOptions
 * @property {string} address
 * @property {number} port
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
 * @property {string} username
 * @property {string} password
 * @property {string} realm
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
 * @property {string} password
 * @property {string} realm
 */

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
 * STUNner UDP transport enabled
 * @const {string}
 */
const STUNNER_TRANSPORT_UDP_ENABLE = true;

/**
 * STUNner TCP transport enabled
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
const DURATION = process.env.DURATION || (24 * 60 * 60);

/**
 * ICE transport policy: either 'all' (generate all ICE candidates) or 'relay' (consider TURN relay candidates only).
 * @const {string}
 */
const ICE_TRANSPORT_POLICY = 'relay';

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

/**
 * Creates ICE configuration for STUNner
 * @param {ICEConfigurationOptions} [options]
 * @returns {ICEConfiguration}
 */
function generateIceConfig(options){
    if(!options)options={};
    let address   = options.address   || process.env.STUNNER_PUBLIC_ADDR   || STUNNER_PUBLIC_ADDR;
    let port      = options.port      || process.env.STUNNER_PUBLIC_PORT   || STUNNER_PUBLIC_PORT;
    let auth_type = options.auth_type || process.env.STUNNER_AUTH_TYPE     || STUNNER_AUTH_TYPE;
    let realm     = options.realm     || process.env.STUNNER_REALM         || STUNNER_REALM;
    let username  = options.username  || process.env.STUNNER_USERNAME      || STUNNER_USERNAME;
    let password  = options.password  || process.env.STUNNER_PASSWORD      || STUNNER_PASSWORD;
    let secret    = options.secret    || process.env.STUNNER_SHARED_SECRET || STUNNER_SHARED_SECRET;
    let duration  = options.duration  || process.env.DURATION              || DURATION;
    let ice_transport_policy = options.ice_transport_policy ||
        process.env.ICE_TRANSPORT_POLICY || ICE_TRANSPORT_POLICY;
    let stunner_transport_udp_enable = options.stunner_transport_udp_enable ||
        process.env.STUNNER_TRANSPORT_UDP_ENABLE || STUNNER_TRANSPORT_UDP_ENABLE;
    let stunner_transport_tcp_enable = options.stunner_transport_tcp_enable ||
        process.env.STUNNER_TRANSPORT_TCP_ENABLE || STUNNER_TRANSPORT_TCP_ENABLE;
    let algorithm = options.algorithm || ALGORITHM;
    let encoding  = options.encoding  || ENCODING;

    if(!address){
        console.error("generateIceConfig: invalid STUNner public address, please set " +
                      "STUNNER_PUBLIC_ADDR or specify the address as an argument");
        return undefined;
    }
    
    const cred = generateStunnerCredentials({
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

    if(stunner_transport_udp_enable){
        config.iceServers.push(
            {
                url: `turn://${address}:${port}?transport=udp`,
                username: cred.username,
                credential: cred.credential,
            }
        );
    }

    if(stunner_transport_tcp_enable){
        config.iceServers.push(
            {
                url: `turn://${address}:${port}?transport=tcp`,
                username: cred.username,
                credential: cred.credential,
            }
        );
    }
    console.log(config);
    return config;
}

/**
 * Creates TURN credentials for STUNner
 * @param {TurnCredentialsOptions} [options]
 * @returns {TurnCredentials}
 */
function generateStunnerCredentials(options){
    if(!options)options={};
    let auth_type = options.auth_type || process.env.STUNNER_AUTH_TYPE     || STUNNER_AUTH_TYPE;
    let realm     = options.realm     || process.env.STUNNER_REALM         || STUNNER_REALM;
    let username  = options.username  || process.env.STUNNER_USERNAME      || STUNNER_USERNAME;
    let password  = options.password  || process.env.STUNNER_PASSWORD      || STUNNER_PASSWORD;
    let secret    = options.secret    || process.env.STUNNER_SHARED_SECRET || STUNNER_SHARED_SECRET;
    let duration  = options.duration  || process.env.DURATION              || DURATION;
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
        const hmac = crypto.createHmac(algorithm, secret);
        const credential = hmac.update(`$timeStamp`).digest(encoding);
        return {
            username: timeStamp,
            credential: credential,
            realm: realm,
        };
    default:
        console.error('generateStunnerCredentials: invalid authentication type:', auth_type);
        return undefined;
    }
}

module.exports.generateIceConfig = generateIceConfig;
module.exports.generateStunnerCredentials = generateStunnerCredentials;
