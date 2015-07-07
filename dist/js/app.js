'use strict';

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

angular.module('myApp.controllers').controller('DashboardController', ["$location", "$log", "$q", "$rootScope", "$scope", "Space", "User", function(
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
}]);
'use strict';

angular.module('myApp.controllers').controller('SpaceController', ["$location", "$log", "$routeParams", "$rootScope", "$scope", "ngDialog", "Space", "User", function(
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
}]);
'use strict';

angular.module('myApp.services').service('Space', ["$cacheFactory", function(
    $cacheFactory
) {
    // Construct cache object
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
    // Construct cache object
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

angular.module('myApp.directives').directive('altHeader', ["$location", "$log", "ngDialog", function(
    $location,
    $log,
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
         * Open the dialog to create a new space.
         */
        scope.openCreateSpaceDialog = function() {
            // Create create dialog
            ngDialog.open({
                template: 'components/alt-header/create-space-dialog.html',
                controller: ['$rootScope', '$scope', 'Space', function($rootScope, $scope, Space) {
                    /**
                     * Click handler for creating a new space.
                     */
                    $scope.onCreateClick = function() {
                        if (! isValid()) {
                            return $scope.errorMessage = 'Oops! Title and description are required.';
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
                            $log.error(error);
                        });
                    };

                    /**
                     * Validate user input.
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

angular.module('myApp.directives').directive('altChart', ["ngDialog", function(
    ngDialog
) {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        link: postLink,
        templateUrl: 'space/alt-chart/alt-chart.html'
    };

    function postLink(scope, elm, attrs) {
        // Placeholder data (would be removed for production) to prevent errors
        var data = [
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 },
            { date: '', close: 0 }
        ];

        // Get date references for the past 24 hours
        var now = new Date();
        data.forEach(function(d, index) {
            d.date = new Date(now.getTime() - (3600000 * index));
        });

        // Set the dimensions of the graph
        var margin = { top: 12, right: 12, bottom: 128, left: 24 },
            width = 1024 - margin.left - margin.right,
            height = 512 - margin.top - margin.bottom;

        // Set the ranges
        var x = d3.time.scale().range([0, width]);
        var y = d3.scale.linear().range([height, 0]);

        // Define the axes
        var xAxis = d3.svg.axis()
            .scale(x)
            .orient('bottom')
            .ticks(d3.time.hours, 6)
            .tickFormat(d3.time.format('%x %I%p'));

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient('left')
            .ticks(10);

        // Define the line
        var line = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d.close); });

        // Define the tooltips
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function (d) {
                return '' +
                    '<div class="tooltip">' +
                        '<strong>' + d.date.getHours() + ':' + d.date.getMinutes() + '</strong> <span>' + d.close + ' Users</span>' +
                    '</div>';
            });

        // Define the SVG
        var svg = d3.select('#visualisation')
            .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
            .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var lineSvg = svg.append('g');

        // Call the tooltips
        svg.call(tip);

        data.forEach(function(d, index) {
            d.date = d.date;
            d.close = +(Math.floor((Math.random() * 16) + 1));
        });

        // Setup the X/Y domains
        x.domain(d3.extent(data, function (d) {
            return d.date;
        }));

        y.domain([0, d3.max(data, function(d) {
            return d.close;
        })]);

        // Add the X Axis
        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis)
            .selectAll('text')
                .style('text-anchor', 'end')
                .attr('dx', '-.8em')
                .attr('dy', '.15em')
                .attr('transform', function(d) {
                    return 'rotate(-60)'
                });

        // Add the Y Axis
        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        // Add the line path
        lineSvg.append('path')
            .attr('class', 'line')
            .attr('d', line(data));

        // Add circles to the data points along the line
        svg.selectAll('.circle')
            .data(data)
            .enter()
            .append('svg:circle')
            .attr('class', 'circle')
            .attr('cx', function (d, i) {
                return x(d.date);
            })
            .attr('cy', function (d, i) {
                return y(d.close);
            })
            .attr('r', 4)
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);
    }
}]);

'use strict';

angular.module('myApp.directives').directive('altMemberSelect', ["$log", "User", function(
    $log,
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
        /**
         * Angular ngClass function for a user's tile.
         * @param user
         * @returns {Array}
         */
        scope.getUserTileClasses = function(user) {
            var classes = [];

            if (scope.members && scope.members.indexOf(user.id) > -1) {
                classes.push('member');
            }

            return classes;
        };

        /**
         * Click handler for a user's tile.
         * @param user
         */
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
            // Get all users (would need to be paginated in the future)
            User.getAll(function(users) {
                scope.users = users;
            }, function(error) {
                $log.error(error);
            });
        })();
    }
}]);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5tb2R1bGVzLmpzIiwiYXBwLnJvdXRlcy5qcyIsImRhc2hib2FyZC9kYXNoYm9hcmQtY29udHJvbGxlci5qcyIsInNwYWNlL3NwYWNlLWNvbnRyb2xsZXIuanMiLCJjb21wb25lbnRzL2FwaS9zcGFjZS5qcyIsImNvbXBvbmVudHMvYXBpL3VzZXIuanMiLCJjb21wb25lbnRzL2FsdC1oZWFkZXIvYWx0LWhlYWRlci5qcyIsInNwYWNlL2FsdC1jaGFydC9hbHQtY2hhcnQuanMiLCJzcGFjZS9hbHQtbWVtYmVyLXNlbGVjdC9hbHQtbWVtYmVyLXNlbGVjdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuYW5ndWxhci5tb2R1bGUoJ215QXBwJywgW1xuICAgICduZ1JvdXRlJyxcblxuICAgICduZ0RpYWxvZycsXG4gICAgJ25nRHJvcGRvd25zJyxcblxuICAgICdteUFwcC5jb250cm9sbGVycycsXG4gICAgJ215QXBwLmRpcmVjdGl2ZXMnLFxuICAgICdteUFwcC5zZXJ2aWNlcycsXG4gICAgJ215QXBwLnRlbXBsYXRlcydcbl0pO1xuXG5hbmd1bGFyLm1vZHVsZSgnbXlBcHAuY29udHJvbGxlcnMnLCBbXSk7XG5hbmd1bGFyLm1vZHVsZSgnbXlBcHAuZGlyZWN0aXZlcycsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdteUFwcC5zZXJ2aWNlcycsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdteUFwcC50ZW1wbGF0ZXMnLCBbXSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdteUFwcCcpLmNvbmZpZyhbXCIkcm91dGVQcm92aWRlclwiLCBmdW5jdGlvbihcbiAgICAkcm91dGVQcm92aWRlclxuKSB7XG4gICAgJHJvdXRlUHJvdmlkZXIud2hlbignLycsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdkYXNoYm9hcmQvZGFzaGJvYXJkLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnRGFzaGJvYXJkQ29udHJvbGxlcidcbiAgICB9KTtcblxuICAgICRyb3V0ZVByb3ZpZGVyLndoZW4oJy9zcGFjZXMvOmlkJywge1xuICAgICAgICB0ZW1wbGF0ZVVybDogJ3NwYWNlL3NwYWNlLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnU3BhY2VDb250cm9sbGVyJ1xuICAgIH0pO1xuXG4gICAgJHJvdXRlUHJvdmlkZXIub3RoZXJ3aXNlKHtyZWRpcmVjdFRvOiAnLyd9KTtcbn1dKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuYW5ndWxhci5tb2R1bGUoJ215QXBwLmNvbnRyb2xsZXJzJykuY29udHJvbGxlcignRGFzaGJvYXJkQ29udHJvbGxlcicsIFtcIiRsb2NhdGlvblwiLCBcIiRsb2dcIiwgXCIkcVwiLCBcIiRyb290U2NvcGVcIiwgXCIkc2NvcGVcIiwgXCJTcGFjZVwiLCBcIlVzZXJcIiwgZnVuY3Rpb24oXG4gICAgJGxvY2F0aW9uLFxuICAgICRsb2csXG4gICAgJHEsXG4gICAgJHJvb3RTY29wZSxcbiAgICAkc2NvcGUsXG4gICAgU3BhY2UsXG4gICAgVXNlclxuKSB7XG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgb3B0aW9ucyBmb3IgdGhlIGRyb3Bkb3duIGZpbHRlclxuICAgICRzY29wZS5kZFNlbGVjdE9wdGlvbnMgPSBbe1xuICAgICAgICB0ZXh0OiAnQWxsIFNwYWNlcycsXG4gICAgICAgIHZhbHVlOiAnYWxsJ1xuICAgIH0sIHtcbiAgICAgICAgdGV4dDogJ1dlbGNvbWUgU3BhY2VzJyxcbiAgICAgICAgdmFsdWU6ICd3ZWxjb21lJ1xuICAgIH0sIHtcbiAgICAgICAgdGV4dDogJ1ByaXZhdGUgU3BhY2VzJyxcbiAgICAgICAgdmFsdWU6ICdwcml2YXRlJ1xuICAgIH0sIHtcbiAgICAgICAgdGV4dDogJ0ZlYXR1cmVkIFNwYWNlcycsXG4gICAgICAgIHZhbHVlOiAnZmVhdHVyZWQnXG4gICAgfV07XG5cbiAgICAvLyBJbml0aWFsaXplIHRoZSBkZWZhdWx0IHNlbGVjdGVkIHZhbHVlIGZvciB0aGUgZHJvcGRvd24gZmlsdGVyXG4gICAgJHNjb3BlLmRkU2VsZWN0U2VsZWN0ZWQgPSB7XG4gICAgICAgIHRleHQ6ICdBbGwgU3BhY2VzJyxcbiAgICAgICAgdmFsdWU6ICdhbGwnXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENoYW5nZSBoYW5kbGVyIGZvciB0aGUgZHJvcGRvd24gZmlsdGVyLlxuICAgICAqIEBwYXJhbSB2YWx1ZVxuICAgICAqL1xuICAgICRzY29wZS5vbkRyb3Bkb3duQ2hhbmdlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgZ2V0U3BhY2VzKCkudGhlbihmdW5jdGlvbihzcGFjZXMpIHtcbiAgICAgICAgICAgICRzY29wZS5zcGFjZXMgPSBzcGFjZXMuZmlsdGVyKGZ1bmN0aW9uKHNwYWNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLnZhbHVlID09PSAnYWxsJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3BhY2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzcGFjZVt2YWx1ZS52YWx1ZV07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEdldCBhbGwgc3BhY2VzIGFsb25nIHdpdGggdGhlIGluZm9ybWF0aW9uIGFib3V0IHRoZWlyIGNyZWF0b3IuXG4gICAgICogQHJldHVybnMgeyp9XG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0U3BhY2VzKCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgIC8vIFRPRE8gVXNlIGEgc2VydmljZSBiYXNlZCBhcmNoaXRlY3R1cmUgdG8gbW92ZSBkYXRhIGhhbmRsaW5nIG91dHNpZGUgdGhlIGNvbnRyb2xsZXJcbiAgICAgICAgU3BhY2UuZ2V0QWxsKGZ1bmN0aW9uKHNwYWNlcykge1xuICAgICAgICAgICAgdmFyIHNwYWNlRGVmZXJyZWRzID0gW107XG5cbiAgICAgICAgICAgIC8vIEdldCB0aGUgY3JlYXRpbmcgdXNlciBmb3IgZWFjaCBzcGFjZVxuICAgICAgICAgICAgc3BhY2VzLmZvckVhY2goZnVuY3Rpb24oc3BhY2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3BhY2VEZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgc3BhY2VEZWZlcnJlZHMucHVzaChzcGFjZURlZmVycmVkKTtcblxuICAgICAgICAgICAgICAgIFVzZXIuZ2V0QnlJZCh7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBzcGFjZS5jcmVhdGVkX2J5XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24odXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzcGFjZS5jcmVhdGVkX2J5ID0gdXNlcjtcbiAgICAgICAgICAgICAgICAgICAgc3BhY2VEZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxvZy5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJHEuYWxsKHNwYWNlRGVmZXJyZWRzKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoc3BhY2VzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgJGxvZy5lcnJvcihlcnJvcik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbGYtZXhlY3V0aW5nIGluaXRpYWxpemUgZnVuY3Rpb24uXG4gICAgICovXG4gICAgKGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgIC8vIEdldCBhbGwgc3BhY2VzXG4gICAgICAgIGdldFNwYWNlcygpLnRoZW4oZnVuY3Rpb24oc3BhY2VzKSB7XG4gICAgICAgICAgICAkc2NvcGUuc3BhY2VzID0gc3BhY2VzO1xuICAgICAgICB9KTtcbiAgICB9KSgpO1xufV0pOyIsIid1c2Ugc3RyaWN0JztcblxuYW5ndWxhci5tb2R1bGUoJ215QXBwLmNvbnRyb2xsZXJzJykuY29udHJvbGxlcignU3BhY2VDb250cm9sbGVyJywgW1wiJGxvY2F0aW9uXCIsIFwiJGxvZ1wiLCBcIiRyb3V0ZVBhcmFtc1wiLCBcIiRyb290U2NvcGVcIiwgXCIkc2NvcGVcIiwgXCJuZ0RpYWxvZ1wiLCBcIlNwYWNlXCIsIFwiVXNlclwiLCBmdW5jdGlvbihcbiAgICAkbG9jYXRpb24sXG4gICAgJGxvZyxcbiAgICAkcm91dGVQYXJhbXMsXG4gICAgJHJvb3RTY29wZSxcbiAgICAkc2NvcGUsXG4gICAgbmdEaWFsb2csXG4gICAgU3BhY2UsXG4gICAgVXNlclxuKSB7XG4gICAgLy8gVmFyaWFibGUgdG8gaG9sZCB0aGUgY3VycmVudGx5IGFjdGl2ZSBzZWN0aW9uXG4gICAgJHNjb3BlLnNlY3Rpb24gPSAnYW5hbHl0aWNzJztcblxuICAgIC8qKlxuICAgICAqIENhbmNlbCBoYW5kbGVyIGZvciB0aGUgZWRpdCBmb3JtLlxuICAgICAqL1xuICAgICRzY29wZS5vbkVkaXRDYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNjb3BlLmVkaXRhYmxlU3BhY2UgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnNwYWNlKTtcbiAgICAgICAgJHNjb3BlLnNlY3Rpb24gPSAnYW5hbHl0aWNzJztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogU2F2ZSBoYW5kbGVyIGZvciB0aGUgZWRpdCBmb3JtLlxuICAgICAqL1xuICAgICRzY29wZS5vbkVkaXRTYXZlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5zcGFjZSA9IGFuZ3VsYXIuY29weSgkc2NvcGUuZWRpdGFibGVTcGFjZSk7XG4gICAgICAgICRzY29wZS5zZWN0aW9uID0gJ2FuYWx5dGljcyc7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXIgZm9yIHdoZW4gYSBzcGFjZSdzIG1lbWJlcnMgaGF2ZSBjaGFuZ2VkLlxuICAgICAqL1xuICAgICRzY29wZS4kb24oJ3NwYWNlTWVtYmVyc0NoYW5nZWQnLCBmdW5jdGlvbihldmVudCwgbWVtYmVycykge1xuICAgICAgICBTcGFjZS51cGRhdGVCeUlkKHtcbiAgICAgICAgICAgIGlkOiAkcm91dGVQYXJhbXMuaWRcbiAgICAgICAgfSwgJHNjb3BlLnNwYWNlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIE5vIGFjdGlvbiBuZWVkZWQgb24gc3VjY2Vzc1xuICAgICAgICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgJGxvZy5lcnJvcihlcnJvcik7XG4gICAgICAgIH0pXG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBEZWxldGUgc3BhY2UgaGFuZGxlci4gU2hvdWxkIHNwYXduIGNvbmZpcm1hdGlvbiBkaWFsb2cgYmVmb3JlIHByb2Nlc3NpbmcgdGhlIGRlbGV0ZS5cbiAgICAgKi9cbiAgICAkc2NvcGUub25EZWxldGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQ3JlYXRlIGNvbmZpcm1hdGlvbiBkaWFsb2dcbiAgICAgICAgbmdEaWFsb2cub3Blbih7XG4gICAgICAgICAgICB0ZW1wbGF0ZTogJ3NwYWNlL2RlbGV0ZS1zcGFjZS1kaWFsb2cuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBbJyRsb2NhdGlvbicsICckcm9vdFNjb3BlJywgJyRyb3V0ZVBhcmFtcycsICckc2NvcGUnLCAnU3BhY2UnLCBmdW5jdGlvbigkbG9jYXRpb24sICRyb290U2NvcGUsICRyb3V0ZVBhcmFtcywgJHNjb3BlLCBTcGFjZSkge1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIENvbmZpcm1hdGlvbiBoYW5kbGVyIGZvciBkZWxldGluZyB0aGlzIHNwYWNlLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICRzY29wZS5vbkNvbmZpcm1DbGljayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBTcGFjZS5kZWxldGVCeUlkKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAkcm91dGVQYXJhbXMuaWRcbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbG9jYXRpb24ucGF0aCgnLycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY2xvc2VUaGlzRGlhbG9nKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkbG9nLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1dXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBTZWxmLWV4ZWN1dGluZyBpbml0aWFsaXplIGZ1bmN0aW9uLlxuICAgICAqL1xuICAgIChmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICAvLyBSZXRyaWV2ZSB0aGUgc3BhY2UncyBpbmZvIGZyb20gdGhlIGRhdGEgc3RvcmVcbiAgICAgICAgU3BhY2UuZ2V0QnlJZCh7XG4gICAgICAgICAgICBpZDogJHJvdXRlUGFyYW1zLmlkXG4gICAgICAgIH0sIGZ1bmN0aW9uKHNwYWNlKSB7XG4gICAgICAgICAgICAkc2NvcGUuc3BhY2UgPSBzcGFjZTtcbiAgICAgICAgICAgICRzY29wZS5lZGl0YWJsZVNwYWNlID0gYW5ndWxhci5jb3B5KHNwYWNlKTtcblxuICAgICAgICAgICAgLy8gR2V0IHRoZSBzcGFjZSdzIGNyZWF0b3IncyBpbmZvXG4gICAgICAgICAgICBVc2VyLmdldEJ5SWQoe1xuICAgICAgICAgICAgICAgIGlkOiBzcGFjZS5jcmVhdGVkX2J5XG4gICAgICAgICAgICB9LCBmdW5jdGlvbih1c2VyKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmNyZWF0ZWRCeSA9IHVzZXI7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgICRsb2cuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICAkbG9nLmVycm9yKGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfSkoKTtcbn1dKTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnbXlBcHAuc2VydmljZXMnKS5zZXJ2aWNlKCdTcGFjZScsIFtcIiRjYWNoZUZhY3RvcnlcIiwgZnVuY3Rpb24oXHJcbiAgICAkY2FjaGVGYWN0b3J5XHJcbikge1xyXG4gICAgLy8gQ29uc3RydWN0IGNhY2hlIG9iamVjdFxyXG4gICAgdmFyIGNhY2hlID0gJGNhY2hlRmFjdG9yeSgnc3BhY2UnKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNwYWNlIGdldEFsbCgpIHNoaW0uXHJcbiAgICAgKiBAcGFyYW0gcmVzb2x2ZUNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0gcmVqZWN0Q2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgdGhpcy5nZXRBbGwgPSBmdW5jdGlvbihyZXNvbHZlQ2FsbGJhY2ssIHJlamVjdENhbGxiYWNrKSB7XHJcbiAgICAgICAgRGF0YS5TcGFjZS5nZXRBbGwoKS50aGVuKGZ1bmN0aW9uKHNwYWNlcykge1xyXG4gICAgICAgICAgICAvLyBDYWNoZSBlYWNoIHJldHVybmVkIHNwYWNlXHJcbiAgICAgICAgICAgIHNwYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNwYWNlKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5wdXQoc3BhY2UuaWQsIHNwYWNlKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBJbnZva2UgdGhlIHJlc29sdmVDYWxsYmFjayBmdW5jdGlvblxyXG4gICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2soYW5ndWxhci5jb3B5KHNwYWNlcykpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjayA/IHJlamVjdENhbGxiYWNrKHJlYXNvbikgOiByZXNvbHZlQ2FsbGJhY2socmVhc29uKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTcGFjZSBnZXRCeUlkKCkgc2hpbS5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEBwYXJhbSByZXNvbHZlQ2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSByZWplY3RDYWxsYmFja1xyXG4gICAgICovXHJcbiAgICB0aGlzLmdldEJ5SWQgPSBmdW5jdGlvbihwYXJhbXMsIHJlc29sdmVDYWxsYmFjaywgcmVqZWN0Q2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoISBwYXJhbXMuaWQpIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2soJ0EgcmVxdWlyZWQgcGFyYW1ldGVyIChpZCkgaXMgbWlzc2luZy4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzdG9yZWREYXRhID0gY2FjaGUuZ2V0KHBhcmFtcy5pZCk7XHJcblxyXG4gICAgICAgIGlmIChzdG9yZWREYXRhKSB7XHJcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjayhhbmd1bGFyLmNvcHkoc3RvcmVkRGF0YSkpOztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBEYXRhLlNwYWNlLmdldEJ5SWQocGFyYW1zLmlkKS50aGVuKGZ1bmN0aW9uKHNwYWNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDYWNoZSByZXR1cm5lZCBzcGFjZVxyXG4gICAgICAgICAgICAgICAgY2FjaGUucHV0KHNwYWNlLmlkLCBzcGFjZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSW52b2tlIHRoZSByZXNvbHZlQ2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjayhhbmd1bGFyLmNvcHkoc3BhY2UpKTtcclxuICAgICAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3RDYWxsYmFjayA/IHJlamVjdENhbGxiYWNrKHJlYXNvbikgOiByZXNvbHZlQ2FsbGJhY2socmVhc29uKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNwYWNlIHVwZGF0ZUJ5SWQoKSBzaGltLlxyXG4gICAgICogQHBhcmFtIHBhcmFtc1xyXG4gICAgICogQHBhcmFtIHJlc29sdmVDYWxsYmFja1xyXG4gICAgICogQHBhcmFtIHJlamVjdENhbGxiYWNrXHJcbiAgICAgKi9cclxuICAgIHRoaXMudXBkYXRlQnlJZCA9IGZ1bmN0aW9uKHBhcmFtcywgZGF0YSwgcmVzb2x2ZUNhbGxiYWNrLCByZWplY3RDYWxsYmFjaykge1xyXG4gICAgICAgIGlmICghIHBhcmFtcy5pZCkge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjaygnQSByZXF1aXJlZCBwYXJhbWV0ZXIgKGlkKSBpcyBtaXNzaW5nLicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRGF0YS5TcGFjZS51cGRhdGVCeUlkKHBhcmFtcy5pZCwgZGF0YSkudGhlbihmdW5jdGlvbihzcGFjZSkge1xyXG4gICAgICAgICAgICAvLyBDYWNoZSByZXR1cm5lZCBzcGFjZVxyXG4gICAgICAgICAgICBjYWNoZS5wdXQoc3BhY2UuaWQsIHNwYWNlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEludm9rZSB0aGUgcmVzb2x2ZUNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjayhhbmd1bGFyLmNvcHkoc3BhY2UpKTtcclxuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2sgPyByZWplY3RDYWxsYmFjayhyZWFzb24pIDogcmVzb2x2ZUNhbGxiYWNrKHJlYXNvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3BhY2UgY3JlYXRlKCkgc2hpbS5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEBwYXJhbSByZXNvbHZlQ2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSByZWplY3RDYWxsYmFja1xyXG4gICAgICovXHJcbiAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uKGRhdGEsIHJlc29sdmVDYWxsYmFjaywgcmVqZWN0Q2FsbGJhY2spIHtcclxuICAgICAgICBEYXRhLlNwYWNlLmNyZWF0ZShkYXRhKS50aGVuKGZ1bmN0aW9uKHNwYWNlKSB7XHJcbiAgICAgICAgICAgIC8vIENhY2hlIHJldHVybmVkIHNwYWNlXHJcbiAgICAgICAgICAgIGNhY2hlLnB1dChzcGFjZS5pZCwgc3BhY2UpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW52b2tlIHRoZSByZXNvbHZlQ2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAgICAgICAgcmVzb2x2ZUNhbGxiYWNrKGFuZ3VsYXIuY29weShzcGFjZSkpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjayA/IHJlamVjdENhbGxiYWNrKHJlYXNvbikgOiByZXNvbHZlQ2FsbGJhY2socmVhc29uKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTcGFjZSBkZWxldGVCeUlkKCkgc2hpbS5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEBwYXJhbSByZXNvbHZlQ2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSByZWplY3RDYWxsYmFja1xyXG4gICAgICovXHJcbiAgICB0aGlzLmRlbGV0ZUJ5SWQgPSBmdW5jdGlvbihwYXJhbXMsIHJlc29sdmVDYWxsYmFjaywgcmVqZWN0Q2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoISBwYXJhbXMuaWQpIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2soJ0EgcmVxdWlyZWQgcGFyYW1ldGVyIChpZCkgaXMgbWlzc2luZy4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIERhdGEuU3BhY2UuZGVsZXRlQnlJZChwYXJhbXMuaWQpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBkZWxldGVkIHNwYWNlXHJcbiAgICAgICAgICAgIGNhY2hlLnJlbW92ZShwYXJhbXMuaWQpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW52b2tlIHRoZSByZXNvbHZlQ2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAgICAgICAgcmVzb2x2ZUNhbGxiYWNrKCk7XHJcbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XHJcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrID8gcmVqZWN0Q2FsbGJhY2socmVhc29uKSA6IHJlc29sdmVDYWxsYmFjayhyZWFzb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufV0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnbXlBcHAuc2VydmljZXMnKS5zZXJ2aWNlKCdVc2VyJywgW1wiJGNhY2hlRmFjdG9yeVwiLCBmdW5jdGlvbihcclxuICAgICRjYWNoZUZhY3RvcnlcclxuKSB7XHJcbiAgICAvLyBDb25zdHJ1Y3QgY2FjaGUgb2JqZWN0XHJcbiAgICB2YXIgY2FjaGUgPSAkY2FjaGVGYWN0b3J5KCd1c2VyJyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVc2VyIGdldEFsbCgpIHNoaW0uXHJcbiAgICAgKiBAcGFyYW0gcmVzb2x2ZUNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0gcmVqZWN0Q2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgdGhpcy5nZXRBbGwgPSBmdW5jdGlvbihyZXNvbHZlQ2FsbGJhY2ssIHJlamVjdENhbGxiYWNrKSB7XHJcbiAgICAgICAgRGF0YS5Vc2VyLmdldEFsbCgpLnRoZW4oZnVuY3Rpb24odXNlcnMpIHtcclxuICAgICAgICAgICAgLy8gQ2FjaGUgZWFjaCByZXR1cm5lZCB1c2VyXHJcbiAgICAgICAgICAgIHVzZXJzLmZvckVhY2goZnVuY3Rpb24odXNlcikge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUucHV0KHVzZXIuaWQsIHVzZXIpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEludm9rZSB0aGUgcmVzb2x2ZUNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjayhhbmd1bGFyLmNvcHkodXNlcnMpKTtcclxuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2sgPyByZWplY3RDYWxsYmFjayhyZWFzb24pIDogcmVzb2x2ZUNhbGxiYWNrKHJlYXNvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXNlciBnZXRCeUlkKCkgc2hpbS5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEBwYXJhbSByZXNvbHZlQ2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSByZWplY3RDYWxsYmFja1xyXG4gICAgICovXHJcbiAgICB0aGlzLmdldEJ5SWQgPSBmdW5jdGlvbihwYXJhbXMsIHJlc29sdmVDYWxsYmFjaywgcmVqZWN0Q2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoISBwYXJhbXMuaWQpIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2soJ0EgcmVxdWlyZWQgcGFyYW1ldGVyIChpZCkgaXMgbWlzc2luZy4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzdG9yZWREYXRhID0gY2FjaGUuZ2V0KHBhcmFtcy5pZCk7XHJcblxyXG4gICAgICAgIGlmIChzdG9yZWREYXRhKSB7XHJcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjayhhbmd1bGFyLmNvcHkoc3RvcmVkRGF0YSkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIERhdGEuVXNlci5nZXRCeUlkKHBhcmFtcy5pZCkudGhlbihmdW5jdGlvbih1c2VyKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDYWNoZSByZXR1cm5lZCB1c2VyXHJcbiAgICAgICAgICAgICAgICBjYWNoZS5wdXQodXNlci5pZCwgdXNlcik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSW52b2tlIHRoZSByZXNvbHZlQ2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjayhhbmd1bGFyLmNvcHkodXNlcikpO1xyXG4gICAgICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdENhbGxiYWNrID8gcmVqZWN0Q2FsbGJhY2socmVhc29uKSA6IHJlc29sdmVDYWxsYmFjayhyZWFzb24pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXNlciB1cGRhdGVCeUlkKCkgc2hpbS5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEBwYXJhbSByZXNvbHZlQ2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSByZWplY3RDYWxsYmFja1xyXG4gICAgICovXHJcbiAgICB0aGlzLnVwZGF0ZUJ5SWQgPSBmdW5jdGlvbihwYXJhbXMsIGRhdGEsIHJlc29sdmVDYWxsYmFjaywgcmVqZWN0Q2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoISBwYXJhbXMuaWQpIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2soJ0EgcmVxdWlyZWQgcGFyYW1ldGVyIChpZCkgaXMgbWlzc2luZy4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIERhdGEuVXNlci51cGRhdGVCeUlkKHBhcmFtcy5pZCwgZGF0YSkudGhlbihmdW5jdGlvbih1c2VyKSB7XHJcbiAgICAgICAgICAgIC8vIENhY2hlIHJldHVybmVkIHVzZXJcclxuICAgICAgICAgICAgY2FjaGUucHV0KHVzZXIuaWQsIHVzZXIpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW52b2tlIHRoZSByZXNvbHZlQ2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAgICAgICAgcmVzb2x2ZUNhbGxiYWNrKGFuZ3VsYXIuY29weSh1c2VyKSk7XHJcbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XHJcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrID8gcmVqZWN0Q2FsbGJhY2socmVhc29uKSA6IHJlc29sdmVDYWxsYmFjayhyZWFzb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVzZXIgY3JlYXRlKCkgc2hpbS5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEBwYXJhbSByZXNvbHZlQ2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSByZWplY3RDYWxsYmFja1xyXG4gICAgICovXHJcbiAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uKGRhdGEsIHJlc29sdmVDYWxsYmFjaywgcmVqZWN0Q2FsbGJhY2spIHtcclxuICAgICAgICBEYXRhLlVzZXIuY3JlYXRlKGRhdGEpLnRoZW4oZnVuY3Rpb24odXNlcikge1xyXG4gICAgICAgICAgICAvLyBDYWNoZSByZXR1cm5lZCB1c2VyXHJcbiAgICAgICAgICAgIGNhY2hlLnB1dCh1c2VyLmlkLCB1c2VyKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEludm9rZSB0aGUgcmVzb2x2ZUNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjayhhbmd1bGFyLmNvcHkodXNlcikpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjayA/IHJlamVjdENhbGxiYWNrKHJlYXNvbikgOiByZXNvbHZlQ2FsbGJhY2socmVhc29uKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVc2VyIGRlbGV0ZUJ5SWQoKSBzaGltLlxyXG4gICAgICogQHBhcmFtIHBhcmFtc1xyXG4gICAgICogQHBhcmFtIHJlc29sdmVDYWxsYmFja1xyXG4gICAgICogQHBhcmFtIHJlamVjdENhbGxiYWNrXHJcbiAgICAgKi9cclxuICAgIHRoaXMuZGVsZXRlQnlJZCA9IGZ1bmN0aW9uKHBhcmFtcywgcmVzb2x2ZUNhbGxiYWNrLCByZWplY3RDYWxsYmFjaykge1xyXG4gICAgICAgIGlmICghIHBhcmFtcy5pZCkge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjaygnQSByZXF1aXJlZCBwYXJhbWV0ZXIgKGlkKSBpcyBtaXNzaW5nLicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRGF0YS5Vc2VyLmRlbGV0ZUJ5SWQocGFyYW1zLmlkKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZGVsZXRlZCB1c2VyXHJcbiAgICAgICAgICAgIGNhY2hlLnJlbW92ZShwYXJhbXMuaWQpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW52b2tlIHRoZSByZXNvbHZlQ2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAgICAgICAgcmVzb2x2ZUNhbGxiYWNrKCk7XHJcbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XHJcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrID8gcmVqZWN0Q2FsbGJhY2socmVhc29uKSA6IHJlc29sdmVDYWxsYmFjayhyZWFzb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufV0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnbXlBcHAuZGlyZWN0aXZlcycpLmRpcmVjdGl2ZSgnYWx0SGVhZGVyJywgW1wiJGxvY2F0aW9uXCIsIFwiJGxvZ1wiLCBcIm5nRGlhbG9nXCIsIGZ1bmN0aW9uKFxyXG4gICAgJGxvY2F0aW9uLFxyXG4gICAgJGxvZyxcclxuICAgIG5nRGlhbG9nXHJcbikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgc2NvcGU6IHt9LFxyXG4gICAgICAgIGxpbms6IHBvc3RMaW5rLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnY29tcG9uZW50cy9hbHQtaGVhZGVyL2FsdC1oZWFkZXIuaHRtbCdcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gcG9zdExpbmsoc2NvcGUsIGVsbSwgYXR0cnMpIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBPcGVuIHRoZSBkaWFsb2cgdG8gY3JlYXRlIGEgbmV3IHNwYWNlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNjb3BlLm9wZW5DcmVhdGVTcGFjZURpYWxvZyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgY3JlYXRlIGRpYWxvZ1xyXG4gICAgICAgICAgICBuZ0RpYWxvZy5vcGVuKHtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiAnY29tcG9uZW50cy9hbHQtaGVhZGVyL2NyZWF0ZS1zcGFjZS1kaWFsb2cuaHRtbCcsXHJcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBbJyRyb290U2NvcGUnLCAnJHNjb3BlJywgJ1NwYWNlJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCBTcGFjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICAgICAqIENsaWNrIGhhbmRsZXIgZm9yIGNyZWF0aW5nIGEgbmV3IHNwYWNlLlxyXG4gICAgICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5vbkNyZWF0ZUNsaWNrID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghIGlzVmFsaWQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzY29wZS5lcnJvck1lc3NhZ2UgPSAnT29wcyEgVGl0bGUgYW5kIGRlc2NyaXB0aW9uIGFyZSByZXF1aXJlZC4nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBTcGFjZS5jcmVhdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICRzY29wZS50aXRsZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAkc2NvcGUuZGVzY3JpcHRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWxjb21lOiAkc2NvcGUud2VsY29tZSA/IDEgOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpdmF0ZTogJHNjb3BlLnByaXZhdGUgPyAxIDogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZlYXR1cmVkOiAkc2NvcGUuZmVhdHVyZWQgPyAxIDogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZWRfYnk6IDFcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oc3BhY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRsb2NhdGlvbi5wYXRoKCcvc3BhY2VzLycgKyBzcGFjZS5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5jbG9zZVRoaXNEaWFsb2coKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRsb2cuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAgICAgKiBWYWxpZGF0ZSB1c2VyIGlucHV0LlxyXG4gICAgICAgICAgICAgICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufVxyXG4gICAgICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGlzVmFsaWQoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghICRzY29wZS50aXRsZSB8fCAhJHNjb3BlLmRlc2NyaXB0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfV1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdteUFwcC5kaXJlY3RpdmVzJykuZGlyZWN0aXZlKCdhbHRDaGFydCcsIFtcIm5nRGlhbG9nXCIsIGZ1bmN0aW9uKFxyXG4gICAgbmdEaWFsb2dcclxuKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICBzY29wZToge30sXHJcbiAgICAgICAgbGluazogcG9zdExpbmssXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdzcGFjZS9hbHQtY2hhcnQvYWx0LWNoYXJ0Lmh0bWwnXHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIHBvc3RMaW5rKHNjb3BlLCBlbG0sIGF0dHJzKSB7XHJcbiAgICAgICAgLy8gUGxhY2Vob2xkZXIgZGF0YSAod291bGQgYmUgcmVtb3ZlZCBmb3IgcHJvZHVjdGlvbikgdG8gcHJldmVudCBlcnJvcnNcclxuICAgICAgICB2YXIgZGF0YSA9IFtcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfSxcclxuICAgICAgICAgICAgeyBkYXRlOiAnJywgY2xvc2U6IDAgfVxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIC8vIEdldCBkYXRlIHJlZmVyZW5jZXMgZm9yIHRoZSBwYXN0IDI0IGhvdXJzXHJcbiAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGQsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIGQuZGF0ZSA9IG5ldyBEYXRlKG5vdy5nZXRUaW1lKCkgLSAoMzYwMDAwMCAqIGluZGV4KSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFNldCB0aGUgZGltZW5zaW9ucyBvZiB0aGUgZ3JhcGhcclxuICAgICAgICB2YXIgbWFyZ2luID0geyB0b3A6IDEyLCByaWdodDogMTIsIGJvdHRvbTogMTI4LCBsZWZ0OiAyNCB9LFxyXG4gICAgICAgICAgICB3aWR0aCA9IDEwMjQgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodCxcclxuICAgICAgICAgICAgaGVpZ2h0ID0gNTEyIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b207XHJcblxyXG4gICAgICAgIC8vIFNldCB0aGUgcmFuZ2VzXHJcbiAgICAgICAgdmFyIHggPSBkMy50aW1lLnNjYWxlKCkucmFuZ2UoWzAsIHdpZHRoXSk7XHJcbiAgICAgICAgdmFyIHkgPSBkMy5zY2FsZS5saW5lYXIoKS5yYW5nZShbaGVpZ2h0LCAwXSk7XHJcblxyXG4gICAgICAgIC8vIERlZmluZSB0aGUgYXhlc1xyXG4gICAgICAgIHZhciB4QXhpcyA9IGQzLnN2Zy5heGlzKClcclxuICAgICAgICAgICAgLnNjYWxlKHgpXHJcbiAgICAgICAgICAgIC5vcmllbnQoJ2JvdHRvbScpXHJcbiAgICAgICAgICAgIC50aWNrcyhkMy50aW1lLmhvdXJzLCA2KVxyXG4gICAgICAgICAgICAudGlja0Zvcm1hdChkMy50aW1lLmZvcm1hdCgnJXggJUklcCcpKTtcclxuXHJcbiAgICAgICAgdmFyIHlBeGlzID0gZDMuc3ZnLmF4aXMoKVxyXG4gICAgICAgICAgICAuc2NhbGUoeSlcclxuICAgICAgICAgICAgLm9yaWVudCgnbGVmdCcpXHJcbiAgICAgICAgICAgIC50aWNrcygxMCk7XHJcblxyXG4gICAgICAgIC8vIERlZmluZSB0aGUgbGluZVxyXG4gICAgICAgIHZhciBsaW5lID0gZDMuc3ZnLmxpbmUoKVxyXG4gICAgICAgICAgICAueChmdW5jdGlvbihkKSB7IHJldHVybiB4KGQuZGF0ZSk7IH0pXHJcbiAgICAgICAgICAgIC55KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHkoZC5jbG9zZSk7IH0pO1xyXG5cclxuICAgICAgICAvLyBEZWZpbmUgdGhlIHRvb2x0aXBzXHJcbiAgICAgICAgdmFyIHRpcCA9IGQzLnRpcCgpXHJcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdkMy10aXAnKVxyXG4gICAgICAgICAgICAub2Zmc2V0KFstMTAsIDBdKVxyXG4gICAgICAgICAgICAuaHRtbChmdW5jdGlvbiAoZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICcnICtcclxuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInRvb2x0aXBcIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxzdHJvbmc+JyArIGQuZGF0ZS5nZXRIb3VycygpICsgJzonICsgZC5kYXRlLmdldE1pbnV0ZXMoKSArICc8L3N0cm9uZz4gPHNwYW4+JyArIGQuY2xvc2UgKyAnIFVzZXJzPC9zcGFuPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gRGVmaW5lIHRoZSBTVkdcclxuICAgICAgICB2YXIgc3ZnID0gZDMuc2VsZWN0KCcjdmlzdWFsaXNhdGlvbicpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoJ3N2ZycpXHJcbiAgICAgICAgICAgICAgICAuYXR0cignd2lkdGgnLCB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxyXG4gICAgICAgICAgICAuYXBwZW5kKCdnJylcclxuICAgICAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBtYXJnaW4ubGVmdCArICcsJyArIG1hcmdpbi50b3AgKyAnKScpO1xyXG5cclxuICAgICAgICB2YXIgbGluZVN2ZyA9IHN2Zy5hcHBlbmQoJ2cnKTtcclxuXHJcbiAgICAgICAgLy8gQ2FsbCB0aGUgdG9vbHRpcHNcclxuICAgICAgICBzdmcuY2FsbCh0aXApO1xyXG5cclxuICAgICAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24oZCwgaW5kZXgpIHtcclxuICAgICAgICAgICAgZC5kYXRlID0gZC5kYXRlO1xyXG4gICAgICAgICAgICBkLmNsb3NlID0gKyhNYXRoLmZsb29yKChNYXRoLnJhbmRvbSgpICogMTYpICsgMSkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBTZXR1cCB0aGUgWC9ZIGRvbWFpbnNcclxuICAgICAgICB4LmRvbWFpbihkMy5leHRlbnQoZGF0YSwgZnVuY3Rpb24gKGQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGQuZGF0ZTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHkuZG9tYWluKFswLCBkMy5tYXgoZGF0YSwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZC5jbG9zZTtcclxuICAgICAgICB9KV0pO1xyXG5cclxuICAgICAgICAvLyBBZGQgdGhlIFggQXhpc1xyXG4gICAgICAgIHN2Zy5hcHBlbmQoJ2cnKVxyXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAneCBheGlzJylcclxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoMCwnICsgaGVpZ2h0ICsgJyknKVxyXG4gICAgICAgICAgICAuY2FsbCh4QXhpcylcclxuICAgICAgICAgICAgLnNlbGVjdEFsbCgndGV4dCcpXHJcbiAgICAgICAgICAgICAgICAuc3R5bGUoJ3RleHQtYW5jaG9yJywgJ2VuZCcpXHJcbiAgICAgICAgICAgICAgICAuYXR0cignZHgnLCAnLS44ZW0nKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2R5JywgJy4xNWVtJylcclxuICAgICAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdyb3RhdGUoLTYwKSdcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBBZGQgdGhlIFkgQXhpc1xyXG4gICAgICAgIHN2Zy5hcHBlbmQoJ2cnKVxyXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAneSBheGlzJylcclxuICAgICAgICAgICAgLmNhbGwoeUF4aXMpO1xyXG5cclxuICAgICAgICAvLyBBZGQgdGhlIGxpbmUgcGF0aFxyXG4gICAgICAgIGxpbmVTdmcuYXBwZW5kKCdwYXRoJylcclxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpbmUnKVxyXG4gICAgICAgICAgICAuYXR0cignZCcsIGxpbmUoZGF0YSkpO1xyXG5cclxuICAgICAgICAvLyBBZGQgY2lyY2xlcyB0byB0aGUgZGF0YSBwb2ludHMgYWxvbmcgdGhlIGxpbmVcclxuICAgICAgICBzdmcuc2VsZWN0QWxsKCcuY2lyY2xlJylcclxuICAgICAgICAgICAgLmRhdGEoZGF0YSlcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZCgnc3ZnOmNpcmNsZScpXHJcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdjaXJjbGUnKVxyXG4gICAgICAgICAgICAuYXR0cignY3gnLCBmdW5jdGlvbiAoZCwgaSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHgoZC5kYXRlKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmF0dHIoJ2N5JywgZnVuY3Rpb24gKGQsIGkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB5KGQuY2xvc2UpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuYXR0cigncicsIDQpXHJcbiAgICAgICAgICAgIC5vbignbW91c2VvdmVyJywgdGlwLnNob3cpXHJcbiAgICAgICAgICAgIC5vbignbW91c2VvdXQnLCB0aXAuaGlkZSk7XHJcbiAgICB9XHJcbn1dKTtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuYW5ndWxhci5tb2R1bGUoJ215QXBwLmRpcmVjdGl2ZXMnKS5kaXJlY3RpdmUoJ2FsdE1lbWJlclNlbGVjdCcsIFtcIiRsb2dcIiwgXCJVc2VyXCIsIGZ1bmN0aW9uKFxyXG4gICAgJGxvZyxcclxuICAgIFVzZXJcclxuKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICBzY29wZToge1xyXG4gICAgICAgICAgICBtZW1iZXJzOiAnPSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGxpbms6IHBvc3RMaW5rLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnc3BhY2UvYWx0LW1lbWJlci1zZWxlY3QvYWx0LW1lbWJlci1zZWxlY3QuaHRtbCdcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gcG9zdExpbmsoc2NvcGUsIGVsbSwgYXR0cnMpIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBBbmd1bGFyIG5nQ2xhc3MgZnVuY3Rpb24gZm9yIGEgdXNlcidzIHRpbGUuXHJcbiAgICAgICAgICogQHBhcmFtIHVzZXJcclxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXl9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2NvcGUuZ2V0VXNlclRpbGVDbGFzc2VzID0gZnVuY3Rpb24odXNlcikge1xyXG4gICAgICAgICAgICB2YXIgY2xhc3NlcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgaWYgKHNjb3BlLm1lbWJlcnMgJiYgc2NvcGUubWVtYmVycy5pbmRleE9mKHVzZXIuaWQpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaCgnbWVtYmVyJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBjbGFzc2VzO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENsaWNrIGhhbmRsZXIgZm9yIGEgdXNlcidzIHRpbGUuXHJcbiAgICAgICAgICogQHBhcmFtIHVzZXJcclxuICAgICAgICAgKi9cclxuICAgICAgICBzY29wZS5vblVzZXJUaWxlQ2xpY2sgPSBmdW5jdGlvbih1c2VyKSB7XHJcbiAgICAgICAgICAgIGlmICghIHNjb3BlLm1lbWJlcnMpIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlLm1lbWJlcnMgPSBbXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gc2NvcGUubWVtYmVycy5pbmRleE9mKHVzZXIuaWQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlLm1lbWJlcnMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlLm1lbWJlcnMucHVzaCh1c2VyLmlkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2NvcGUuJGVtaXQoJ3NwYWNlTWVtYmVyc0NoYW5nZWQnLCBzY29wZS5tZW1iZXJzKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTZWxmLWV4ZWN1dGluZyBpbml0aWFsaXplIGZ1bmN0aW9uLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIChmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgICAgICAgICAvLyBHZXQgYWxsIHVzZXJzICh3b3VsZCBuZWVkIHRvIGJlIHBhZ2luYXRlZCBpbiB0aGUgZnV0dXJlKVxyXG4gICAgICAgICAgICBVc2VyLmdldEFsbChmdW5jdGlvbih1c2Vycykge1xyXG4gICAgICAgICAgICAgICAgc2NvcGUudXNlcnMgPSB1c2VycztcclxuICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICRsb2cuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSgpO1xyXG4gICAgfVxyXG59XSk7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==