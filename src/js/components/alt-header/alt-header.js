'use strict';

angular.module('myApp.directives').directive('altHeader', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        link: postLink,
        templateUrl: 'components/alt-header/alt-header.html'
    };

    function postLink(scope, elm, attrs) {

    }
});
