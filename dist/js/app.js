'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
    'ngRoute',

    'ngDialog',
    'ngDropdowns',

    'myApp.controllers',
    'myApp.directives',
    'myApp.services',
    'myApp.templates'
]);

angular.module('myApp.controllers', []);
angular.module('myApp.directives', []);
angular.module('myApp.services', []);
angular.module('myApp.templates', []);

'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp').config(["$routeProvider", function(
    $routeProvider
) {
    $routeProvider.when('/', {
        templateUrl: 'dashboard/dashboard.html',
        controller: 'DashboardController'
    });

    $routeProvider.when('/spaces/:id', {
        templateUrl: 'space/space.html',
        controller: 'SpaceController'
    });

    $routeProvider.otherwise({redirectTo: '/'});
}]);

'use strict';

angular.module('myApp.controllers').controller('DashboardController', ["$location", "$q", "$rootScope", "$scope", "Space", "User", function(
    $location,
    $q,
    $rootScope,
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

    /**
     * Self-executing initialize function.
     */
    (function init() {
        getSpaces().then(function(spaces) {
            $scope.spaces = spaces;
        });
    })();
}]);
'use strict';

angular.module('myApp.controllers').controller('SpaceController', ["$location", "$routeParams", "$rootScope", "$scope", "ngDialog", "Space", "User", function(
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
}]);
'use strict';

angular.module('myApp.directives').directive('altHeader', ["$location", "ngDialog", function(
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
}]);

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

'use strict';

angular.module('myApp.directives').directive('altChart', ["ngDialog", function(
    ngDialog
) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            data: '='
        },
        link: postLink,
        templateUrl: 'space/alt-chart/alt-chart.html'
    };

    function postLink(scope, elm, attrs) {
        var maxDate = new Date();
        var minDate = new Date(maxDate.getTime() - 172800000);

        var vis = d3.select('#visualisation'),
            WIDTH = 1024,
            HEIGHT = 512,
            MARGINS = {
                top: 24,
                right: 24,
                bottom: 24,
                left: 48
            },

            //xScale = d3.scale.linear().range([MARGINS.left, WIDTH - MARGINS.right]).domain([2000, 2010]),
            xScale = d3.time.scale().domain([minDate, maxDate]).range([0, 1024]),

            yScale = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([0, 10]),

            xAxis = d3.svg.axis()
                .scale(xScale),

            yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left');

        vis.append('svg:g')
            .attr('class','axis')
            .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
            .call(xAxis);

        vis.append('svg:g')
            .attr('class','axis')
            .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
            .call(yAxis);

        vis.selectAll('circle')
            .data(scope.data).enter().append('svg:circle')
            //...
            .append('svg:title')
            .text(function(d) { return d.users; });

        var lineGen = d3.svg.line()
            .x(function(d) {
                return xScale(d.date);
            })
            .y(function(d) {
                return yScale(d.users);
            })
            .interpolate('basis');

        vis.append('svg:path')
            .attr('d', lineGen(scope.data))
            .attr('stroke', '#00B4FF')
            .attr('stroke-width', 2)
            .attr('fill', 'none');
    }
}]);

'use strict';

angular.module('myApp.services').service('Space', ["$cacheFactory", function(
    $cacheFactory
) {
    var cache = $cacheFactory('space');

    /**
     * Space getAll() shim.
     * @param resolveCallback
     * @param rejectCallback
     */
    this.getAll = function(resolveCallback, rejectCallback) {
        Data.Space.getAll().then(function(spaces) {
            // Cache each returned space
            spaces.forEach(function(space) {
                cache.put(space.id, space);
            });

            // Invoke the resolveCallback function
            resolveCallback(angular.copy(spaces));
        }, function(reason) {
            rejectCallback ? rejectCallback(reason) : resolveCallback(reason);
        });
    };

    /**
     * Space getById() shim.
     * @param params
     * @param resolveCallback
     * @param rejectCallback
     */
    this.getById = function(params, resolveCallback, rejectCallback) {
        if (! params.id) {
            rejectCallback('A required parameter (id) is missing.');
        }

        var storedData = cache.get(params.id);

        if (storedData) {
            resolveCallback(angular.copy(storedData));;
        } else {
            Data.Space.getById(params.id).then(function(space) {
                // Cache returned space
                cache.put(space.id, space);

                // Invoke the resolveCallback function
                resolveCallback(angular.copy(space));
            }, function(reason) {
                rejectCallback ? rejectCallback(reason) : resolveCallback(reason);
            });
        }
    };

    /**
     * Space updateById() shim.
     * @param params
     * @param resolveCallback
     * @param rejectCallback
     */
    this.updateById = function(params, data, resolveCallback, rejectCallback) {
        if (! params.id) {
            rejectCallback('A required parameter (id) is missing.');
        }

        Data.Space.updateById(params.id, data).then(function(space) {
            // Cache returned space
            cache.put(space.id, space);

            // Invoke the resolveCallback function
            resolveCallback(angular.copy(space));
        }, function(reason) {
            rejectCallback ? rejectCallback(reason) : resolveCallback(reason);
        });
    };

    /**
     * Space create() shim.
     * @param params
     * @param resolveCallback
     * @param rejectCallback
     */
    this.create = function(data, resolveCallback, rejectCallback) {
        Data.Space.create(data).then(function(space) {
            // Cache returned space
            cache.put(space.id, space);

            // Invoke the resolveCallback function
            resolveCallback(angular.copy(space));
        }, function(reason) {
            rejectCallback ? rejectCallback(reason) : resolveCallback(reason);
        });
    };

    /**
     * Space deleteById() shim.
     * @param params
     * @param resolveCallback
     * @param rejectCallback
     */
    this.deleteById = function(params, resolveCallback, rejectCallback) {
        if (! params.id) {
            rejectCallback('A required parameter (id) is missing.');
        }

        Data.Space.deleteById(params.id).then(function() {
            // Remove deleted space
            cache.remove(params.id);

            // Invoke the resolveCallback function
            resolveCallback();
        }, function(reason) {
            rejectCallback ? rejectCallback(reason) : resolveCallback(reason);
        });
    };
}]);

