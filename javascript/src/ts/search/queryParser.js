'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BaseVisitor = (function () {
    function BaseVisitor() {
    }
    BaseVisitor.prototype.visit = function (ast) {
        if (ast === null) {
            return;
        }
        else if (ast instanceof ExpressionListAST) {
            this.visitExpressionListAST(ast);
        }
        else if (ast instanceof ExpressionAST) {
            this.visitExpressionList(ast);
        }
        else if (ast instanceof TermWithFieldAST) {
            this.visitTermWithFieldAST(ast);
        }
        else if (ast instanceof TermAST) {
            this.visitTermAST(ast);
        }
        else if (ast instanceof MissingAST) {
            this.visitMissingAST(ast);
        }
        else {
            throw Error("Encountered AST of unknown type: " + JSON.stringify(ast));
        }
    };
    BaseVisitor.prototype.visitMissingAST = function (ast) {
    };
    BaseVisitor.prototype.visitTermAST = function (ast) {
    };
    BaseVisitor.prototype.visitTermWithFieldAST = function (ast) {
    };
    BaseVisitor.prototype.visitExpressionList = function (ast) {
    };
    BaseVisitor.prototype.visitExpressionListAST = function (ast) {
    };
    return BaseVisitor;
})();
exports.BaseVisitor = BaseVisitor;
var DumpVisitor = (function (_super) {
    __extends(DumpVisitor, _super);
    function DumpVisitor() {
        _super.apply(this, arguments);
        this.buffer = [];
    }
    DumpVisitor.prototype.visitMissingAST = function (ast) {
        this.dumpPrefix(ast);
        this.dumpSuffix(ast);
    };
    DumpVisitor.prototype.visitTermAST = function (ast) {
        this.dumpWithPrefixAndSuffix(ast);
    };
    DumpVisitor.prototype.visitTermWithFieldAST = function (ast) {
        this.dumpWithPrefixAndSuffixWithField(ast);
    };
    DumpVisitor.prototype.visitExpressionList = function (ast) {
        this.dumpPrefix(ast);
        this.visit(ast.left);
        this.dumpToken(ast.op);
        this.visit(ast.right);
        this.dumpSuffix(ast);
    };
    DumpVisitor.prototype.visitExpressionListAST = function (ast) {
        var _this = this;
        this.dumpPrefix(ast);
        var exprList = ast;
        exprList.expressions.forEach(function (expr) { return _this.visit(expr); });
        this.dumpSuffix(ast);
    };
    DumpVisitor.prototype.dumpWithPrefixAndSuffix = function (ast) {
        this.dumpPrefix(ast);
        this.dumpToken(ast.term);
        this.dumpSuffix(ast);
    };
    DumpVisitor.prototype.dumpWithPrefixAndSuffixWithField = function (ast) {
        this.dumpPrefix(ast);
        this.dumpToken(ast.field);
        this.dumpHidden(ast.hiddenColonPrefix);
        this.dumpToken(ast.colon);
        this.dumpHidden(ast.hiddenColonSuffix);
        this.dumpToken(ast.term);
        this.dumpSuffix(ast);
    };
    DumpVisitor.prototype.dumpSuffix = function (ast) {
        this.dumpHidden(ast.hiddenSuffix);
    };
    DumpVisitor.prototype.dumpHidden = function (hidden) {
        var _this = this;
        hidden.forEach(function (token) { return _this.dumpToken(token); });
    };
    DumpVisitor.prototype.dumpPrefix = function (ast) {
        this.dumpHidden(ast.hiddenPrefix);
    };
    DumpVisitor.prototype.dumpToken = function (token) {
        token !== null && this.buffer.push(token.asString());
    };
    DumpVisitor.prototype.result = function () {
        return this.buffer.join("");
    };
    return DumpVisitor;
})(BaseVisitor);
exports.DumpVisitor = DumpVisitor;
(function (TokenType) {
    TokenType[TokenType["EOF"] = 0] = "EOF";
    TokenType[TokenType["WS"] = 1] = "WS";
    TokenType[TokenType["TERM"] = 2] = "TERM";
    TokenType[TokenType["PHRASE"] = 3] = "PHRASE";
    TokenType[TokenType["AND"] = 4] = "AND";
    TokenType[TokenType["OR"] = 5] = "OR";
    TokenType[TokenType["NOT"] = 6] = "NOT";
    TokenType[TokenType["COLON"] = 7] = "COLON";
    TokenType[TokenType["ERROR"] = 8] = "ERROR";
})(exports.TokenType || (exports.TokenType = {}));
var TokenType = exports.TokenType;
var AST = (function () {
    function AST() {
        this.hiddenPrefix = [];
        this.hiddenSuffix = [];
    }
    return AST;
})();
var MissingAST = (function (_super) {
    __extends(MissingAST, _super);
    function MissingAST() {
        _super.apply(this, arguments);
    }
    return MissingAST;
})(AST);
var ExpressionAST = (function (_super) {
    __extends(ExpressionAST, _super);
    function ExpressionAST(left, op, right) {
        _super.call(this);
        this.left = left;
        this.op = op;
        this.right = right;
    }
    return ExpressionAST;
})(AST);
exports.ExpressionAST = ExpressionAST;
var TermAST = (function (_super) {
    __extends(TermAST, _super);
    function TermAST(term) {
        _super.call(this);
        this.term = term;
    }
    TermAST.prototype.isPhrase = function () {
        return this.term.asString().indexOf(" ") !== -1;
    };
    return TermAST;
})(AST);
exports.TermAST = TermAST;
var TermWithFieldAST = (function (_super) {
    __extends(TermWithFieldAST, _super);
    function TermWithFieldAST(field, colon, term) {
        _super.call(this, term);
        this.field = field;
        this.colon = colon;
        this.hiddenColonPrefix = [];
        this.hiddenColonSuffix = [];
    }
    return TermWithFieldAST;
})(TermAST);
exports.TermWithFieldAST = TermWithFieldAST;
var ExpressionListAST = (function (_super) {
    __extends(ExpressionListAST, _super);
    function ExpressionListAST() {
        var expressions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            expressions[_i - 0] = arguments[_i];
        }
        _super.call(this);
        this.expressions = Array();
        this.expressions = this.expressions.concat(expressions);
    }
    ExpressionListAST.prototype.add = function (expr) {
        this.expressions.push(expr);
    };
    return ExpressionListAST;
})(AST);
exports.ExpressionListAST = ExpressionListAST;
var Token = (function () {
    function Token(input, type, beginPos, endPos) {
        this.input = input;
        this.type = type;
        this.beginPos = beginPos;
        this.endPos = endPos;
        this.typeName = TokenType[type];
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
        var token;
        var la = this.la();
        if (la === null) {
            token = this.eofToken;
        }
        else if (this.isWhitespace(la)) {
            token = this.whitespace();
        }
        else if (this.isKeyword("OR") || this.isKeyword("||")) {
            token = this.or();
        }
        else if (this.isKeyword("AND") || this.isKeyword("&&")) {
            token = this.and();
        }
        else if (la === '"') {
            token = this.phrase();
        }
        else if (la === ':') {
            var startPos = this.pos;
            this.consume();
            token = new Token(this.input, 7 /* COLON */, startPos, this.pos);
        }
        else if (la[0] === '\\' && la.length === 1) {
            // we have an escape character, but nothing that is escaped, we consider this an error
            this.pos--;
            var startPos = this.pos;
            this.consume();
            token = new Token(this.input, 8 /* ERROR */, startPos, this.pos);
        }
        else if (this.isTermStart(la)) {
            token = this.term();
        }
        else {
            var startPos = this.pos;
            this.consume();
            token = new Token(this.input, 8 /* ERROR */, startPos, this.pos);
        }
        return token;
    };
    QueryLexer.prototype.isKeyword = function (keyword) {
        for (var i = 0; i < keyword.length; i++) {
            if (this.la(i) !== keyword[i]) {
                return false;
            }
        }
        // be sure that it is not a prefix of something else
        return this.isWhitespace(this.la(i)) || this.la(i) === null;
    };
    QueryLexer.prototype.or = function () {
        var startPos = this.pos;
        this.consume(2);
        return new Token(this.input, 5 /* OR */, startPos, this.pos);
    };
    QueryLexer.prototype.and = function () {
        var startPos = this.pos;
        this.consume(this.la() === '&' ? 2 : 3);
        return new Token(this.input, 4 /* AND */, startPos, this.pos);
    };
    QueryLexer.prototype.whitespace = function () {
        var startPos = this.pos;
        var la = this.la();
        while (this.isWhitespace(la)) {
            this.consume();
            la = this.la();
        }
        return new Token(this.input, 1 /* WS */, startPos, this.pos);
    };
    QueryLexer.prototype.term = function () {
        var startPos = this.pos;
        // consume start character
        this.consume();
        var la = this.la();
        while (this.isTerm(la)) {
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
    QueryLexer.prototype.isDigit = function (char) {
        return char !== null && (('a' <= char && char <= 'z') || ('A' <= char && char <= 'Z') || ('0' <= char && char <= '9'));
    };
    QueryLexer.prototype.isOneOf = function (set, char) {
        return set.indexOf(char) !== -1;
    };
    QueryLexer.prototype.isWhitespace = function (char) {
        return this.isOneOf(' \t\n\r\u3000', char);
    };
    QueryLexer.prototype.isSpecial = function (char) {
        return this.isOneOf('+-!():^[]"{}~*?\\/', char);
    };
    QueryLexer.prototype.isTermStart = function (char) {
        return char !== null && !this.isWhitespace(char) && !this.isSpecial(char);
    };
    QueryLexer.prototype.isTerm = function (char) {
        return this.isTermStart(char) || this.isOneOf('+-', char);
    };
    QueryLexer.prototype.isEscaped = function (char) {
        return char.length === 2 && char[0] === '\\';
    };
    QueryLexer.prototype.consume = function (n) {
        if (n === void 0) { n = 1; }
        this.pos += n;
    };
    QueryLexer.prototype.la = function (la) {
        if (la === void 0) { la = 0; }
        var index = this.pos + la;
        var char = (this.input.length <= index) ? null : this.input[index];
        if (char === '\\') {
            this.consume();
            if (this.input.length <= index) {
                var escapedChar = this.input[index];
                char += escapedChar;
            }
        }
        return char;
    };
    return QueryLexer;
})();
var QueryParser = (function () {
    function QueryParser(input) {
        this.input = input;
        this.errors = [];
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
    QueryParser.prototype.skipHidden = function () {
        var _this = this;
        var skippedTokens = this.syncWhile(1 /* WS */, 8 /* ERROR */);
        skippedTokens.filter(function (token) { return token.type === 8 /* ERROR */; }).forEach(function (errorToken) {
            _this.errors.push({
                position: errorToken.beginPos,
                message: "Unexpected input: '" + errorToken.asString() + "'"
            });
        });
        return skippedTokens;
    };
    QueryParser.prototype.syncWhile = function () {
        var _this = this;
        var syncWhile = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            syncWhile[_i - 0] = arguments[_i];
        }
        var skippedTokens = [];
        while (syncWhile.some(function (type) { return type === _this.la().type; })) {
            skippedTokens.push(this.la());
            this.consume();
        }
        return skippedTokens;
    };
    QueryParser.prototype.syncTo = function (syncTo) {
        var _this = this;
        var skippedTokens = [];
        while (this.la().type !== 0 /* EOF */ && syncTo.every(function (type) { return type !== _this.la().type; })) {
            skippedTokens.push(this.la());
            this.consume();
        }
        return skippedTokens;
    };
    QueryParser.prototype.unexpectedToken = function () {
        var syncTo = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            syncTo[_i - 0] = arguments[_i];
        }
        this.errors.push({
            position: this.la().beginPos,
            message: "Unexpected input"
        });
        return this.syncTo(syncTo);
    };
    QueryParser.prototype.missingToken = function (tokenName) {
        var syncTo = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            syncTo[_i - 1] = arguments[_i];
        }
        this.errors.push({
            position: this.la().beginPos,
            message: "Missing " + tokenName
        });
        return this.syncTo(syncTo);
    };
    QueryParser.prototype.parse = function () {
        this.errors = [];
        var ast;
        var prefix = this.skipHidden();
        if (this.isExpr()) {
            ast = this.exprs();
        }
        else {
            ast = new MissingAST();
        }
        ast.hiddenPrefix = ast.hiddenPrefix.concat(prefix);
        var trailingSuffix = this.skipHidden();
        ast.hiddenSuffix = ast.hiddenSuffix.concat(trailingSuffix);
        return ast;
    };
    QueryParser.prototype.exprs = function () {
        var expr = this.expr();
        if (!this.isExpr()) {
            return expr;
        }
        else {
            var expressionList = new ExpressionListAST();
            expressionList.add(expr);
            while (this.isExpr()) {
                expr = this.expr();
                expressionList.add(expr);
            }
            return expressionList;
        }
    };
    QueryParser.prototype.expr = function () {
        var left = null;
        var op = null;
        var right = null;
        // left
        if (this.isExpr()) {
            left = this.termOrPhrase();
            left.hiddenSuffix = left.hiddenSuffix.concat(this.skipHidden());
        }
        else {
            this.unexpectedToken(0 /* EOF */);
        }
        if (!this.isOperator()) {
            return left;
        }
        else {
            op = this.la();
            this.consume();
            var prefix = this.skipHidden();
            if (this.isExpr()) {
                right = this.expr();
            }
            else {
                this.missingToken("right side of expression", 0 /* EOF */);
                right = new MissingAST();
            }
            right.hiddenPrefix = prefix;
            return new ExpressionAST(left, op, right);
        }
    };
    QueryParser.prototype.isFirstOf = function () {
        var _this = this;
        var tokenTypes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tokenTypes[_i - 0] = arguments[_i];
        }
        return tokenTypes.some(function (tokenType) { return _this.la().type === tokenType; });
    };
    QueryParser.prototype.isExpr = function () {
        return this.isFirstOf(2 /* TERM */, 3 /* PHRASE */);
    };
    QueryParser.prototype.isOperator = function () {
        return this.isFirstOf(5 /* OR */, 4 /* AND */);
    };
    QueryParser.prototype.termOrPhrase = function () {
        var termOrField = this.la();
        this.consume();
        var wsAfterTermOrField = this.skipHidden();
        if (this.la().type === 7 /* COLON */) {
            var colon = this.la();
            this.consume();
            var prefixAfterColon = this.skipHidden();
            if (this.la().type === 2 /* TERM */ || this.la().type === 3 /* PHRASE */) {
                var term = this.la();
                this.consume();
                var ast = new TermWithFieldAST(termOrField, colon, term);
                ast.hiddenColonPrefix = wsAfterTermOrField;
                ast.hiddenColonSuffix = prefixAfterColon;
                return ast;
            }
            else {
                var skippedTokens = this.missingToken("term or phrase for field", 0 /* EOF */);
                var ast = new TermWithFieldAST(termOrField, colon, null);
                ast.hiddenColonPrefix = wsAfterTermOrField;
                ast.hiddenColonSuffix = prefixAfterColon;
                ast.hiddenSuffix = skippedTokens;
                return ast;
            }
        }
        var termAST = new TermAST(termOrField);
        termAST.hiddenSuffix = wsAfterTermOrField;
        return termAST;
    };
    return QueryParser;
})();
exports.QueryParser = QueryParser;
//# sourceMappingURL=queryParser.js.map