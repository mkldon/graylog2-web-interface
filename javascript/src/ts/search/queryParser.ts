'use strict';

export enum TokenType {
    ID, AND, OR, NOT, EOF
}


export interface AST {
    token(): Token;
}

export class ExprAST implements AST {
    constructor(private op:Token, private left:ExprAST,
                private right:ExprAST) {
        this.left = left;
        this.right = right;
        this.op = op;
    }

    token() {
        return this.op;
    }
}

export class IdAST implements AST {
    constructor(private id:Token) {
        this.id = id;
    }

    token() {
        return this.id;
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
            token = this.id();
        }
        return token;
    }

    id() {
        var startPos = this.pos;
        var la = this._la();
        while (la !== -1 && this.isDigit(la)) {
            this.consume();
            la = this._la();
        }
        return new Token(this.input, TokenType.ID, startPos, this.pos);
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
        if (token !== null && token.type === TokenType.ID) {
            ast = new IdAST(token);
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

