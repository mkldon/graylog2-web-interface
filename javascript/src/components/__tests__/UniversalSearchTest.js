/** @jsx React.DOM */

'use strict';

jest.dontMock('../search/UniversalSearch');

describe('UniversalSearch', function () {

    var UniversalSearch;
    beforeEach(function () {
        UniversalSearch = require('../search/UniversalSearch');
        //var query = "http_response_code:(>=400 AND <=500)  AND  action:l*";
        var query = "login";

        UniversalSearch._query = jest.genMockFunction();
        UniversalSearch._query.mockReturnValue(query);

    });

    it('can parse a query', function () {
        var ast = UniversalSearch.parse();
        expect(UniversalSearch._query).toBeCalled();
        expect(ast instanceof AST).toBeTruthy();
        expect(ast.type).toBe("AST");


    });
});