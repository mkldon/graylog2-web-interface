'use strict';

describe('Query Parser', function () {
    var queryParser, TermAST, Token, QueryParser, TokenType;

    function expectIdentityDump(query) {
        var parser = new QueryParser(query);
        var ast = parser.parse();
        var dumpVisitor = new queryParser.DumpVisitor();
        dumpVisitor.visit(ast);
        var dumped = dumpVisitor.result();
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
        expect(parser.error).toBeNull();
        expect(ast instanceof TermAST).toBeTruthy();
        expect(ast.token() instanceof Token).toBeTruthy();
        expect(ast.token().type).toBe(TokenType.TERM);
        expect(ast.token().asString()).toBe(query);
        expectIdentityDump(query);
    });

    it('can parse a phrase', function () {
        var query = '"login now"';
        var parser = new QueryParser(query);
        var ast = parser.parse();
        expect(parser.error).toBeNull();
        expect(ast instanceof TermAST).toBeTruthy();
        expect(ast.phrase).toBeTruthy();
        expect(ast.token() instanceof Token).toBeTruthy();
        expect(ast.token().type).toBe(TokenType.PHRASE);
        expect(ast.token().asString()).toBe(query);
        expectIdentityDump(query);
    });

    it('can parse an or expression', function () {
        var query = "login OR submit";
        var parser = new QueryParser(query);
        var ast = parser.parse();
        expect(parser.error).toBeNull();
        expect(ast instanceof ExprAST).toBeTruthy();
        expect(ast.left instanceof TermAST).toBeTruthy();
        expect(ast.left.token().type).toBe(TokenType.TERM);

        expect(ast.op.type).toBe(TokenType.OR);
        expect(ast.right instanceof TermAST).toBeTruthy();

        expectIdentityDump(query);
        var dumpVisitor = new queryParser.DumpVisitor();
        dumpVisitor.visit(ast);
        var dumped = dumpVisitor.result();
        expect(dumped).toBe("login OR submit");

    });

    //it('preserves whitespace on dump', function () {
    //    var query = "  login  OR  \n \t  submit   ";
    //    expectIdentityDump(query);
    //    var query = " login ";
    //    expectIdentityDump(query);
    //});

});

