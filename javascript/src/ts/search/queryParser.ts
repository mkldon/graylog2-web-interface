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
    TERM, PHRASE, AND, OR, NOT, EOF
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
        var la = this._la();
        if (this.isDigit(la)) {
            token = this.term();
        } else if (la === '"') {
            token = this.phrase();
        }
        return token;
    }

    term() {
        var startPos = this.pos;
        var la = this._la();
        while (la !== -1 && this.isDigit(la)) {
            this.consume();
            la = this._la();
        }
        return new Token(this.input, TokenType.TERM, startPos, this.pos);
    }

    phrase() {
        var startPos = this.pos;
        this.consume(); // skip starting "
        var la = this._la();
        while (la !== -1 && la !== '"') {
            this.consume();
            la = this._la();
        }
        this.consume(); // skip ending "
        return new Token(this.input, TokenType.PHRASE, startPos, this.pos);
    }

    // TODO: handle escaping using state pattern
    isDigit(char) {
        return ('a' <= char && char <= 'z') || ('A' <= char && char <= 'Z') || ('0' <= char && char <= '9');
    }

    consume() {
        this.pos++;
    }

    _la(la: number=0) {
        var index = this.pos + la;
        return (this.input.length <= index) ? -1 : this.input[index];
    }
}

/**
 * Parser for http://lucene.apache.org/core/2_9_4/queryparsersyntax.html
 */
export class QueryParser {
    private lexer: QueryLexer;
    private _currentToken: Token;
    constructor(private input: string) {
        this.lexer = new QueryLexer(input);
        this._currentToken = null;
    }

    next(): Token {
        if (!this._currentToken) {
            this._currentToken = this.lexer.next();
        }
        return this._currentToken;
    }

    consume() {
        this._currentToken = null;
    }

    parse(): AST {
        return this.expr();
    }

    expr(): AST {
        var ast = null;
        var token = this.next();
        if (token !== null && token.type === TokenType.TERM) {
            ast = new TermAST(token);
            this.consume();
        } else if (token !== null && token.type === TokenType.PHRASE) {
            ast = new TermAST(token, true);
            this.consume();
        }
        return ast;
    }

    and() {

    }

    or() {

    }

    not() {

    }
}

