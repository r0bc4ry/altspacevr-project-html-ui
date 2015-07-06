'use strict';

angular.module('myApp.controllers').controller('SpaceController', function(
    $location,
    $routeParams,
    $rootScope,
    $scope,
    ngDialog,
    Space,
    User
) {
    $scope.section = 'analytics';

    $scope.onEditCancel = function() {
        $scope.editableSpace = angular.copy($scope.space);
        $scope.section = 'analytics';
    };

    $scope.onEditSave = function() {
        $scope.space = angular.copy($scope.editableSpace);
        $scope.section = 'analytics';
    };

    $scope.$on('spaceMembersChanged', function(event, members) {
        Space.updateById({
            id: $routeParams.id
        }, $scope.space, function(space) {
            // TODO
        }, function(error) {
            console.log(error);
        })
    });

    $scope.onDelete = function() {
        ngDialog.open({
            template: 'space/delete-space-dialog.html',
            controller: ['$location', '$rootScope', '$routeParams', '$scope', 'Space', function($location, $rootScope, $routeParams, $scope, Space) {
                $scope.onConfirmClick = function() {
                    Space.deleteById({
                        id: $routeParams.id
                    }, function() {
                        $rootScope.$apply(function() {
                            $location.path('/');
                        });
                        $scope.closeThisDialog();
                    }, function(error) {
                        console.log(error);
                    });
                };
            }]
        });
    };

    /**
     * Self-executing initialize function.
     */
    (function init() {
        Space.getById({
            id: $routeParams.id
        }, function(space) {
            $scope.space = space;
            $scope.editableSpace = angular.copy(space);

            User.getById({
                id: space.created_by
            }, function(user) {
                $scope.createdBy = user;
            }, function(error) {
                console.log(error);
            });
        }, function(error) {
            console.log(error);
        });
    })();
});