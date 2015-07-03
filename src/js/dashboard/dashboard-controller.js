'use strict';

angular.module('myApp.controllers').controller('DashboardController', function(
    $location,
    $q,
    $scope,
    Space,
    User
) {
    $scope.ddSelectOptions = [{
        text: 'All Spaces',
        value: 'all'
    }, {
        text: 'Welcome Spaces',
        value: 'welcome'
    }, {
        text: 'Private Spaces',
        value: 'private'
    }, {
        text: 'Featured Spaces',
        value: 'featured'
    }];

    $scope.ddSelectSelected = {
        text: 'All Spaces',
        value: 'all'
    };

    /**
     * onChange handler for the dropdown filter.
     * @param value
     */
    $scope.onDropdownChange = function(value) {
        getSpaces().then(function(spaces) {
            $scope.spaces = spaces.filter(function(space) {
                if (value.value === 'all') {
                    return space;
                }
                return space[value.value];
            });
        });
    };

    // TODO Determine a better way to handle retrieving/storing data
    function getSpaces() {
        var deferred = $q.defer();

        Space.getAll(function(spaces) {
            var spaceDeferreds = [];

            // Get the creating user for each space
            spaces.forEach(function(space) {
                if (typeof space.created_by === 'object') {
                    return;
                }

                var spaceDeferred = $q.defer();
                spaceDeferreds.push(spaceDeferred);

                User.getById({
                    id: space.created_by
                }, function(user) {
                    space.created_by = user;
                    spaceDeferred.resolve();
                }, function(error) {
                    console.log(error);
                });
            });

            $q.all(spaceDeferreds).then(function() {
                deferred.resolve(spaces);
            });
        }, function(error) {
            console.log(error);
        });

        return deferred.promise;
    }

    $scope.go = function(path) {
        $location.path(path);
    };

    (function init() {
        getSpaces().then(function(spaces) {
            $scope.spaces = spaces;
        });
    })();
});