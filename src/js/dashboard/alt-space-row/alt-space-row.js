'use strict';

angular.module('myApp.directives').directive('altSpaceRow', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            space: '='
        },
        link: postLink,
        templateUrl: 'dashboard/alt-space-row/alt-space-row.html'
    };

    function postLink(scope, elm, attrs) {

    }
});
