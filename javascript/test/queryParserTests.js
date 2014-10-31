'use strict';

describe('Query Parser', function () {

    var queryParser, AST, Token, QueryParser, TokenTypes;

    beforeEach(function () {
        queryParser = window.exports;
        IdAST = queryParser.IdAST;
        Token = queryParser.Token;
        QueryParser = queryParser.QueryParser;
        TokenType = queryParser.TokenType;
    });

    it('can parse an id', function () {
        var query = "login";
        var parser = new QueryParser(query);
        var ast = parser.parse();
        expect(ast instanceof IdAST).toBeTruthy();
        expect(ast.token() instanceof Token).toBeTruthy();
        expect(ast.token().type).toBe(TokenType.ID);
        expect(ast.token().asString()).toBe(query);
    });
});