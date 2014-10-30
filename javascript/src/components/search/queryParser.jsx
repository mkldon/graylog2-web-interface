/** @jsx React.DOM */

'use strict';

var TokenTypes = {
    ID: "ID",
    AND: "AND",
    OR: "OR",
    NOT: "NOT"
};

class AST {
    /**
     *
     * @param token {Token}
     */
    constructor(token) {
        /**
         * @type {Token}
         */
        this.token = token;
    }

}

class Token {
    constructor(tokenConf) {
        if (tokenConf === undefined) {
            tokenConf = {
                input: null,
                type: null,
                begin: -1,
                end: -1
            };
        }
        /**
         * @type {string}
         */
        this.input = tokenConf.input;
        /**
         * @type {string}
         */
        this.type = tokenConf.type;
        /**
         * @type {number}
         */
        this.begin = tokenConf.begin;
        /**
         * @type {number}
         */
        this.end = tokenConf.end;
    }

    asString() {
        return this.input.substring(this.begin, this.end);
    }
}

class QueryLexer {
    /**
     * @param input {string}
     */
    constructor(input) {
        /**
         * @type {string}
         */
        this.input = input;
        this.pos = 0;
    }

    /**
     *
     * @returns {Token}
     */
    next() {
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
        return new Token({
            input: this.input,
            type: TokenTypes.ID,
            begin: startPos,
            end: this.pos
        });
    }

    // TODO: handle escaping using state pattern
    isDigit(char) {
        return ('a' <= char && char <= 'z') || ('A' <= char && char <= 'Z') || ('0' <= char && char <= '9');
    }

    consume() {
        this.pos++;
    }

    _la(la) {
        la = la || 0;
        var index = this.pos + la;
        return (this.input.length <= index) ? -1 : this.input[index];
    }
}

class QueryParser {
    /**
     *
     * @param input {string}
     */
    constructor(input) {
        /**
         * @type {string}
         */
        this.input = input;
        /**
         * @type {QueryLexer}
         */
        this.lexer = new QueryLexer(input);

        /**
         *
         * @type {Token}
         */
        this._currentToken = null;
    }

    /**
     * @returns {Token}
     */
    next() {
        if (!this._currentToken) {
            this._currentToken = this.lexer.next();
        }
        return this._currentToken;
    }

    consume() {
        this._currentToken = null;
    }

    /**
     *
     * @returns {AST}
     */
    parse() {
        return this.expr();
    }

    /**
     * @returns {AST}
     */
    expr() {
        var ast = null;
        var token = this.next();
        if (token !== null && token.type === TokenTypes.ID) {
            ast = new AST(token);
            this.consume();
        }
        return ast;
    }

    and() {

    }

    or() {

    }
}

module.exports.QueryParser = QueryParser;
module.exports.AST = AST;
module.exports.Token = Token;
module.exports.TokenTypes = TokenTypes;