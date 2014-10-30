/** @jsx React.DOM */

'use strict';

jest.dontMock('../search/queryParser');

describe('UniversalSearch', function () {

    var queryParser, AST, Token, QueryParser, TokenTypes;

    beforeEach(function () {
        queryParser = require('../search/queryParser');
        AST = require('../search/queryParser').AST;
        Token = require('../search/queryParser').Token;
        QueryParser = require('../search/queryParser').QueryParser;
        TokenTypes = require('../search/queryParser').TokenTypes;
    });

    it('can parse a query', function () {
        var query = "login";
        var parser = new QueryParser(query);
        var ast = parser.parse();
        expect(ast instanceof AST).toBeTruthy();
        expect(ast.token instanceof Token).toBeTruthy();
        expect(ast.token.type).toBe(TokenTypes.ID);
        expect(ast.token.asString()).toBe(query);
    });
});