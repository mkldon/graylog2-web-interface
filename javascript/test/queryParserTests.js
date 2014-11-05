'use strict';

describe('Query Parser', function () {
    var queryParser, TermAST, Token, QueryParser, TokenType;

    var expectNoErrors = function (parser) {
        expect(parser.errors.size).toBe(0);
    };

    function expectIdentityDump(query) {
        var parser = new QueryParser(query);
        var ast = parser.parse();
        var dumpVisitor = new queryParser.DumpVisitor();
        dumpVisitor.visit(ast);
        var dumped = dumpVisitor.result();
        expectNoErrors(parser);
        expect(dumped).toBe(query);
    }

    beforeEach(function () {
        queryParser = window.exports;
        TermAST = queryParser.TermAST;
        Token = queryParser.Token;
        QueryParser = queryParser.QueryParser;
        TokenType = queryParser.TokenType;
    });

    it('can parse a term', function () {
        var query = "login";
        var parser = new QueryParser(query);
        var ast = parser.parse();
        expectNoErrors(parser);
        expect(ast instanceof TermAST).toBeTruthy();
        expect(ast.token() instanceof Token).toBeTruthy();
        expect(ast.token().type).toBe(TokenType.TERM);
        expect(ast.token().asString()).toBe(query);
        expectIdentityDump(query);
    });

    //it('can parse two terms', function () {
    //    var query = "login submit";
    //    expectIdentityDump(query);
    //});

    it('can parse a phrase', function () {
        var query = '"login now"';
        var parser = new QueryParser(query);
        var ast = parser.parse();
        expectNoErrors(parser);
        expect(ast instanceof TermAST).toBeTruthy();
        expect(ast.phrase).toBeTruthy();
        expect(ast.token() instanceof Token).toBeTruthy();
        expect(ast.token().type).toBe(TokenType.PHRASE);
        expect(ast.token().asString()).toBe(query);
        expectIdentityDump(query);
    });

    it('can parse an OR expression', function () {
        var query = "login OR submit";
        var parser = new QueryParser(query);
        var ast = parser.parse();
        expectNoErrors(parser);
        expect(ast instanceof ExprAST).toBeTruthy();
        expect(ast.left instanceof TermAST).toBeTruthy();
        expect(ast.left.token().type).toBe(TokenType.TERM);

        expect(ast.op.type).toBe(TokenType.OR);
        expect(ast.right instanceof TermAST).toBeTruthy();

        expectIdentityDump(query);
    });

    it('preserves whitespace on dump of simple expression', function () {
        var query = " login ";
        expectIdentityDump(query);
    });

    it('preserves whitespace on dump of complex expression', function () {
        var query = "  login  OR  \n \t  submit   ";
        expectIdentityDump(query);
    });

    it('can parse an AND expression', function () {
        var query = "login AND submit";
        var parser = new QueryParser(query);
        var ast = parser.parse();
        expectNoErrors(parser);
        expect(ast instanceof ExprAST).toBeTruthy();
        expect(ast.left instanceof TermAST).toBeTruthy();
        expect(ast.left.token().type).toBe(TokenType.TERM);

        expect(ast.op.type).toBe(TokenType.AND);
        expect(ast.right instanceof TermAST).toBeTruthy();

        expectIdentityDump(query);
    });

    it('reports an error when right side of AND is missing', function () {
        var query = "login AND";
        var parser = new QueryParser(query);
        var ast = parser.parse();
        expect(parser.errors.size).toBe(1);
        expect(parser.errors.get(0).message).toBe("Missing right side of expression");
        expect(parser.errors.get(0).position).toBe(8);
    });
});

