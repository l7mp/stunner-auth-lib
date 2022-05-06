// L7mp: A programmable L7 meta-proxy
//
// Copyright 2019 by its authors.
// Some rights reserved.
//
// Original code taken from: https://github.com/rojo2/turn-credentials

'use strict';

import crypto from 'crypto';

/**
 * ICE configuration Options
 * @typedef {Object} IceConfigurationOptions
 * @property {string} address
 * @property {number} port
 * @property {string} type
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
 * @property {string} type
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
const STUNNER_PUBLIC_ADDR = process.env.STUNNER_PUBLIC_ADDR; // no default!

/**
 * STUNner public port
 * @const {string}
 */
const STUNNER_PUBLIC_PORT = process.env.STUNNER_PUBLIC_PORT || 3478;

/**
 * STUNner TCP transport enabled
 * @const {string}
 */
const STUNNER_TRANSPORT_TCP = process.env.STUNNER_STUNNER_TRANSPORT_TCP || false;

/**
 * STUNner authentication mode
 * @const {string}
 */
const STUNNER_AUTH_TYPE = process.env.STUNNER_AUTH_TYPE || 'plaintext';

/**
 * STUN/TURN realm.
 * @const {string}
 */
const STUNNER_REALM = process.env.STUNNER_REALM || 'stunner.l7mp.io';

/**
 * STUNner username for plaintext authentication.
 * @const {string}
 */
const STUNNER_USERNAME = process.env.STUNNER_USERNAME || 'user';

/**
 * STUNner password for plaintext authentication.
 * @const {string}
 */
const STUNNER_PASSWORD = process.env.STUNNER_PASSWORD || 'pass';

/**
 * Shared secret for long-term credential authentication.
 * @const {string}
 */
const STUNNER_SHARED_SECRET = process.env.STUNNER_SHARED_SECRET || 'secret';

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
const ALGORITHM = 'sha1'

/**
 * Encoding used
 * @const {string}
 */
const ENCODING = 'base64'

/**
 * Creates ICE configuration for STUNner
 * @param {ICEConfigurationOptions} [options]
 * @returns {ICEConfiguration}
 */
export function generateIceConfig({
    address              = STUNNER_PUBLIC_ADDR,
    port                 = STUNNER_PUBLIC_PORT,
    type                 = STUNNER_AUTH_TYPE,
    realm                = STUNNER_REALM,
    username             = STUNNER_USERNAME,
    password             = STUNNER_PASSWORD,
    secret               = STUNNER_SHARED_SECRET,
    duration             = DURATION,
    ice_transport_policy = ICE_TRANSPORT_POLICY,
    algorithm            = ALGORITHM,
    encoding             = ENCODING
}) {
    if(!address){
        console.error("generateIceConfig: invalid STUNner public address, please set " +
                      "STUNNER_PUBLIC_ADDR or specify the address as an argument");
        return undefined;
    }
    
    const cred = generateStunnerCredentials({
        type,
        realm, 
        username,
        password,
        secret,
        duration,
        algorithm,
        encoding,
    });
        
    var config = {
        iceServers: [
            {
                url: `turn:${address}:${port}?transport=udp`,
                username: cred.username,
                credential: cred.password,
            },
        ],
        iceTransportPolicy: ice_transport_policy,
    };
    if(STUNNER_TRANSPORT_TCP){
        config.iceServers.push(
            {
                url: `turn:${address}:${port}?transport=tcp`,
                username: cred.username,
                credential: cred.password,
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
export function generateStunnerCredentials({
    type      = STUNNER_AUTH_TYPE,
    realm     = STUNNER_REALM,
    username  = STUNNER_USERNAME,
    password  = STUNNER_PASSWORD,
    secret    = STUNNER_SHARED_SECRET,
    duration  = DURATION,
    algorithm = ALGORITHM,
    encoding  = ENCODING
}) {
    switch (type.toLowerCase()){
    case 'plaintext':
        return {
            username,
            credential,
            realm,
        };
    case 'longterm':
        const timeStamp = Math.floor(Date.now() / 1000) + duration;
        const hmac = crypto.createHmac(algorithm, secret);
        // const username = `${timeStamp}${SEPARATOR}${userName}`;
        const username = `$timeStamp`;
        const credential = hmac.update(username).digest(encoding);
        return {
            username,
            credential,
            realm,
        };
    default:
        console.error('generateStunnerCredentials: invalid authentication type:', type);
        return undefined;
    }
}

export default generateIceConfig;
