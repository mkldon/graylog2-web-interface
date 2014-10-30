/** @jsx React.DOM */

'use strict';

var TokenTypes = {
    ID: "ID",
    AND: "AND",
    OR: "OR",
    NOT: "NOT"
}

class AST {
    constructor(asConf) {
        /**
         * @type {Token}
         */
        this.token = null;
    }

}

class Token {
    constructor(tokenConf) {
        /**
         * @type {string}
         */
        this.type = null;
        /**
         * @type {number}
         */
        this.begin = -1;
        /**
         * @type {number}
         */
        this.end = -1;
    }
}

class OperatorToken extends Token {
    constructor(tokenConf) {
        super(tokenConf);
    }
}

class QueryTokenizer {
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

    }

    consume() {
        this.pos++;
    }

    _LA(la) {
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
         * @type {QueryTokenizer}
         */
        this.lexer = new QueryTokenizer(input);
    }

    /**
     * @returns {Token}
     */
    next() {
        return this.lexer.next();
    }

    consume() {
        return this.lexer.next();
    }

    /**
     *
     * @returns {AST}
     */
    parse() {
        return expr();
    }

    /**
     * @returns {AST}
     */
    expr() {
        var token = this.next();
        if (token.type === ID) {
            var ast = new AST();
        }
    }



}

module.exports.QueryParser = QueryParser;
module.exports.AST = AST;
module.exports.Token = Token;
