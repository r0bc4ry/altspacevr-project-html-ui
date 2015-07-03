'use strict';

angular.module('myApp.directives').directive('altSpaceRow', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            space: '='
        },
        link: postLink,
        templateUrl: 'components/alt-space-row/alt-space-row.html'
    };

    function postLink(scope, elm, attrs) {

    }
});