'use strict';

angular.module('myApp.services').service('User', ["$cacheFactory", function(
    $cacheFactory
) {
    var cache = $cacheFactory('user');

    /**
     * User getAll() shim.
     * @param resolveCallback
     * @param rejectCallback
     */
    this.getAll = function(resolveCallback, rejectCallback) {
        Data.User.getAll().then(function(users) {
            // Cache each returned user
            users.forEach(function(user) {
                cache.put(user.id, user);
            });

            // Invoke the resolveCallback function
            resolveCallback(angular.copy(users));
        }, function(reason) {
            rejectCallback ? rejectCallback(reason) : resolveCallback(reason);
        });
    };

    /**
     * User getById() shim.
     * @param params
     * @param resolveCallback
     * @param rejectCallback
     */
    this.getById = function(params, resolveCallback, rejectCallback) {
        if (! params.id) {
            rejectCallback('A required parameter (id) is missing.');
        }

        var storedData = cache.get(params.id);

        if (storedData) {
            resolveCallback(angular.copy(storedData));
        } else {
            Data.User.getById(params.id).then(function(user) {
                // Cache returned user
                cache.put(user.id, user);

                // Invoke the resolveCallback function
                resolveCallback(angular.copy(user));
            }, function(reason) {
                rejectCallback ? rejectCallback(reason) : resolveCallback(reason);
            });
        }
    };

    /**
     * User updateById() shim.
     * @param params
     * @param resolveCallback
     * @param rejectCallback
     */
    this.updateById = function(params, data, resolveCallback, rejectCallback) {
        if (! params.id) {
            rejectCallback('A required parameter (id) is missing.');
        }

        Data.User.updateById(params.id, data).then(function(user) {
            // Cache returned user
            cache.put(user.id, user);

            // Invoke the resolveCallback function
            resolveCallback(angular.copy(user));
        }, function(reason) {
            rejectCallback ? rejectCallback(reason) : resolveCallback(reason);
        });
    };

    /**
     * User create() shim.
     * @param params
     * @param resolveCallback
     * @param rejectCallback
     */
    this.create = function(data, resolveCallback, rejectCallback) {
        Data.User.create(data).then(function(user) {
            // Cache returned user
            cache.put(user.id, user);

            // Invoke the resolveCallback function
            resolveCallback(angular.copy(user));
        }, function(reason) {
            rejectCallback ? rejectCallback(reason) : resolveCallback(reason);
        });
    };

    /**
     * User deleteById() shim.
     * @param params
     * @param resolveCallback
     * @param rejectCallback
     */
    this.deleteById = function(params, resolveCallback, rejectCallback) {
        if (! params.id) {
            rejectCallback('A required parameter (id) is missing.');
        }

        Data.User.deleteById(params.id).then(function() {
            // Remove deleted user
            cache.remove(params.id);

            // Invoke the resolveCallback function
            resolveCallback();
        }, function(reason) {
            rejectCallback ? rejectCallback(reason) : resolveCallback(reason);
        });
    };
}]);

'use strict';

