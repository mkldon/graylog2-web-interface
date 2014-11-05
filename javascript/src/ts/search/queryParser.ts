///<reference path='./../../../node_modules/immutable/dist/Immutable.d.ts'/>
'use strict';

import Immutable = require('immutable');

export interface Visitor {
    visit(ast: AST);
}

export class DumpVisitor implements Visitor {
    private buffer = [];

    visit(ast: AST) {
        if (ast === null) {
            return;
        } else if (ast instanceof ExprAST) {
            var expr = <ExprAST>ast;
            this.dumpPrefix(ast);
            this.visit(expr.left);
            this.dumpToken(ast.token());
            this.visit(expr.right);
            this.dumpSuffix(ast);
        } else if (ast instanceof BaseAST) {
            this.dumpWithPrefixAndSuffix(ast);
        }
    }

    private dumpWithPrefixAndSuffix(ast: AST) {
        this.dumpPrefix(ast);
        this.dumpToken(ast.token());
        this.dumpSuffix(ast);
    }

    private dumpSuffix(ast) {
        ast.hiddenSuffixTokens().forEach((suffix) => this.dumpToken(suffix));
    }

    private dumpPrefix(ast) {
        ast.hiddenPrefixTokens().forEach((prefix) => this.dumpToken(prefix));
    }
    private dumpToken(token: Token) {
        token !== null && this.buffer.push(token.asString());
    }

    result() {
        return this.buffer.join("");
    }

}

export enum TokenType {
    EOF, WS, TERM, PHRASE, AND, OR, NOT
}

export interface AST {
    hiddenPrefixTokens(): Immutable.List<Token>;
    token(): Token;
    hiddenSuffixTokens(): Immutable.List<Token>;
}

class BaseAST implements AST {
    public hiddenPrefix: Immutable.List<Token> = Immutable.List.of<Token>();
    public hiddenSuffix: Immutable.List<Token> = Immutable.List.of<Token>();

    hiddenPrefixTokens() {
        return this.hiddenPrefix;
    }

    /* abstract */
    token(): Token {
        throw new Error("Call of abstract method");
    }

    hiddenSuffixTokens() {
        return this.hiddenSuffix;
    }
}

export class ErrorAST extends BaseAST implements AST {
    token(): Token {
        return null;
    }
}

export class ExprAST extends BaseAST implements AST {
    constructor(public left: TermAST, public op: Token,
                public right: AST) {
        super();
        this.left = left;
        this.right = right;
        this.op = op;
    }

    token() {
        return this.op;
    }
}

export class TermAST extends BaseAST implements AST {
    constructor(public term: Token, public phrase?: boolean) {
        super();
        this.phrase = (phrase !== undefined && phrase) || term.asString().indexOf(" ") !== -1;
    }

    token() {
        return this.term;
    }
}

export class Token {
    constructor(private input: string, public type: TokenType, public beginPos: number, public endPos: number) {
    }

    asString() {
        return this.input.substring(this.beginPos, this.endPos);
    }

    toString() {
        return this.asString();
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
        this.consume();
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
    public errors = Immutable.List.of<ErrorObject>();

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

    private skipWS(): Immutable.List<Token> {
        return this.syncWhile(TokenType.WS);
    }

    private syncWhile(syncWhile: TokenType): Immutable.List<Token> {
        var skippedTokens = Immutable.List.of<Token>().asMutable();
        while (this.la().type === syncWhile) {
            skippedTokens.push(this.la());
            this.consume();
        }
        return skippedTokens.asImmutable();
    }

    private syncTo(syncTo: TokenType): Immutable.List<Token> {
        var skippedTokens = Immutable.List.of<Token>().asMutable();
        while (this.la().type !== TokenType.EOF && this.la().type !== syncTo) {
            skippedTokens.push(this.la());
            this.consume();
        }
        return skippedTokens.asImmutable();
    }

    // TODO: Do we rather want to abort the parse here? Send the error?
    private unexpectedToken(syncTo: TokenType) {
        this.errors = this.errors.push({
            position: this.la().beginPos,
            message: "Unexpected input"
        });
        this.syncTo(syncTo);
    }

    private missingToken(syncTo: TokenType, tokenName: string) {
        this.errors = this.errors.push({
            position: this.la().beginPos,
            message: "Missing " + tokenName
        });
        this.syncTo(syncTo);
    }

    parse(): AST {
        this.errors = this.errors.clear();
        var ast;
        // FIXME: prefix gets lost on complex expression
        var prefix = this.skipWS();
        ast = this.expr();
        ast.hiddenPrefix = ast.hiddenPrefix.merge(prefix);
        var trailingSuffix: Immutable.List<Token> = this.skipWS();
        ast.hiddenSuffix = ast.hiddenSuffix.merge(trailingSuffix);
        return ast;
    }

    //exprs(): BaseAST {
    //
    //}

    expr(): BaseAST {
        var left: TermAST = null;
        var op: Token = null;
        var right: BaseAST = null;

        // left
        var la = this.la();
        switch (la.type) {
            case TokenType.TERM:
                left = this.term();
                break;
            case TokenType.PHRASE:
                left = this.phrase();
                break;
            default:
                this.unexpectedToken(TokenType.EOF);
                break;
        }
        left.hiddenSuffix = this.skipWS();

        if (!this.isOperator()) {
            return left;
        } else {
            op = this.la();
            this.consume();
            var prefix = this.skipWS();
            if (this.isExpr()) {
                right = this.expr();
                right.hiddenPrefix = prefix;
                return new ExprAST(left, op, right);
            } else {
                this.missingToken(TokenType.EOF, "right side of expression");
            }
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

    term() {
        var token = this.la();
        this.consume();
        var ast = new TermAST(token);
        return ast;
    }

    phrase() {
        var token = this.la();
        this.consume();
        var ast = new TermAST(token, true);
        return ast;
    }
}

