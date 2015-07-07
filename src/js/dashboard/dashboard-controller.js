'use strict';

angular.module('myApp.controllers').controller('DashboardController', function(
    $location,
    $log,
    $q,
    $rootScope,
    $scope,
    Space,
    User
) {
    // Initialize the options for the dropdown filter
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

    // Initialize the default selected value for the dropdown filter
    $scope.ddSelectSelected = {
        text: 'All Spaces',
        value: 'all'
    };

    /**
     * Change handler for the dropdown filter.
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

    /**
     * Get all spaces along with the information about their creator.
     * @returns {*}
     */
    function getSpaces() {
        var deferred = $q.defer();

        // TODO Use a service based architecture to move data handling outside the controller
        Space.getAll(function(spaces) {
            var spaceDeferreds = [];

            // Get the creating user for each space
            spaces.forEach(function(space) {
                var spaceDeferred = $q.defer();
                spaceDeferreds.push(spaceDeferred);

                User.getById({
                    id: space.created_by
                }, function(user) {
                    space.created_by = user;
                    spaceDeferred.resolve();
                }, function(error) {
                    $log.error(error);
                });
            });

            $q.all(spaceDeferreds).then(function() {
                deferred.resolve(spaces);
            });
        }, function(error) {
            $log.error(error);
        });

        return deferred.promise;
    }

    /**
     * Self-executing initialize function.
     */
    (function init() {
        // Get all spaces
        getSpaces().then(function(spaces) {
            $scope.spaces = spaces;
        });
    })();
});