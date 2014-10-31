'use strict';

export interface Visitor {
    visit(ast: AST);
    result();
}

export class DumpVisitor implements Visitor {
    private buffer = [];
    visit(ast: AST) {
        this.buffer.push(ast.token().asString());
        ast.children().forEach((child) => this.visit(child));
    }
    result() {
        return this.buffer.join("");
    }

}

export enum TokenType {
    TERM, PHRASE, AND, OR, NOT
}

export interface AST {
    token(): Token;
    children(): Array<AST>;
}

export class ExprAST implements AST {
    constructor(private op:Token, public left:ExprAST,
                public right:ExprAST) {
        this.left = left;
        this.right = right;
        this.op = op;
    }

    token() {
        return this.op;
    }

    children() {
        // TODO
        return [];
    }
}

export class TermAST implements AST {
    constructor(public term:Token, public phrase?: boolean) {
        this.phrase = (phrase !== undefined && phrase)  || term.asString().indexOf(" ") !== -1;
    }

    token() {
        return this.term;
    }
    children() {
        // TODO
        return [];
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
    private pos: number;
    constructor(private input: string) {
        this.pos = 0;
    }

    next(): Token {
        var token = null;
        var la = this.la();
        if (this.isDigit(la)) {
            token = this.term();
        } else if (la === '"') {
            token = this.phrase();
        }
        return token;
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

    consume() {
        this.pos++;
    }

    la(la: number=0): string {
        var index = this.pos + la;
        return (this.input.length <= index) ? null : this.input[index];
    }
}

/**
 * Parser for http://lucene.apache.org/core/2_9_4/queryparsersyntax.html
 */
export class QueryParser {
    private lexer: QueryLexer;
    private tokenBuffer: Array<Token>;
    constructor(private input: string) {
        this.lexer = new QueryLexer(input);
        this.tokenBuffer = [];
    }

    consume() {
        this.tokenBuffer.splice(0 ,1);
    }

    la(la: number=0): Token {
        // fill token buffer until we can look far ahead
        while (la >= this.tokenBuffer.length) {
            var token = this.lexer.next();
            if (token === null) {
                return null;
            }
            this.tokenBuffer.push(token);
        }
        return this.tokenBuffer[la];
    }
    parse(): AST {
        return this.expr();
    }

    expr(): AST {
        var left = null;
        var token = this.la();
        if (token !== null && token.type === TokenType.TERM) {
            left = this.term();
        } else if (token !== null && token.type === TokenType.PHRASE) {
            left = this.phrase();
        }
        if (this.la() === null) {
            return left;
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

    and() {

    }

    or() {

    }

    not() {

    }
}

