'use strict';
const Client = require('../lib/client');
const fs = require('fs');
const async = require('async');
const _ = require('lodash');
const os = require('os');
const util = require('util');
var eol = os.EOL;
let client = Client();
client.on('open', onOpen);
client.on('error', onError);
client.on('message', onMessage);

function onOpen() {
    client.send(client.apis.krpc.services.get());
}

function onError(err) {
    throw err;
}

function onMessage(response) {
    let serviceResponse = response.results[0];
    serviceResponse = Client.apis.krpc.services.decode(serviceResponse.value);
    async.eachSeries(serviceResponse.services, createService, function (err) {
        if (err) {
            throw err;
        }
        client.socket.close(1000);
    });
}

function createService(service, callback) {
    let fileName = _.kebabCase(service.name) + ".js";
    let filePath = './lib/services/' + fileName;
    fs.writeFile(filePath, buildContent(service), null, callback);
}

function buildContent(service) {
    let content = processDocumentation(service.documentation);
    content += eol;
    service.procedures.forEach(function (procedure) {
        content += getProcedureCode(procedure, service);
    });
    return content;
}

/**
 *
 * @param procedure
 * @param service
 * @returns {*}
 */
function getProcedureCode(procedure, service) {
    let content = eol;
    content += processDocumentation(procedure.documentation, procedure.parameters, procedure.return_type);
    content += 'function ' + _.camelCase(procedure.name) + '(' + addParameter(procedure.parameters) + ') {' + eol;
    content += '\t//todo' + eol;
    content += '}' + eol;
    return content;
}

function processDocumentation(documentation, parameters, returnType) {
    let content = '/**' + eol;
    content += ' * ' + documentation.replace(/\n/g, eol + ' * ');
    if (parameters && parameters.length !== 0) {
        parameters.forEach(function (param) {
            content += documentParam(param);
        });
    }
    if (returnType) {
        content += documentReturnType(returnType);
    }
    content += eol + '*/';
    return content;
}

function documentParam(param) {
    let content = eol + ' * @param ' + getTypeStringFromCode(param.type) + ' ' + param.name;
    return content;
}

function documentReturnType(returnType) {
    let content = ' * @returns ' + getTypeStringFromCode(returnType);
    return content;
}

function addParameter(parameters) {
    if (!parameters || parameters.length === 0) {
        return '';
    }
    //console.log(parameters);
}

const typeCodeMappings = {
    // Values
    0: {originalName: 'NONE', dotNet: 'None', jsDoc: 'void'},
    1: {originalName: 'DOUBLE', dotNet: 'Double', jsDoc: 'number'},
    2: {originalName: 'FLOAT', dotNet: 'Float', jsDoc: 'number'},
    3: {originalName: 'SINT32', dotNet: 'Sint32', jsDoc: 'number'},
    4: {originalName: 'SINT64', dotNet: 'Sint64', jsDoc: 'number'},
    5: {originalName: 'UINT32', dotNet: 'Uint32', jsDoc: 'number'},
    6: {originalName: 'UINT64', dotNet: 'Uint64', jsDoc: 'number'},
    7: {originalName: 'BOOL', dotNet: 'Bool', jsDoc: 'boolean'},
    8: {originalName: 'STRING', dotNet: 'String', jsDoc: 'string'},
    9: {originalName: 'BYTES', dotNet: 'Bytes', jsDoc: 'bytes'},
    // Objects
    100: {originalName: 'CLASS', dotNet: 'Class', jsDoc: 'Object'},
    101: {originalName: 'ENUMERATION', dotNet: 'Enumeration', jsDoc: 'Object'},
    //  Messages
    200: {originalName: 'REQUEST', dotNet: 'Request', jsDoc: 'Object'},
    201: {originalName: 'STREAM_UPDATE', dotNet: 'StreamUpdate', jsDoc: 'Object'},
    202: {originalName: 'STREAM', dotNet: 'Stream', jsDoc: 'Object'},
    203: {originalName: 'STATUS', dotNet: 'Status', jsDoc: 'Object'},
    204: {originalName: 'SERVICES', dotNet: 'Services', jsDoc: 'Object'},
    // Collections
    300: {originalName: 'TUPLE', dotNet: 'Tuple', jsDoc: 'Object'},
    301: {originalName: 'LIST', dotNet: 'List', jsDoc: 'Object'},
    302: {originalName: 'SET', dotNet: 'Set', jsDoc: 'Object'},
    303: {originalName: 'DICTIONARY', dotNet: 'Dictionary', jsDoc: 'Object'}
};

function getTypeStringFromCode(type) {
    let typeString = typeCodeMappings[type.code].jsDoc;
    if (!typeString) {
        throw new Error(util.format("Unable to determine type string for type for %j", type));
    }
    return '{' + typeString + '}';
}
