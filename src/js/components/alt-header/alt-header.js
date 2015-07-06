'use strict';

angular.module('myApp.directives').directive('altHeader', function(
    $location,
    ngDialog
) {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        link: postLink,
        templateUrl: 'components/alt-header/alt-header.html'
    };

    function postLink(scope, elm, attrs) {
        /**
         *
         */
        scope.openCreateSpaceDialog = function() {
            ngDialog.open({
                template: 'components/alt-header/create-space-dialog.html',
                controller: ['$rootScope', '$scope', 'Space', function($rootScope, $scope, Space) {
                    /**
                     *
                     */
                    $scope.onCreateClick = function() {
                        if (! isValid()) {
                            // TODO Handle an invalid form
                            return;
                        }

                        Space.create({
                            title: $scope.title,
                            description: $scope.description,
                            welcome: $scope.welcome ? 1 : 0,
                            private: $scope.private ? 1 : 0,
                            featured: $scope.featured ? 1 : 0,
                            created_by: 1
                        }, function(space) {
                            $rootScope.$apply(function() {
                                $location.path('/spaces/' + space.id);
                            });
                            $scope.closeThisDialog();
                        }, function(error) {
                            console.log(error);
                        });
                    };

                    /**
                     *
                     * @returns {boolean}
                     */
                    function isValid() {
                        if (! $scope.title || !$scope.description) {
                            return false;
                        }
                        return true;
                    }
                }]
            });
        }
    }
});
