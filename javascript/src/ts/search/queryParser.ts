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
            this.visit(expr.left);
            this.dumpToken(ast);
            this.visit(expr.right);
        } else {
            ast.token() !== null && this.buffer.push(ast.token().asString());
        }
    }

    private dumpToken(ast) {
        ast.token() !== null && this.buffer.push(ast.token().asString());
    }

    result() {
        return this.buffer.join("");
    }

}

export enum TokenType {
    EOF, WS, TERM, PHRASE, AND, OR, NOT
}

export interface AST {
    token(): Token;
}

export class ExprAST implements AST {
    constructor(public left: TermAST, public op: Token,
                public right: AST) {
        this.left = left;
        this.right = right;
        this.op = op;
    }

    token() {
        return this.op;
    }
}

export class TermAST implements AST {
    constructor(public term: Token, public phrase?: boolean) {
        this.phrase = (phrase !== undefined && phrase) || term.asString().indexOf(" ") !== -1;
    }

    token() {
        return this.term;
    }
}

export class Token {
    constructor(private input: string, public type: TokenType, private beginPos: number, private endPos: number) {
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
        } else if (la === 'O' && this.la(1) === 'R' && (this.isWhitespace(this.la(2)) || this.la(2) === null)) {
            token = this.or();
        } else if (la === '"') {
            token = this.phrase();
        } else if (this.isDigit(la)) {
            token = this.term();
        }
        // FIME: no matching token error instead of EOF
        return token;
    }

    or() {
        var startPos = this.pos;
        this.consume();
        this.consume();
        return new Token(this.input, TokenType.OR, startPos, this.pos);
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

    consume() {
        this.pos++;
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
    public error: ErrorObject = null;

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

    private skipWS() {
        this.syncTo(TokenType.WS);
    }

    private syncTo(syncTo: TokenType) {
        while (this.la().type === syncTo) {
            this.consume();
        }
    }

    // TODO: Do we rather want to abort the parse here? Send the error?
    private unexpectedToken(syncTo: TokenType) {
        this.error = {
            position: this.lexer.pos,
            message: "Unexpected input"
        };
        this.syncTo(syncTo);
    }

    parse(): AST {
        this.error = null;
        var ast;
        this.skipWS();
        ast = this.expr();
        this.skipWS();
        return ast;
    }

    expr(): AST {
        var left: TermAST = null;
        var op: Token = null;
        var right: AST = null;

        // left
        switch (this.la().type) {
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
        this.skipWS();
        if (this.la().type === TokenType.EOF) {
            return left;
        } else {
            // op
            switch (this.la().type) {
                case TokenType.OR:
                case TokenType.AND:
                    op = this.la();
                    this.consume();
                    break;
                default:
                    this.unexpectedToken(TokenType.EOF);
                    break;
            }
            this.skipWS();
            right = this.expr();
            return new ExprAST(left, op, right);
        }
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

