///<reference path='./../../../node_modules/immutable/dist/Immutable.d.ts'/>
'use strict';

// parser for http://lucene.apache.org/core/2_9_4/queryparsersyntax.html

export interface Visitor {
    visit(ast: AST);
}

export class DumpVisitor implements Visitor {
    private buffer = [];

    visit(ast: AST) {
        if (ast === null) {
            return;
        } else if (ast instanceof ExpressionListAST) {
            this.dumpPrefix(ast);
            var exprList = <ExpressionListAST>ast;
            exprList.expressions.forEach((expr) => this.visit(expr));
            this.dumpSuffix(ast);
        } else if (ast instanceof ExpressionAST) {
            var expr = <ExpressionAST>ast;
            this.dumpPrefix(ast);
            this.visit(expr.left);
            this.dumpToken(expr.op);
            this.visit(expr.right);
            this.dumpSuffix(ast);
        } else if (ast instanceof TermWithFieldAST) {
            this.dumpWithPrefixAndSuffixWithField(ast);
        } else if (ast instanceof TermAST) {
            this.dumpWithPrefixAndSuffix(ast);
        } else if (ast instanceof BaseAST) {
            this.dumpPrefix(ast);
            this.dumpSuffix(ast);
        }
    }

    private dumpWithPrefixAndSuffix(ast: TermAST) {
        this.dumpPrefix(ast);
        this.dumpToken(ast.term);
        this.dumpSuffix(ast);
    }

    private dumpWithPrefixAndSuffixWithField(ast: TermWithFieldAST) {
        this.dumpPrefix(ast);
        this.dumpToken(ast.field);
        this.dumpToken(ast.colon);
        this.dumpToken(ast.term);
        this.dumpSuffix(ast);
    }

    private dumpSuffix(ast: AST) {
        ast.hiddenSuffix.forEach((suffix) => this.dumpToken(suffix));
    }

    private dumpPrefix(ast: AST) {
        ast.hiddenPrefix.forEach((prefix) => this.dumpToken(prefix));
    }
    private dumpToken(token: Token) {
        token !== null && this.buffer.push(token.asString());
    }

    result() {
        return this.buffer.join("");
    }

}

export enum TokenType {
    EOF, WS, TERM, PHRASE, AND, OR, NOT, COLON, ERROR
}

export interface AST {
    hiddenPrefix: Array<Token>;
    hiddenSuffix: Array<Token>;
}

class BaseAST implements AST {
    hiddenPrefix: Array<Token> = [];
    hiddenSuffix: Array<Token> = [];
}

class MissingAST extends BaseAST {

}

export class ExpressionAST extends BaseAST implements AST {
    constructor(public left: TermAST, public op: Token,
                public right: AST) {
        super();
    }
}

export class TermAST extends BaseAST implements AST {
    constructor(public term: Token) {
        super();
    }

    isPhrase() {
        return this.term.asString().indexOf(" ") !== -1;
    }
}

export class TermWithFieldAST extends TermAST implements AST {
    constructor(public field: Token, public colon: Token, term: Token) {
        super(term);
    }

}

export class ExpressionListAST extends BaseAST implements AST {
    public expressions = Array<BaseAST>();
    constructor (...expressions: BaseAST[]) {
        super();
        this.expressions = this.expressions.concat(expressions);
    }

    add(expr: BaseAST) {
        this.expressions.push(expr);
    }
}

export class Token {
    // for better readability
    public typeName: string;
    constructor(private input: string, public type: TokenType, public beginPos: number, public endPos: number) {
        this.typeName = TokenType[type];
    }

    asString() {
        return this.input.substring(this.beginPos, this.endPos);
    }

}

class QueryLexer {
    public pos: number;
    private eofToken: Token;

    constructor(private input: string) {
        this.pos = 0;
        this.eofToken = new Token(this.input, TokenType.EOF, input.length - 1, input.length - 1);
    }

    next(): Token {
        var token = this.eofToken;
        var la = this.la();
        if (this.isWhitespace(la)) {
            token = this.whitespace();
        } else if (this.isKeyword("OR")) {
            token = this.or();
        } else if (this.isKeyword("AND")) {
            token = this.and();
        } else if (la === '"') {
            token = this.phrase();
        } else if (this.isDigit(la)) {
            token = this.term();
        } else if (la === ':') {
            var startPos = this.pos;
            this.consume();
            token = new Token(this.input, TokenType.COLON, startPos, this.pos);
        }
        // FIME: no matching token error instead of EOF
        return token;
    }

    isKeyword(keyword: string): boolean {
        for (var i = 0; i < keyword.length; i++) {
            if (this.la(i) !== keyword[i]) {
                return false;
            }
        }
        // be sure that it is not a prefix of something else
        return this.isWhitespace(this.la(i)) || this.la(i) === null;
    }

    or() {
        var startPos = this.pos;
        this.consume(2);
        return new Token(this.input, TokenType.OR, startPos, this.pos);
    }

    and() {
        var startPos = this.pos;
        this.consume(3);
        return new Token(this.input, TokenType.AND, startPos, this.pos);
    }

    whitespace() {
        var startPos = this.pos;
        var la = this.la();
        while (la !== null && this.isWhitespace(la)) {
            this.consume();
            la = this.la();
        }
        return new Token(this.input, TokenType.WS, startPos, this.pos);
    }

