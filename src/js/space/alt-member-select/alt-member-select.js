'use strict';

angular.module('myApp.directives').directive('altMemberSelect', function(
    User
) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            members: '='
        },
        link: postLink,
        templateUrl: 'space/alt-member-select/alt-member-select.html'
    };

    function postLink(scope, elm, attrs) {
        scope.getUserTileClasses = function(user) {
            var classes = [];

            if (scope.members && scope.members.indexOf(user.id) > -1) {
                classes.push('member');
            }

            return classes;
        };

        scope.onUserTileClick = function(user) {
            if (! scope.members) {
                scope.members = [];
            }

            var index = scope.members.indexOf(user.id);

            if (index > -1) {
                scope.members.splice(index, 1);
            } else {
                scope.members.push(user.id);
            }

            scope.$emit('spaceMembersChanged', scope.members);
        };

        /**
         * Self-executing initialize function.
         */
        (function init() {
            User.getAll(function(users) {
                scope.users = users;
            }, function(error) {
                console.log(error);
            });
        })();
    }
});
