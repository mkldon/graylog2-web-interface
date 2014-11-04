///<reference path='./../../../node_modules/immutable/dist/Immutable.d.ts'/>
'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Immutable = require('immutable');
var DumpVisitor = (function () {
    function DumpVisitor() {
        this.buffer = [];
    }
    DumpVisitor.prototype.visit = function (ast) {
        if (ast === null) {
            return;
        }
        else if (ast instanceof ExprAST) {
            var expr = ast;
            this.dumpPrefix(ast);
            this.visit(expr.left);
            this.dumpToken(ast.token());
            this.visit(expr.right);
            this.dumpSuffix(ast);
        }
        else if (ast instanceof BaseAST) {
            this.dumpWithPrefixAndSuffix(ast);
        }
    };
    DumpVisitor.prototype.dumpWithPrefixAndSuffix = function (ast) {
        this.dumpPrefix(ast);
        this.dumpToken(ast.token());
        this.dumpSuffix(ast);
    };
    DumpVisitor.prototype.dumpSuffix = function (ast) {
        var _this = this;
        ast.hiddenSuffixTokens().forEach(function (suffix) { return _this.dumpToken(suffix); });
    };
    DumpVisitor.prototype.dumpPrefix = function (ast) {
        var _this = this;
        ast.hiddenPrefixTokens().forEach(function (prefix) { return _this.dumpToken(prefix); });
    };
    DumpVisitor.prototype.dumpToken = function (token) {
        token !== null && this.buffer.push(token.asString());
    };
    DumpVisitor.prototype.result = function () {
        return this.buffer.join("");
    };
    return DumpVisitor;
})();
exports.DumpVisitor = DumpVisitor;
(function (TokenType) {
    TokenType[TokenType["EOF"] = 0] = "EOF";
    TokenType[TokenType["WS"] = 1] = "WS";
    TokenType[TokenType["TERM"] = 2] = "TERM";
    TokenType[TokenType["PHRASE"] = 3] = "PHRASE";
    TokenType[TokenType["AND"] = 4] = "AND";
    TokenType[TokenType["OR"] = 5] = "OR";
    TokenType[TokenType["NOT"] = 6] = "NOT";
})(exports.TokenType || (exports.TokenType = {}));
var TokenType = exports.TokenType;
var BaseAST = (function () {
    function BaseAST() {
        this.hiddenPrefix = Immutable.List.of();
        this.hiddenSuffix = Immutable.List.of();
    }
    BaseAST.prototype.hiddenPrefixTokens = function () {
        return this.hiddenPrefix;
    };
    /* abstract */
    BaseAST.prototype.token = function () {
        return undefined;
    };
    BaseAST.prototype.hiddenSuffixTokens = function () {
        return this.hiddenSuffix;
    };
    return BaseAST;
})();
var ExprAST = (function (_super) {
    __extends(ExprAST, _super);
    function ExprAST(left, op, right) {
        _super.call(this);
        this.left = left;
        this.op = op;
        this.right = right;
        this.left = left;
        this.right = right;
        this.op = op;
    }
    ExprAST.prototype.token = function () {
        return this.op;
    };
    return ExprAST;
})(BaseAST);
exports.ExprAST = ExprAST;
var TermAST = (function (_super) {
    __extends(TermAST, _super);
    function TermAST(term, phrase) {
        _super.call(this);
        this.term = term;
        this.phrase = phrase;
        this.phrase = (phrase !== undefined && phrase) || term.asString().indexOf(" ") !== -1;
    }
    TermAST.prototype.token = function () {
        return this.term;
    };
    return TermAST;
})(BaseAST);
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
        this.eofToken = new Token(this.input, 0 /* EOF */, input.length - 1, input.length - 1);
    }
    QueryLexer.prototype.next = function () {
        var token = this.eofToken;
        var la = this.la();
        if (this.isWhitespace(la)) {
            token = this.whitespace();
        }
        else if (la === 'O' && this.la(1) === 'R' && (this.isWhitespace(this.la(2)) || this.la(2) === null)) {
            token = this.or();
        }
        else if (la === '"') {
            token = this.phrase();
        }
        else if (this.isDigit(la)) {
            token = this.term();
        }
        // FIME: no matching token error instead of EOF
        return token;
    };
    QueryLexer.prototype.or = function () {
        var startPos = this.pos;
        this.consume();
        this.consume();
        return new Token(this.input, 5 /* OR */, startPos, this.pos);
    };
    QueryLexer.prototype.whitespace = function () {
        var startPos = this.pos;
        var la = this.la();
        while (la !== null && this.isWhitespace(la)) {
            this.consume();
            la = this.la();
        }
        return new Token(this.input, 1 /* WS */, startPos, this.pos);
    };
    QueryLexer.prototype.term = function () {
        var startPos = this.pos;
        var la = this.la();
        while (la !== null && this.isDigit(la)) {
            this.consume();
            la = this.la();
        }
        return new Token(this.input, 2 /* TERM */, startPos, this.pos);
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
        return new Token(this.input, 3 /* PHRASE */, startPos, this.pos);
    };
    // TODO: handle escaping using state pattern
    QueryLexer.prototype.isDigit = function (char) {
        return char !== null && (('a' <= char && char <= 'z') || ('A' <= char && char <= 'Z') || ('0' <= char && char <= '9'));
    };
    QueryLexer.prototype.isWhitespace = function (char) {
        return '\n\r \t'.indexOf(char) !== -1;
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
        this.error = null;
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
            if (token.type === 0 /* EOF */) {
                return token;
            }
            this.tokenBuffer.push(token);
        }
        return this.tokenBuffer[la];
    };
    QueryParser.prototype.skipWS = function () {
        return this.syncTo(1 /* WS */);
    };
    QueryParser.prototype.syncTo = function (syncTo) {
        var skippedTokens = Immutable.List.of().asMutable();
        while (this.la().type === syncTo) {
            skippedTokens.push(this.la());
            this.consume();
        }
        return skippedTokens.asImmutable();
    };
    // TODO: Do we rather want to abort the parse here? Send the error?
    QueryParser.prototype.unexpectedToken = function (syncTo) {
        this.error = {
            position: this.lexer.pos,
            message: "Unexpected input"
        };
        this.syncTo(syncTo);
    };
    QueryParser.prototype.parse = function () {
        this.error = null;
        var ast;
        // FIXME: prefix gets lost on complex expression
        var prefix = this.skipWS();
        ast = this.expr();
        ast.hiddenPrefix = ast.hiddenPrefix.merge(prefix);
        var trailingSuffix = this.skipWS();
        ast.hiddenSuffix = ast.hiddenSuffix.merge(trailingSuffix);
        return ast;
    };
    QueryParser.prototype.expr = function () {
        var left = null;
        var op = null;
        var right = null;
        switch (this.la().type) {
            case 2 /* TERM */:
                left = this.term();
                break;
            case 3 /* PHRASE */:
                left = this.phrase();
                break;
            default:
                this.unexpectedToken(0 /* EOF */);
                break;
        }
        left.hiddenSuffix = this.skipWS();
        if (this.la().type === 0 /* EOF */) {
            return left;
        }
        else {
            switch (this.la().type) {
                case 5 /* OR */:
                case 4 /* AND */:
                    op = this.la();
                    this.consume();
                    break;
                default:
                    this.unexpectedToken(0 /* EOF */);
                    break;
            }
            var prefix = this.skipWS();
            right = this.expr();
            right.hiddenPrefix = prefix;
            return new ExprAST(left, op, right);
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
    return QueryParser;
})();
exports.QueryParser = QueryParser;
//# sourceMappingURL=queryParser.js.map