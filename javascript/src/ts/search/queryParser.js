'use strict';
(function (TokenType) {
    TokenType[TokenType["ID"] = 0] = "ID";
    TokenType[TokenType["AND"] = 1] = "AND";
    TokenType[TokenType["OR"] = 2] = "OR";
    TokenType[TokenType["NOT"] = 3] = "NOT";
    TokenType[TokenType["EOF"] = 4] = "EOF";
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
    return ExprAST;
})();
exports.ExprAST = ExprAST;
var IdAST = (function () {
    function IdAST(id) {
        this.id = id;
        this.id = id;
    }
    IdAST.prototype.token = function () {
        return this.id;
    };
    return IdAST;
})();
exports.IdAST = IdAST;
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
        var la = this._la();
        if (this.isDigit(la)) {
            token = this.id();
        }
        return token;
    };
    QueryLexer.prototype.id = function () {
        var startPos = this.pos;
        var la = this._la();
        while (la !== -1 && this.isDigit(la)) {
            this.consume();
            la = this._la();
        }
        return new Token(this.input, 0 /* ID */, startPos, this.pos);
    };
    // TODO: handle escaping using state pattern
    QueryLexer.prototype.isDigit = function (char) {
        return ('a' <= char && char <= 'z') || ('A' <= char && char <= 'Z') || ('0' <= char && char <= '9');
    };
    QueryLexer.prototype.consume = function () {
        this.pos++;
    };
    QueryLexer.prototype._la = function (la) {
        if (la === void 0) { la = 0; }
        var index = this.pos + la;
        return (this.input.length <= index) ? -1 : this.input[index];
    };
    return QueryLexer;
})();
var QueryParser = (function () {
    function QueryParser(input) {
        this.input = input;
        this.lexer = new QueryLexer(input);
        this._currentToken = null;
    }
    QueryParser.prototype.next = function () {
        if (!this._currentToken) {
            this._currentToken = this.lexer.next();
        }
        return this._currentToken;
    };
    QueryParser.prototype.consume = function () {
        this._currentToken = null;
    };
    QueryParser.prototype.parse = function () {
        return this.expr();
    };
    QueryParser.prototype.expr = function () {
        var ast = null;
        var token = this.next();
        if (token !== null && token.type === 0 /* ID */) {
            ast = new IdAST(token);
            this.consume();
        }
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