angular.module('myApp.directives').directive('altMemberSelect', ["User", function(
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
}]);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5tb2R1bGVzLmpzIiwiYXBwLnJvdXRlcy5qcyIsImRhc2hib2FyZC9kYXNoYm9hcmQtY29udHJvbGxlci5qcyIsInNwYWNlL3NwYWNlLWNvbnRyb2xsZXIuanMiLCJjb21wb25lbnRzL2FsdC1oZWFkZXIvYWx0LWhlYWRlci5qcyIsImRhc2hib2FyZC9hbHQtc3BhY2Utcm93L2FsdC1zcGFjZS1yb3cuanMiLCJzcGFjZS9hbHQtY2hhcnQvYWx0LWNoYXJ0LmpzIiwiY29tcG9uZW50cy9hcGkvc3BhY2UuanMiLCJjb21wb25lbnRzL2FwaS91c2VyLmpzIiwic3BhY2UvYWx0LW1lbWJlci1zZWxlY3QvYWx0LW1lbWJlci1zZWxlY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbi8vIERlY2xhcmUgYXBwIGxldmVsIG1vZHVsZSB3aGljaCBkZXBlbmRzIG9uIHZpZXdzLCBhbmQgY29tcG9uZW50c1xuYW5ndWxhci5tb2R1bGUoJ215QXBwJywgW1xuICAgICduZ1JvdXRlJyxcblxuICAgICduZ0RpYWxvZycsXG4gICAgJ25nRHJvcGRvd25zJyxcblxuICAgICdteUFwcC5jb250cm9sbGVycycsXG4gICAgJ215QXBwLmRpcmVjdGl2ZXMnLFxuICAgICdteUFwcC5zZXJ2aWNlcycsXG4gICAgJ215QXBwLnRlbXBsYXRlcydcbl0pO1xuXG5hbmd1bGFyLm1vZHVsZSgnbXlBcHAuY29udHJvbGxlcnMnLCBbXSk7XG5hbmd1bGFyLm1vZHVsZSgnbXlBcHAuZGlyZWN0aXZlcycsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdteUFwcC5zZXJ2aWNlcycsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdteUFwcC50ZW1wbGF0ZXMnLCBbXSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIERlY2xhcmUgYXBwIGxldmVsIG1vZHVsZSB3aGljaCBkZXBlbmRzIG9uIHZpZXdzLCBhbmQgY29tcG9uZW50c1xuYW5ndWxhci5tb2R1bGUoJ215QXBwJykuY29uZmlnKFtcIiRyb3V0ZVByb3ZpZGVyXCIsIGZ1bmN0aW9uKFxuICAgICRyb3V0ZVByb3ZpZGVyXG4pIHtcbiAgICAkcm91dGVQcm92aWRlci53aGVuKCcvJywge1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ2Rhc2hib2FyZC9kYXNoYm9hcmQuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJ1xuICAgIH0pO1xuXG4gICAgJHJvdXRlUHJvdmlkZXIud2hlbignL3NwYWNlcy86aWQnLCB7XG4gICAgICAgIHRlbXBsYXRlVXJsOiAnc3BhY2Uvc3BhY2UuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdTcGFjZUNvbnRyb2xsZXInXG4gICAgfSk7XG5cbiAgICAkcm91dGVQcm92aWRlci5vdGhlcndpc2Uoe3JlZGlyZWN0VG86ICcvJ30pO1xufV0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hbmd1bGFyLm1vZHVsZSgnbXlBcHAuY29udHJvbGxlcnMnKS5jb250cm9sbGVyKCdEYXNoYm9hcmRDb250cm9sbGVyJywgW1wiJGxvY2F0aW9uXCIsIFwiJHFcIiwgXCIkcm9vdFNjb3BlXCIsIFwiJHNjb3BlXCIsIFwiU3BhY2VcIiwgXCJVc2VyXCIsIGZ1bmN0aW9uKFxuICAgICRsb2NhdGlvbixcbiAgICAkcSxcbiAgICAkcm9vdFNjb3BlLFxuICAgICRzY29wZSxcbiAgICBTcGFjZSxcbiAgICBVc2VyXG4pIHtcbiAgICAkc2NvcGUuZGRTZWxlY3RPcHRpb25zID0gW3tcbiAgICAgICAgdGV4dDogJ0FsbCBTcGFjZXMnLFxuICAgICAgICB2YWx1ZTogJ2FsbCdcbiAgICB9LCB7XG4gICAgICAgIHRleHQ6ICdXZWxjb21lIFNwYWNlcycsXG4gICAgICAgIHZhbHVlOiAnd2VsY29tZSdcbiAgICB9LCB7XG4gICAgICAgIHRleHQ6ICdQcml2YXRlIFNwYWNlcycsXG4gICAgICAgIHZhbHVlOiAncHJpdmF0ZSdcbiAgICB9LCB7XG4gICAgICAgIHRleHQ6ICdGZWF0dXJlZCBTcGFjZXMnLFxuICAgICAgICB2YWx1ZTogJ2ZlYXR1cmVkJ1xuICAgIH1dO1xuXG4gICAgJHNjb3BlLmRkU2VsZWN0U2VsZWN0ZWQgPSB7XG4gICAgICAgIHRleHQ6ICdBbGwgU3BhY2VzJyxcbiAgICAgICAgdmFsdWU6ICdhbGwnXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIG9uQ2hhbmdlIGhhbmRsZXIgZm9yIHRoZSBkcm9wZG93biBmaWx0ZXIuXG4gICAgICogQHBhcmFtIHZhbHVlXG4gICAgICovXG4gICAgJHNjb3BlLm9uRHJvcGRvd25DaGFuZ2UgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBnZXRTcGFjZXMoKS50aGVuKGZ1bmN0aW9uKHNwYWNlcykge1xuICAgICAgICAgICAgJHNjb3BlLnNwYWNlcyA9IHNwYWNlcy5maWx0ZXIoZnVuY3Rpb24oc3BhY2UpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUudmFsdWUgPT09ICdhbGwnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzcGFjZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNwYWNlW3ZhbHVlLnZhbHVlXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gVE9ETyBEZXRlcm1pbmUgYSBiZXR0ZXIgd2F5IHRvIGhhbmRsZSByZXRyaWV2aW5nL3N0b3JpbmcgZGF0YVxuICAgIGZ1bmN0aW9uIGdldFNwYWNlcygpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICBTcGFjZS5nZXRBbGwoZnVuY3Rpb24oc3BhY2VzKSB7XG4gICAgICAgICAgICB2YXIgc3BhY2VEZWZlcnJlZHMgPSBbXTtcblxuICAgICAgICAgICAgLy8gR2V0IHRoZSBjcmVhdGluZyB1c2VyIGZvciBlYWNoIHNwYWNlXG4gICAgICAgICAgICBzcGFjZXMuZm9yRWFjaChmdW5jdGlvbihzcGFjZSkge1xuICAgICAgICAgICAgICAgIHZhciBzcGFjZURlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgICAgICBzcGFjZURlZmVycmVkcy5wdXNoKHNwYWNlRGVmZXJyZWQpO1xuXG4gICAgICAgICAgICAgICAgVXNlci5nZXRCeUlkKHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHNwYWNlLmNyZWF0ZWRfYnlcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNwYWNlLmNyZWF0ZWRfYnkgPSB1c2VyO1xuICAgICAgICAgICAgICAgICAgICBzcGFjZURlZmVycmVkLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJHEuYWxsKHNwYWNlRGVmZXJyZWRzKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoc3BhY2VzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZWxmLWV4ZWN1dGluZyBpbml0aWFsaXplIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIChmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICBnZXRTcGFjZXMoKS50aGVuKGZ1bmN0aW9uKHNwYWNlcykge1xuICAgICAgICAgICAgJHNjb3BlLnNwYWNlcyA9IHNwYWNlcztcbiAgICAgICAgfSk7XG4gICAgfSkoKTtcbn1dKTsiLCIndXNlIHN0cmljdCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdteUFwcC5jb250cm9sbGVycycpLmNvbnRyb2xsZXIoJ1NwYWNlQ29udHJvbGxlcicsIFtcIiRsb2NhdGlvblwiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcIiRyb290U2NvcGVcIiwgXCIkc2NvcGVcIiwgXCJuZ0RpYWxvZ1wiLCBcIlNwYWNlXCIsIFwiVXNlclwiLCBmdW5jdGlvbihcbiAgICAkbG9jYXRpb24sXG4gICAgJHJvdXRlUGFyYW1zLFxuICAgICRyb290U2NvcGUsXG4gICAgJHNjb3BlLFxuICAgIG5nRGlhbG9nLFxuICAgIFNwYWNlLFxuICAgIFVzZXJcbikge1xuICAgICRzY29wZS5zZWN0aW9uID0gJ2FuYWx5dGljcyc7XG5cbiAgICAkc2NvcGUub25FZGl0Q2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5lZGl0YWJsZVNwYWNlID0gYW5ndWxhci5jb3B5KCRzY29wZS5zcGFjZSk7XG4gICAgICAgICRzY29wZS5zZWN0aW9uID0gJ2FuYWx5dGljcyc7XG4gICAgfTtcblxuICAgICRzY29wZS5vbkVkaXRTYXZlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5zcGFjZSA9IGFuZ3VsYXIuY29weSgkc2NvcGUuZWRpdGFibGVTcGFjZSk7XG4gICAgICAgICRzY29wZS5zZWN0aW9uID0gJ2FuYWx5dGljcyc7XG4gICAgfTtcblxuICAgICRzY29wZS4kb24oJ3NwYWNlTWVtYmVyc0NoYW5nZWQnLCBmdW5jdGlvbihldmVudCwgbWVtYmVycykge1xuICAgICAgICBTcGFjZS51cGRhdGVCeUlkKHtcbiAgICAgICAgICAgIGlkOiAkcm91dGVQYXJhbXMuaWRcbiAgICAgICAgfSwgJHNjb3BlLnNwYWNlLCBmdW5jdGlvbihzcGFjZSkge1xuICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICB9KVxuICAgIH0pO1xuXG4gICAgJHNjb3BlLm9uRGVsZXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIG5nRGlhbG9nLm9wZW4oe1xuICAgICAgICAgICAgdGVtcGxhdGU6ICdzcGFjZS9kZWxldGUtc3BhY2UtZGlhbG9nLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogWyckbG9jYXRpb24nLCAnJHJvb3RTY29wZScsICckcm91dGVQYXJhbXMnLCAnJHNjb3BlJywgJ1NwYWNlJywgZnVuY3Rpb24oJGxvY2F0aW9uLCAkcm9vdFNjb3BlLCAkcm91dGVQYXJhbXMsICRzY29wZSwgU3BhY2UpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUub25Db25maXJtQ2xpY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgU3BhY2UuZGVsZXRlQnlJZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogJHJvdXRlUGFyYW1zLmlkXG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGxvY2F0aW9uLnBhdGgoJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNsb3NlVGhpc0RpYWxvZygpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfV1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFNlbGYtZXhlY3V0aW5nIGluaXRpYWxpemUgZnVuY3Rpb24uXG4gICAgICovXG4gICAgKGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIFNwYWNlLmdldEJ5SWQoe1xuICAgICAgICAgICAgaWQ6ICRyb3V0ZVBhcmFtcy5pZFxuICAgICAgICB9LCBmdW5jdGlvbihzcGFjZSkge1xuICAgICAgICAgICAgJHNjb3BlLnNwYWNlID0gc3BhY2U7XG4gICAgICAgICAgICAkc2NvcGUuZWRpdGFibGVTcGFjZSA9IGFuZ3VsYXIuY29weShzcGFjZSk7XG5cbiAgICAgICAgICAgIFVzZXIuZ2V0QnlJZCh7XG4gICAgICAgICAgICAgICAgaWQ6IHNwYWNlLmNyZWF0ZWRfYnlcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY3JlYXRlZEJ5ID0gdXNlcjtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0pKCk7XG59XSk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ215QXBwLmRpcmVjdGl2ZXMnKS5kaXJlY3RpdmUoJ2FsdEhlYWRlcicsIFtcIiRsb2NhdGlvblwiLCBcIm5nRGlhbG9nXCIsIGZ1bmN0aW9uKFxyXG4gICAgJGxvY2F0aW9uLFxyXG4gICAgbmdEaWFsb2dcclxuKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICBzY29wZToge30sXHJcbiAgICAgICAgbGluazogcG9zdExpbmssXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdjb21wb25lbnRzL2FsdC1oZWFkZXIvYWx0LWhlYWRlci5odG1sJ1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBwb3N0TGluayhzY29wZSwgZWxtLCBhdHRycykge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2NvcGUub3BlbkNyZWF0ZVNwYWNlRGlhbG9nID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIG5nRGlhbG9nLm9wZW4oe1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6ICdjb21wb25lbnRzL2FsdC1oZWFkZXIvY3JlYXRlLXNwYWNlLWRpYWxvZy5odG1sJyxcclxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFsnJHJvb3RTY29wZScsICckc2NvcGUnLCAnU3BhY2UnLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsIFNwYWNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUub25DcmVhdGVDbGljayA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISBpc1ZhbGlkKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE8gSGFuZGxlIGFuIGludmFsaWQgZm9ybVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBTcGFjZS5jcmVhdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICRzY29wZS50aXRsZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAkc2NvcGUuZGVzY3JpcHRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWxjb21lOiAkc2NvcGUud2VsY29tZSA/IDEgOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZTogJHNjb3BlLnByaXZhdGUgPyAxIDogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZlYXR1cmVkOiAkc2NvcGUuZmVhdHVyZWQgPyAxIDogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZWRfYnk6IDFcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oc3BhY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvc3BhY2VzLycgKyBzcGFjZS5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jbG9zZVRoaXNEaWFsb2coKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgICAgICpcclxuICAgICAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAgICAgICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBpc1ZhbGlkKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISAkc2NvcGUudGl0bGUgfHwgISRzY29wZS5kZXNjcmlwdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufV0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnbXlBcHAuZGlyZWN0aXZlcycpLmRpcmVjdGl2ZSgnYWx0U3BhY2VSb3cnLCBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgICByZXBsYWNlOiB0cnVlLFxyXG4gICAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgICAgIHNwYWNlOiAnPSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGxpbms6IHBvc3RMaW5rLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnZGFzaGJvYXJkL2FsdC1zcGFjZS1yb3cvYWx0LXNwYWNlLXJvdy5odG1sJ1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBwb3N0TGluayhzY29wZSwgZWxtLCBhdHRycykge1xyXG5cclxuICAgIH1cclxufSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdteUFwcC5kaXJlY3RpdmVzJykuZGlyZWN0aXZlKCdhbHRDaGFydCcsIFtcIm5nRGlhbG9nXCIsIGZ1bmN0aW9uKFxyXG4gICAgbmdEaWFsb2dcclxuKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICBzY29wZToge1xyXG4gICAgICAgICAgICBkYXRhOiAnPSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGxpbms6IHBvc3RMaW5rLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnc3BhY2UvYWx0LWNoYXJ0L2FsdC1jaGFydC5odG1sJ1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBwb3N0TGluayhzY29wZSwgZWxtLCBhdHRycykge1xyXG4gICAgICAgIHZhciBtYXhEYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICB2YXIgbWluRGF0ZSA9IG5ldyBEYXRlKG1heERhdGUuZ2V0VGltZSgpIC0gMTcyODAwMDAwKTtcclxuXHJcbiAgICAgICAgdmFyIHZpcyA9IGQzLnNlbGVjdCgnI3Zpc3VhbGlzYXRpb24nKSxcclxuICAgICAgICAgICAgV0lEVEggPSAxMDI0LFxyXG4gICAgICAgICAgICBIRUlHSFQgPSA1MTIsXHJcbiAgICAgICAgICAgIE1BUkdJTlMgPSB7XHJcbiAgICAgICAgICAgICAgICB0b3A6IDI0LFxyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IDI0LFxyXG4gICAgICAgICAgICAgICAgYm90dG9tOiAyNCxcclxuICAgICAgICAgICAgICAgIGxlZnQ6IDQ4XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAvL3hTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpLnJhbmdlKFtNQVJHSU5TLmxlZnQsIFdJRFRIIC0gTUFSR0lOUy5yaWdodF0pLmRvbWFpbihbMjAwMCwgMjAxMF0pLFxyXG4gICAgICAgICAgICB4U2NhbGUgPSBkMy50aW1lLnNjYWxlKCkuZG9tYWluKFttaW5EYXRlLCBtYXhEYXRlXSkucmFuZ2UoWzAsIDEwMjRdKSxcclxuXHJcbiAgICAgICAgICAgIHlTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpLnJhbmdlKFtIRUlHSFQgLSBNQVJHSU5TLnRvcCwgTUFSR0lOUy5ib3R0b21dKS5kb21haW4oWzAsIDEwXSksXHJcblxyXG4gICAgICAgICAgICB4QXhpcyA9IGQzLnN2Zy5heGlzKClcclxuICAgICAgICAgICAgICAgIC5zY2FsZSh4U2NhbGUpLFxyXG5cclxuICAgICAgICAgICAgeUF4aXMgPSBkMy5zdmcuYXhpcygpXHJcbiAgICAgICAgICAgICAgICAuc2NhbGUoeVNjYWxlKVxyXG4gICAgICAgICAgICAgICAgLm9yaWVudCgnbGVmdCcpO1xyXG5cclxuICAgICAgICB2aXMuYXBwZW5kKCdzdmc6ZycpXHJcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsJ2F4aXMnKVxyXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCcgKyAoSEVJR0hUIC0gTUFSR0lOUy5ib3R0b20pICsgJyknKVxyXG4gICAgICAgICAgICAuY2FsbCh4QXhpcyk7XHJcblxyXG4gICAgICAgIHZpcy5hcHBlbmQoJ3N2ZzpnJylcclxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywnYXhpcycpXHJcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyAoTUFSR0lOUy5sZWZ0KSArICcsMCknKVxyXG4gICAgICAgICAgICAuY2FsbCh5QXhpcyk7XHJcblxyXG4gICAgICAgIHZpcy5zZWxlY3RBbGwoJ2NpcmNsZScpXHJcbiAgICAgICAgICAgIC5kYXRhKHNjb3BlLmRhdGEpLmVudGVyKCkuYXBwZW5kKCdzdmc6Y2lyY2xlJylcclxuICAgICAgICAgICAgLy8uLi5cclxuICAgICAgICAgICAgLmFwcGVuZCgnc3ZnOnRpdGxlJylcclxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC51c2VyczsgfSk7XHJcblxyXG4gICAgICAgIHZhciBsaW5lR2VuID0gZDMuc3ZnLmxpbmUoKVxyXG4gICAgICAgICAgICAueChmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geFNjYWxlKGQuZGF0ZSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC55KGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB5U2NhbGUoZC51c2Vycyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5pbnRlcnBvbGF0ZSgnYmFzaXMnKTtcclxuXHJcbiAgICAgICAgdmlzLmFwcGVuZCgnc3ZnOnBhdGgnKVxyXG4gICAgICAgICAgICAuYXR0cignZCcsIGxpbmVHZW4oc2NvcGUuZGF0YSkpXHJcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2UnLCAnIzAwQjRGRicpXHJcbiAgICAgICAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCAyKVxyXG4gICAgICAgICAgICAuYXR0cignZmlsbCcsICdub25lJyk7XHJcbiAgICB9XHJcbn1dKTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ215QXBwLnNlcnZpY2VzJykuc2VydmljZSgnU3BhY2UnLCBbXCIkY2FjaGVGYWN0b3J5XCIsIGZ1bmN0aW9uKFxyXG4gICAgJGNhY2hlRmFjdG9yeVxyXG4pIHtcclxuICAgIHZhciBjYWNoZSA9ICRjYWNoZUZhY3RvcnkoJ3NwYWNlJyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTcGFjZSBnZXRBbGwoKSBzaGltLlxyXG4gICAgICogQHBhcmFtIHJlc29sdmVDYWxsYmFja1xyXG4gICAgICogQHBhcmFtIHJlamVjdENhbGxiYWNrXHJcbiAgICAgKi9cclxuICAgIHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24ocmVzb2x2ZUNhbGxiYWNrLCByZWplY3RDYWxsYmFjaykge1xyXG4gICAgICAgIERhdGEuU3BhY2UuZ2V0QWxsKCkudGhlbihmdW5jdGlvbihzcGFjZXMpIHtcclxuICAgICAgICAgICAgLy8gQ2FjaGUgZWFjaCByZXR1cm5lZCBzcGFjZVxyXG4gICAgICAgICAgICBzcGFjZXMuZm9yRWFjaChmdW5jdGlvbihzcGFjZSkge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUucHV0KHNwYWNlLmlkLCBzcGFjZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gSW52b2tlIHRoZSByZXNvbHZlQ2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAgICAgICAgcmVzb2x2ZUNhbGxiYWNrKGFuZ3VsYXIuY29weShzcGFjZXMpKTtcclxuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2sgPyByZWplY3RDYWxsYmFjayhyZWFzb24pIDogcmVzb2x2ZUNhbGxiYWNrKHJlYXNvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3BhY2UgZ2V0QnlJZCgpIHNoaW0uXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1zXHJcbiAgICAgKiBAcGFyYW0gcmVzb2x2ZUNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0gcmVqZWN0Q2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgdGhpcy5nZXRCeUlkID0gZnVuY3Rpb24ocGFyYW1zLCByZXNvbHZlQ2FsbGJhY2ssIHJlamVjdENhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKCEgcGFyYW1zLmlkKSB7XHJcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrKCdBIHJlcXVpcmVkIHBhcmFtZXRlciAoaWQpIGlzIG1pc3NpbmcuJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc3RvcmVkRGF0YSA9IGNhY2hlLmdldChwYXJhbXMuaWQpO1xyXG5cclxuICAgICAgICBpZiAoc3RvcmVkRGF0YSkge1xyXG4gICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2soYW5ndWxhci5jb3B5KHN0b3JlZERhdGEpKTs7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgRGF0YS5TcGFjZS5nZXRCeUlkKHBhcmFtcy5pZCkudGhlbihmdW5jdGlvbihzcGFjZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ2FjaGUgcmV0dXJuZWQgc3BhY2VcclxuICAgICAgICAgICAgICAgIGNhY2hlLnB1dChzcGFjZS5pZCwgc3BhY2UpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEludm9rZSB0aGUgcmVzb2x2ZUNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2soYW5ndWxhci5jb3B5KHNwYWNlKSk7XHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2sgPyByZWplY3RDYWxsYmFjayhyZWFzb24pIDogcmVzb2x2ZUNhbGxiYWNrKHJlYXNvbik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTcGFjZSB1cGRhdGVCeUlkKCkgc2hpbS5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEBwYXJhbSByZXNvbHZlQ2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSByZWplY3RDYWxsYmFja1xyXG4gICAgICovXHJcbiAgICB0aGlzLnVwZGF0ZUJ5SWQgPSBmdW5jdGlvbihwYXJhbXMsIGRhdGEsIHJlc29sdmVDYWxsYmFjaywgcmVqZWN0Q2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoISBwYXJhbXMuaWQpIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2soJ0EgcmVxdWlyZWQgcGFyYW1ldGVyIChpZCkgaXMgbWlzc2luZy4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIERhdGEuU3BhY2UudXBkYXRlQnlJZChwYXJhbXMuaWQsIGRhdGEpLnRoZW4oZnVuY3Rpb24oc3BhY2UpIHtcclxuICAgICAgICAgICAgLy8gQ2FjaGUgcmV0dXJuZWQgc3BhY2VcclxuICAgICAgICAgICAgY2FjaGUucHV0KHNwYWNlLmlkLCBzcGFjZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBJbnZva2UgdGhlIHJlc29sdmVDYWxsYmFjayBmdW5jdGlvblxyXG4gICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2soYW5ndWxhci5jb3B5KHNwYWNlKSk7XHJcbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XHJcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrID8gcmVqZWN0Q2FsbGJhY2socmVhc29uKSA6IHJlc29sdmVDYWxsYmFjayhyZWFzb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNwYWNlIGNyZWF0ZSgpIHNoaW0uXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1zXHJcbiAgICAgKiBAcGFyYW0gcmVzb2x2ZUNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0gcmVqZWN0Q2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbihkYXRhLCByZXNvbHZlQ2FsbGJhY2ssIHJlamVjdENhbGxiYWNrKSB7XHJcbiAgICAgICAgRGF0YS5TcGFjZS5jcmVhdGUoZGF0YSkudGhlbihmdW5jdGlvbihzcGFjZSkge1xyXG4gICAgICAgICAgICAvLyBDYWNoZSByZXR1cm5lZCBzcGFjZVxyXG4gICAgICAgICAgICBjYWNoZS5wdXQoc3BhY2UuaWQsIHNwYWNlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEludm9rZSB0aGUgcmVzb2x2ZUNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjayhhbmd1bGFyLmNvcHkoc3BhY2UpKTtcclxuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2sgPyByZWplY3RDYWxsYmFjayhyZWFzb24pIDogcmVzb2x2ZUNhbGxiYWNrKHJlYXNvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3BhY2UgZGVsZXRlQnlJZCgpIHNoaW0uXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1zXHJcbiAgICAgKiBAcGFyYW0gcmVzb2x2ZUNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0gcmVqZWN0Q2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgdGhpcy5kZWxldGVCeUlkID0gZnVuY3Rpb24ocGFyYW1zLCByZXNvbHZlQ2FsbGJhY2ssIHJlamVjdENhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKCEgcGFyYW1zLmlkKSB7XHJcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrKCdBIHJlcXVpcmVkIHBhcmFtZXRlciAoaWQpIGlzIG1pc3NpbmcuJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBEYXRhLlNwYWNlLmRlbGV0ZUJ5SWQocGFyYW1zLmlkKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZGVsZXRlZCBzcGFjZVxyXG4gICAgICAgICAgICBjYWNoZS5yZW1vdmUocGFyYW1zLmlkKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEludm9rZSB0aGUgcmVzb2x2ZUNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjaygpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjayA/IHJlamVjdENhbGxiYWNrKHJlYXNvbikgOiByZXNvbHZlQ2FsbGJhY2socmVhc29uKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn1dKTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ215QXBwLnNlcnZpY2VzJykuc2VydmljZSgnVXNlcicsIFtcIiRjYWNoZUZhY3RvcnlcIiwgZnVuY3Rpb24oXHJcbiAgICAkY2FjaGVGYWN0b3J5XHJcbikge1xyXG4gICAgdmFyIGNhY2hlID0gJGNhY2hlRmFjdG9yeSgndXNlcicpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXNlciBnZXRBbGwoKSBzaGltLlxyXG4gICAgICogQHBhcmFtIHJlc29sdmVDYWxsYmFja1xyXG4gICAgICogQHBhcmFtIHJlamVjdENhbGxiYWNrXHJcbiAgICAgKi9cclxuICAgIHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24ocmVzb2x2ZUNhbGxiYWNrLCByZWplY3RDYWxsYmFjaykge1xyXG4gICAgICAgIERhdGEuVXNlci5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKHVzZXJzKSB7XHJcbiAgICAgICAgICAgIC8vIENhY2hlIGVhY2ggcmV0dXJuZWQgdXNlclxyXG4gICAgICAgICAgICB1c2Vycy5mb3JFYWNoKGZ1bmN0aW9uKHVzZXIpIHtcclxuICAgICAgICAgICAgICAgIGNhY2hlLnB1dCh1c2VyLmlkLCB1c2VyKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBJbnZva2UgdGhlIHJlc29sdmVDYWxsYmFjayBmdW5jdGlvblxyXG4gICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2soYW5ndWxhci5jb3B5KHVzZXJzKSk7XHJcbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XHJcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrID8gcmVqZWN0Q2FsbGJhY2socmVhc29uKSA6IHJlc29sdmVDYWxsYmFjayhyZWFzb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVzZXIgZ2V0QnlJZCgpIHNoaW0uXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1zXHJcbiAgICAgKiBAcGFyYW0gcmVzb2x2ZUNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0gcmVqZWN0Q2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgdGhpcy5nZXRCeUlkID0gZnVuY3Rpb24ocGFyYW1zLCByZXNvbHZlQ2FsbGJhY2ssIHJlamVjdENhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKCEgcGFyYW1zLmlkKSB7XHJcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrKCdBIHJlcXVpcmVkIHBhcmFtZXRlciAoaWQpIGlzIG1pc3NpbmcuJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc3RvcmVkRGF0YSA9IGNhY2hlLmdldChwYXJhbXMuaWQpO1xyXG5cclxuICAgICAgICBpZiAoc3RvcmVkRGF0YSkge1xyXG4gICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2soYW5ndWxhci5jb3B5KHN0b3JlZERhdGEpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBEYXRhLlVzZXIuZ2V0QnlJZChwYXJhbXMuaWQpLnRoZW4oZnVuY3Rpb24odXNlcikge1xyXG4gICAgICAgICAgICAgICAgLy8gQ2FjaGUgcmV0dXJuZWQgdXNlclxyXG4gICAgICAgICAgICAgICAgY2FjaGUucHV0KHVzZXIuaWQsIHVzZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEludm9rZSB0aGUgcmVzb2x2ZUNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2soYW5ndWxhci5jb3B5KHVzZXIpKTtcclxuICAgICAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3RDYWxsYmFjayA/IHJlamVjdENhbGxiYWNrKHJlYXNvbikgOiByZXNvbHZlQ2FsbGJhY2socmVhc29uKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVzZXIgdXBkYXRlQnlJZCgpIHNoaW0uXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1zXHJcbiAgICAgKiBAcGFyYW0gcmVzb2x2ZUNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0gcmVqZWN0Q2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgdGhpcy51cGRhdGVCeUlkID0gZnVuY3Rpb24ocGFyYW1zLCBkYXRhLCByZXNvbHZlQ2FsbGJhY2ssIHJlamVjdENhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKCEgcGFyYW1zLmlkKSB7XHJcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrKCdBIHJlcXVpcmVkIHBhcmFtZXRlciAoaWQpIGlzIG1pc3NpbmcuJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBEYXRhLlVzZXIudXBkYXRlQnlJZChwYXJhbXMuaWQsIGRhdGEpLnRoZW4oZnVuY3Rpb24odXNlcikge1xyXG4gICAgICAgICAgICAvLyBDYWNoZSByZXR1cm5lZCB1c2VyXHJcbiAgICAgICAgICAgIGNhY2hlLnB1dCh1c2VyLmlkLCB1c2VyKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEludm9rZSB0aGUgcmVzb2x2ZUNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjayhhbmd1bGFyLmNvcHkodXNlcikpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjayA/IHJlamVjdENhbGxiYWNrKHJlYXNvbikgOiByZXNvbHZlQ2FsbGJhY2socmVhc29uKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVc2VyIGNyZWF0ZSgpIHNoaW0uXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1zXHJcbiAgICAgKiBAcGFyYW0gcmVzb2x2ZUNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0gcmVqZWN0Q2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbihkYXRhLCByZXNvbHZlQ2FsbGJhY2ssIHJlamVjdENhbGxiYWNrKSB7XHJcbiAgICAgICAgRGF0YS5Vc2VyLmNyZWF0ZShkYXRhKS50aGVuKGZ1bmN0aW9uKHVzZXIpIHtcclxuICAgICAgICAgICAgLy8gQ2FjaGUgcmV0dXJuZWQgdXNlclxyXG4gICAgICAgICAgICBjYWNoZS5wdXQodXNlci5pZCwgdXNlcik7XHJcblxyXG4gICAgICAgICAgICAvLyBJbnZva2UgdGhlIHJlc29sdmVDYWxsYmFjayBmdW5jdGlvblxyXG4gICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2soYW5ndWxhci5jb3B5KHVzZXIpKTtcclxuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2sgPyByZWplY3RDYWxsYmFjayhyZWFzb24pIDogcmVzb2x2ZUNhbGxiYWNrKHJlYXNvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXNlciBkZWxldGVCeUlkKCkgc2hpbS5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEBwYXJhbSByZXNvbHZlQ2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSByZWplY3RDYWxsYmFja1xyXG4gICAgICovXHJcbiAgICB0aGlzLmRlbGV0ZUJ5SWQgPSBmdW5jdGlvbihwYXJhbXMsIHJlc29sdmVDYWxsYmFjaywgcmVqZWN0Q2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoISBwYXJhbXMuaWQpIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2soJ0EgcmVxdWlyZWQgcGFyYW1ldGVyIChpZCkgaXMgbWlzc2luZy4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIERhdGEuVXNlci5kZWxldGVCeUlkKHBhcmFtcy5pZCkudGhlbihmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGRlbGV0ZWQgdXNlclxyXG4gICAgICAgICAgICBjYWNoZS5yZW1vdmUocGFyYW1zLmlkKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEludm9rZSB0aGUgcmVzb2x2ZUNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjaygpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjayA/IHJlamVjdENhbGxiYWNrKHJlYXNvbikgOiByZXNvbHZlQ2FsbGJhY2socmVhc29uKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn1dKTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ215QXBwLmRpcmVjdGl2ZXMnKS5kaXJlY3RpdmUoJ2FsdE1lbWJlclNlbGVjdCcsIFtcIlVzZXJcIiwgZnVuY3Rpb24oXHJcbiAgICBVc2VyXHJcbikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgICAgbWVtYmVyczogJz0nXHJcbiAgICAgICAgfSxcclxuICAgICAgICBsaW5rOiBwb3N0TGluayxcclxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3NwYWNlL2FsdC1tZW1iZXItc2VsZWN0L2FsdC1tZW1iZXItc2VsZWN0Lmh0bWwnXHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIHBvc3RMaW5rKHNjb3BlLCBlbG0sIGF0dHJzKSB7XHJcbiAgICAgICAgc2NvcGUuZ2V0VXNlclRpbGVDbGFzc2VzID0gZnVuY3Rpb24odXNlcikge1xyXG4gICAgICAgICAgICB2YXIgY2xhc3NlcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNjb3BlLm1lbWJlcnMgJiYgc2NvcGUubWVtYmVycy5pbmRleE9mKHVzZXIuaWQpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaCgnbWVtYmVyJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBjbGFzc2VzO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHNjb3BlLm9uVXNlclRpbGVDbGljayA9IGZ1bmN0aW9uKHVzZXIpIHtcclxuICAgICAgICAgICAgaWYgKCEgc2NvcGUubWVtYmVycykge1xyXG4gICAgICAgICAgICAgICAgc2NvcGUubWVtYmVycyA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaW5kZXggPSBzY29wZS5tZW1iZXJzLmluZGV4T2YodXNlci5pZCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgc2NvcGUubWVtYmVycy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2NvcGUubWVtYmVycy5wdXNoKHVzZXIuaWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzY29wZS4kZW1pdCgnc3BhY2VNZW1iZXJzQ2hhbmdlZCcsIHNjb3BlLm1lbWJlcnMpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFNlbGYtZXhlY3V0aW5nIGluaXRpYWxpemUgZnVuY3Rpb24uXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgKGZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICAgICAgICAgIFVzZXIuZ2V0QWxsKGZ1bmN0aW9uKHVzZXJzKSB7XHJcbiAgICAgICAgICAgICAgICBzY29wZS51c2VycyA9IHVzZXJzO1xyXG4gICAgICAgICAgICB9LCBmdW5jdGlvbihlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSgpO1xyXG4gICAgfVxyXG59XSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==