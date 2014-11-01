///<reference path='./../../../node_modules/immutable/dist/Immutable.d.ts'/>
'use strict';
var Immutable = require('immutable');
var DumpVisitor = (function () {
    function DumpVisitor() {
        this.buffer = [];
    }
    DumpVisitor.prototype.visit = function (ast) {
        var _this = this;
        this.buffer.push(ast.token().asString());
        ast.children().forEach(function (child) { return _this.visit(child); });
    };
    DumpVisitor.prototype.result = function () {
        return this.buffer.join("");
    };
    return DumpVisitor;
})();
exports.DumpVisitor = DumpVisitor;
(function (TokenType) {
    TokenType[TokenType["TERM"] = 0] = "TERM";
    TokenType[TokenType["PHRASE"] = 1] = "PHRASE";
    TokenType[TokenType["AND"] = 2] = "AND";
    TokenType[TokenType["OR"] = 3] = "OR";
    TokenType[TokenType["NOT"] = 4] = "NOT";
})(exports.TokenType || (exports.TokenType = {}));
var TokenType = exports.TokenType;
var ExprAST = (function () {
    function ExprAST(op, left, right) {
        this.op = op;
        this.left = left;
        this.right = right;
        this.left = left;
        this.right = right;
        this.op = op;
    }
    ExprAST.prototype.token = function () {
        return this.op;
    };
    ExprAST.prototype.children = function () {
        return Immutable.List.of(this.left, this.right);
    };
    return ExprAST;
})();
exports.ExprAST = ExprAST;
var TermAST = (function () {
    function TermAST(term, phrase) {
        this.term = term;
        this.phrase = phrase;
        this.phrase = (phrase !== undefined && phrase) || term.asString().indexOf(" ") !== -1;
    }
    TermAST.prototype.token = function () {
        return this.term;
    };
    TermAST.prototype.children = function () {
        return Immutable.List.of();
    };
    return TermAST;
})();
exports.TermAST = TermAST;
var Token = (function () {
    function Token(input, type, beginPos, endPos) {
        this.input = input;
        this.type = type;
        this.beginPos = beginPos;
        this.endPos = endPos;
    }
    Token.prototype.asString = function () {
        return this.input.substring(this.beginPos, this.endPos);
    };
    return Token;
})();
exports.Token = Token;
var QueryLexer = (function () {
    function QueryLexer(input) {
        this.input = input;
        this.pos = 0;
    }
    QueryLexer.prototype.next = function () {
        var token = null;
        var la = this.la();
        if (this.isDigit(la)) {
            token = this.term();
        }
        else if (la === '"') {
            token = this.phrase();
        }
        return token;
    };
    QueryLexer.prototype.term = function () {
        var startPos = this.pos;
        var la = this.la();
        while (la !== null && this.isDigit(la)) {
            this.consume();
            la = this.la();
        }
        return new Token(this.input, 0 /* TERM */, startPos, this.pos);
    };
    QueryLexer.prototype.phrase = function () {
        var startPos = this.pos;
        this.consume(); // skip starting "
        var la = this.la();
        while (la !== null && la !== '"') {
            this.consume();
            la = this.la();
        }
        this.consume(); // skip ending "
        return new Token(this.input, 1 /* PHRASE */, startPos, this.pos);
    };
    // TODO: handle escaping using state pattern
    QueryLexer.prototype.isDigit = function (char) {
        return char !== null && (('a' <= char && char <= 'z') || ('A' <= char && char <= 'Z') || ('0' <= char && char <= '9'));
    };
    QueryLexer.prototype.consume = function () {
        this.pos++;
    };
    QueryLexer.prototype.la = function (la) {
        if (la === void 0) { la = 0; }
        var index = this.pos + la;
        return (this.input.length <= index) ? null : this.input[index];
    };
    return QueryLexer;
})();
/**
 * Parser for http://lucene.apache.org/core/2_9_4/queryparsersyntax.html
 */
var QueryParser = (function () {
    function QueryParser(input) {
        this.input = input;
        this.lexer = new QueryLexer(input);
        this.tokenBuffer = [];
    }
    QueryParser.prototype.consume = function () {
        this.tokenBuffer.splice(0, 1);
    };
    QueryParser.prototype.la = function (la) {
        if (la === void 0) { la = 0; }
        while (la >= this.tokenBuffer.length) {
            var token = this.lexer.next();
            if (token === null) {
                return null;
            }
            this.tokenBuffer.push(token);
        }
        return this.tokenBuffer[la];
    };
    QueryParser.prototype.parse = function () {
        return this.expr();
    };
    QueryParser.prototype.expr = function () {
        var left = null;
        var token = this.la();
        if (token !== null && token.type === 0 /* TERM */) {
            left = this.term();
        }
        else if (token !== null && token.type === 1 /* PHRASE */) {
            left = this.phrase();
        }
        if (this.la() === null) {
            return left;
        }
    };
    QueryParser.prototype.term = function () {
        var token = this.la();
        this.consume();
        var ast = new TermAST(token);
        return ast;
    };
    QueryParser.prototype.phrase = function () {
        var token = this.la();
        this.consume();
        var ast = new TermAST(token, true);
        return ast;
    };
    QueryParser.prototype.and = function () {
    };
    QueryParser.prototype.or = function () {
    };
    QueryParser.prototype.not = function () {
    };
    return QueryParser;
})();
exports.QueryParser = QueryParser;
//# sourceMappingURL=queryParser.js.map