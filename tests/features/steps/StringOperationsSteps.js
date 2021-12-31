const {Given, When, Then} = require('@cucumber/cucumber');
const assert = require('assert');
const StringHelpers = require('../../../lib/StringHelpers');

Given('the string {string}', function (originalString) 
{    
    this._orginalString = originalString;
});


When('extracted between {string} and {string}', function (lhs, rhs) 
{
    this._result = StringHelpers.InclusiveRemoveBetween(this._orginalString, lhs, rhs);

});

When('removed within {string} between {string} and {string}', function (marker, lhs, rhs) 
{
    this._result = StringHelpers.RemoveWithinAllStringConstants(this._orginalString, marker, lhs, rhs);
});

When('masking tokenized with quotes: {string} comments: {string}, and escapes: {string}', function (quoteSequence, commentSequence, escapeSequence) 
{
    this._result = StringHelpers.MaskWithinStrings(this._orginalString, quoteSequence, commentSequence, escapeSequence);
});


Then('the result is {string}', function (result) 
{
    assert.equal(this._result, result);
});

Then('there is no change', function () 
{
    assert.equal(this._result, this._orginalString);
});




