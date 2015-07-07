'use strict';

angular.module('myApp.controllers').controller('SpaceController', function(
    $location,
    $log,
    $routeParams,
    $rootScope,
    $scope,
    ngDialog,
    Space,
    User
) {
    // Variable to hold the currently active section
    $scope.section = 'analytics';

    /**
     * Cancel handler for the edit form.
     */
    $scope.onEditCancel = function() {
        $scope.editableSpace = angular.copy($scope.space);
        $scope.section = 'analytics';
    };

    /**
     * Save handler for the edit form.
     */
    $scope.onEditSave = function() {
        $scope.space = angular.copy($scope.editableSpace);
        $scope.section = 'analytics';
    };

    /**
     * Event handler for when a space's members have changed.
     */
    $scope.$on('spaceMembersChanged', function(event, members) {
        Space.updateById({
            id: $routeParams.id
        }, $scope.space, function() {
            // No action needed on success
        }, function(error) {
            $log.error(error);
        })
    });

    /**
     * Delete space handler. Should spawn confirmation dialog before processing the delete.
     */
    $scope.onDelete = function() {
        // Create confirmation dialog
        ngDialog.open({
            template: 'space/delete-space-dialog.html',
            controller: ['$location', '$rootScope', '$routeParams', '$scope', 'Space', function($location, $rootScope, $routeParams, $scope, Space) {
                /**
                 * Confirmation handler for deleting this space.
                 */
                $scope.onConfirmClick = function() {
                    Space.deleteById({
                        id: $routeParams.id
                    }, function() {
                        $rootScope.$apply(function() {
                            $location.path('/');
                        });
                        $scope.closeThisDialog();
                    }, function(error) {
                        $log.error(error);
                    });
                };
            }]
        });
    };

    /**
     * Self-executing initialize function.
     */
    (function init() {
        // Retrieve the space's info from the data store
        Space.getById({
            id: $routeParams.id
        }, function(space) {
            $scope.space = space;
            $scope.editableSpace = angular.copy(space);

            // Get the space's creator's info
            User.getById({
                id: space.created_by
            }, function(user) {
                $scope.createdBy = user;
            }, function(error) {
                $log.error(error);
            });
        }, function(error) {
            $log.error(error);
        });
    })();
});