    term() {
        var startPos = this.pos;
        var la = this.la();
        while (la !== null && this.isDigit(la)) {
            this.consume();
            la = this.la();
        }
        return new Token(this.input, TokenType.TERM, startPos, this.pos);
    }

    phrase() {
        var startPos = this.pos;
        this.consume(); // skip starting "
        var la = this.la();
        while (la !== null && la !== '"') {
            this.consume();
            la = this.la();
        }
        this.consume(); // skip ending "
        return new Token(this.input, TokenType.PHRASE, startPos, this.pos);
    }

    // TODO: handle escaping using state pattern
    isDigit(char) {
        return char !== null && (('a' <= char && char <= 'z') || ('A' <= char && char <= 'Z') || ('0' <= char && char <= '9'));
    }

    isWhitespace(char) {
        return '\n\r \t'.indexOf(char) !== -1;
    }

    consume(n: number = 1) {
        this.pos += n;
    }

    la(la: number = 0): string {
        var index = this.pos + la;
        return (this.input.length <= index) ? null : this.input[index];
    }
}

export interface ErrorObject {
    position: number;
    message: string;
}

/**
 * Parser for http://lucene.apache.org/core/2_9_4/queryparsersyntax.html
 */
export class QueryParser {
    private lexer: QueryLexer;
    private tokenBuffer: Array<Token>;
    public errors: Array<ErrorObject> = [];

    constructor(private input: string) {
        this.lexer = new QueryLexer(input);
        this.tokenBuffer = [];
    }

    private consume() {
        this.tokenBuffer.splice(0, 1);
    }

    private la(la: number = 0): Token {
        // fill token buffer until we can look far ahead
        while (la >= this.tokenBuffer.length) {
            var token = this.lexer.next();
            if (token.type === TokenType.EOF) {
                return token;
            }
            this.tokenBuffer.push(token);
        }
        return this.tokenBuffer[la];
    }

    private skipWS(): Array<Token> {
        return this.syncWhile(TokenType.WS);
    }

    private syncWhile(...syncWhile: TokenType[]): Array<Token> {
        var skippedTokens = [];
        while (syncWhile.some((type) => type === this.la().type)) {
            skippedTokens.push(this.la());
            this.consume();
        }
        return skippedTokens;
    }

    private syncTo(syncTo: TokenType[]): Array<Token> {
        var skippedTokens = [];
        while (this.la().type !== TokenType.EOF && syncTo.every((type) => type !== this.la().type)) {
            skippedTokens.push(this.la());
            this.consume();
        }
        return skippedTokens;
    }

    private unexpectedToken(...syncTo: TokenType[]) {
        this.errors.push({
            position: this.la().beginPos,
            message: "Unexpected input"
        });
        return this.syncTo(syncTo);
    }

    private missingToken(tokenName: string, ...syncTo: TokenType[]) {
        this.errors.push({
            position: this.la().beginPos,
            message: "Missing " + tokenName
        });
        return this.syncTo(syncTo);
    }

    parse(): AST {
        this.errors = [];
        var ast;
        var prefix = this.skipWS();
        ast = this.exprs();
        ast.hiddenPrefix = ast.hiddenPrefix.concat(prefix);
        var trailingSuffix = this.skipWS();
        ast.hiddenSuffix = ast.hiddenSuffix.concat(trailingSuffix);
        return ast;
    }

    exprs(): AST {
        var expr = this.expr();

        if (!this.isExpr()) {
            return expr;
        } else {
            var expressionList = new ExpressionListAST();
            expressionList.add(expr);
            while (this.isExpr()) {
                expr = this.expr();
                expressionList.add(expr);
            }
            return expressionList;
        }
    }

    expr(): BaseAST {
        var left: TermAST = null;
        var op: Token = null;
        var right: BaseAST = null;

        // left
        var la = this.la();
        switch (la.type) {
            case TokenType.TERM:
            case TokenType.PHRASE:
                left = this.termOrPhrase();
                break;
            default:
                this.unexpectedToken(TokenType.EOF);
                break;
        }
        left.hiddenSuffix = left.hiddenSuffix.concat(this.skipWS());

        if (!this.isOperator()) {
            return left;
        } else {
            op = this.la();
            this.consume();
            var prefix = this.skipWS();
            if (this.isExpr()) {
                right = this.expr();
            } else {
                this.missingToken("right side of expression", TokenType.EOF);
                right = new MissingAST();
            }
            right.hiddenPrefix = prefix;
            return new ExpressionAST(left, op, right);
        }
    }

    isFirstOf(...tokenTypes: TokenType[]) {
        return tokenTypes.some((tokenType) => this.la().type === tokenType);
    }

    isExpr() {
        return this.isFirstOf(TokenType.TERM, TokenType.PHRASE);
    }

    isOperator() {
        return this.isFirstOf(TokenType.OR, TokenType.AND);
    }

    termOrPhrase() {
        var termOrField = this.la();
        this.consume();
        // no ws allowed here
        if (this.la().type === TokenType.COLON) {
            var colon = this.la();
            this.consume();
            if (this.la().type === TokenType.TERM || this.la().type === TokenType.PHRASE) {
                var term = this.la();
                this.consume();
                var ast = new TermWithFieldAST(termOrField, colon, term);
                return ast;
            } else {
                var skippedTokens = this.missingToken("term or phrase for field", TokenType.EOF);
                var ast = new TermWithFieldAST(termOrField, colon, null);
                ast.hiddenSuffix = skippedTokens;
                return ast;
            }
        }
        return new TermAST(termOrField);
    }
}

