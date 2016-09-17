'use strict';
require('../../init');
let Client = require('../../../lib/client');

describe('Get-clients', function () {
    it('Should work', function (done) {
        let client = Client();
        client.on('open', onOpen(client));
        client.on('error', onError(done));
        client.on('message', onMessage(done));
    });
});

function onOpen(client) {
    return function () {
        client.send(client.apis.krpc.clients.get());
    };
}

function onError(done) {
    return function (err) {
        done(err);
    };
}

function onMessage(done) {
    return function (response) {
        expect(response.error).to.not.be.ok();
        expect(response.results.length).to.equal(1);
        let clientsResponse = response.results[0];
        expect(clientsResponse.error).to.not.be.ok();
        let clients = Client.apis.krpc.clients.decode(clientsResponse.value);
        expect(clients).to.be.ok();
        return done();
    };
}