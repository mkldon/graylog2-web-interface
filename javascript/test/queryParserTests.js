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
        expect(ast.term instanceof Token).toBeTruthy();
        expect(ast.term.type).toBe(TokenType.TERM);
        expect(ast.term.asString()).toBe(query);
        expectIdentityDump(query);
    });

    it('can parse two terms', function () {
        var query = "login submit";
        expectIdentityDump(query);
    });

    it('can parse a term in a field', function () {
        var query = "action:login";
        expectIdentityDump(query);
    });

    it('can parse a phrase in a field', function () {
        var query = 'action:"login now"';
        expectIdentityDump(query);
    });

    it('can parse a phrase', function () {
        var query = '"login now"';
        var parser = new QueryParser(query);
        var ast = parser.parse();
        expectNoErrors(parser);
        expect(ast instanceof TermAST).toBeTruthy();
        expect(ast.isPhrase()).toBeTruthy();
        expect(ast.term instanceof Token).toBeTruthy();
        expect(ast.term.type).toBe(TokenType.PHRASE);
        expect(ast.term.asString()).toBe(query);
        expectIdentityDump(query);
    });

    it('can parse a phrase and a term', function () {
        var query = '"login now" submit';
        expectIdentityDump(query);
    });

    it('can parse a term and a phrase', function () {
        var query = 'submit "login now"';
        expectIdentityDump(query);
    });

    it('can parse many terms with ws', function () {
        var query = '  submit  "login now" logout ';
        expectIdentityDump(query);
    });

    it('can parse an OR expression', function () {
        var query = "login OR submit";
        var parser = new QueryParser(query);
        var ast = parser.parse();
        expectNoErrors(parser);
        expect(ast instanceof ExpressionAST).toBeTruthy();
        expect(ast.left instanceof TermAST).toBeTruthy();
        expect(ast.left.term.type).toBe(TokenType.TERM);

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
        expect(ast instanceof ExpressionAST).toBeTruthy();
        expect(ast.left instanceof TermAST).toBeTruthy();
        expect(ast.left.term.type).toBe(TokenType.TERM);

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

    it('reports an error when colon after field is followed by ws', function () {
        var query = 'action: login now';
        var parser = new QueryParser(query);
        var ast = parser.parse();
        expect(parser.errors.size).toBe(1);
        expect(parser.errors.get(0).message).toBe("Missing term or phrase for field");
        expect(parser.errors.get(0).position).toBe(7);
    });


});

