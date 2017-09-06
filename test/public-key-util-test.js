/*
 Copyright 2017 IBM Corp.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const chai = require("chai");
const assert = chai.assert;
const proxyquire = require("proxyquire");
const testServerUrl = "https://mobileclientaccess.ng.bluemix.net/imf-authserver";

describe("/lib/utils/public-key-util", function(){
	console.log("Loading public-key-util-test.js");

	var PublicKeyUtil;

	before(function(){
		PublicKeyUtil = proxyquire("../lib/utils/public-key-util", {
			"request": requestMock
		});
	});

	this.timeout(5000);

	describe('#retrievePublicKeys()', function(){
		it("Should fail retrieving public key from the server", function(done){
			PublicKeyUtil.retrievePublicKeys(testServerUrl + "FAIL-PUBLIC-KEY").then(function(){
				done(new Error("This is impossible!!!"));
			}).catch(function(err){
				done();
			});
		});
	});

	describe("#getPublicKeyPem()", function(){
		it("Should fail to get previously retrieved public key", function(){
			PublicKeyUtil.getPublicKeyPemBykid().then(function (publicKey) {
				assert.isUndefined(publicKey);
			});
		});
	});

	describe('#retrievePublicKeys()', function(){
		it("Should successfully retrieve public key from OAuth server", function(done){
			PublicKeyUtil.retrievePublicKeys(testServerUrl + "SUCCESS-PUBLIC-KEYs").then(function(){
				done();
			}).catch(function(err){
				done(new Error(err));
			});
		});
	});

	describe("#getPublicKeyPem()", function(){
		it("Should get previously retrieved public key", function(){
			PublicKeyUtil.getPublicKeyPemBykid("123").then(function (publicKey){
				assert.isNotNull(publicKey);
				assert.isString(publicKey);
				assert.include(publicKey, "BEGIN RSA PUBLIC KEY");
			});
		});
	});

    describe("#getPublicKeyPemMultipleRequests()", function(){
        it("Should get public keys from multiple requests and empty the requests cache", function(){
            PublicKeyUtil.retrievePublicKeys(testServerUrl + "SETTIMEOUT-PUBLIC-KEYs").then(function(){
			});
            for(i=0;i<5;i++) {
                PublicKeyUtil.getPublicKeyPemBykid("123").then(function (publicKey) {
                    assert.isNotNull(publicKey);
                    assert.isString(publicKey);
                    assert.include(publicKey, "BEGIN RSA PUBLIC KEY");
                });
            }
        });
    });
});

var requestMock = function (options, callback){
	if (options.url.indexOf("FAIL-PUBLIC-KEY") >=0  || options.url.indexOf("FAIL_REQUEST") >= 0){ // Used in public-key-util-test
		return callback(new Error("STUBBED_ERROR"), {statusCode: 0}, null);
	} else if (options.url.indexOf("SUCCESS-PUBLIC-KEY") !== -1){ // Used in public-key-util-test
		return callback(null, { statusCode: 200}, {"keys": [{"n":"1", "e":"2", "kid":"123"}]});
	} else if (options.formData && options.formData.code && options.formData.code.indexOf("FAILING_CODE") !== -1){ // Used in webapp-strategy-test
		return callback(new Error("STUBBED_ERROR"), {statusCode: 0}, null);
	} else if (options.formData && options.formData.code && options.formData.code.indexOf("WORKING_CODE") !== -1){ // Used in webapp-strategy-test
		return callback(null, {statusCode: 200}, JSON.stringify({
			"access_token": "access_token_mock",
			"id_token": "id_token_mock"
		}));
	} else if (options.followRedirect === false){
		return callback(null, {
			statusCode: 302,
			headers: {
				location: "test-location?code=WORKING_CODE"
			}
		});
	} else if (options.url.indexOf("SETTIMEOUT-PUBLIC-KEYs") > -1){
		setTimeout(function() {
            return callback(null, { statusCode: 200}, {"keys": [{"n":"1", "e":"2", "kid":"123"}]});
		}, 3000);
	} else {
		throw "Unhandled case!!!" + JSON.stringify(options);
	}
};
