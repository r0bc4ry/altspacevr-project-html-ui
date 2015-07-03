'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
    'ngRoute',

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

angular.module('myApp.controllers').controller('DashboardController', ["$location", "$q", "$scope", "Space", "User", function(
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
}]);
'use strict';

angular.module('myApp.controllers').controller('SpaceController', function() {

});
'use strict';

angular.module('myApp.directives').directive('altHeader', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        link: postLink,
        templateUrl: 'components/alt-header/alt-header.html'
    };

    function postLink(scope, elm, attrs) {

    }
});

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
            resolveCallback(spaces);
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
            resolveCallback(storedData);
        } else {
            Data.Space.getById(params.id).then(function(space) {
                // Cache returned space
                cache.put(space.id, space);

                // Invoke the resolveCallback function
                resolveCallback(space);
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
    this.updateById = function(params, resolveCallback, rejectCallback) {
        if (! params.id) {
            rejectCallback('A required parameter (id) is missing.');
        }

        Data.Space.updateById(params.id).then(function(space) {
            // Cache returned space
            cache.put(space.id, space);

            // Invoke the resolveCallback function
            resolveCallback(space);
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
    this.create = function(params, resolveCallback, rejectCallback) {
        Data.Space.create(params).then(function(space) {
            // Cache returned space
            cache.put(space.id, space);

            // Invoke the resolveCallback function
            resolveCallback(space);
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
            cache.remove(space.id);

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
            resolveCallback(users);
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
            resolveCallback(storedData);
        } else {
            Data.User.getById(params.id).then(function(user) {
                // Cache returned user
                cache.put(user.id, user);

                // Invoke the resolveCallback function
                resolveCallback(user);
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
    this.updateById = function(params, resolveCallback, rejectCallback) {
        if (! params.id) {
            rejectCallback('A required parameter (id) is missing.');
        }

        Data.User.updateById(params.id).then(function(user) {
            // Cache returned user
            cache.put(user.id, user);

            // Invoke the resolveCallback function
            resolveCallback(user);
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
    this.create = function(params, resolveCallback, rejectCallback) {
        Data.User.create(params).then(function(user) {
            // Cache returned user
            cache.put(user.id, user);

            // Invoke the resolveCallback function
            resolveCallback(user);
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
            cache.remove(user.id);

            // Invoke the resolveCallback function
            resolveCallback();
        }, function(reason) {
            rejectCallback ? rejectCallback(reason) : resolveCallback(reason);
        });
    };
}]);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5tb2R1bGVzLmpzIiwiYXBwLnJvdXRlcy5qcyIsImRhc2hib2FyZC9kYXNoYm9hcmQtY29udHJvbGxlci5qcyIsInNwYWNlL3NwYWNlLWNvbnRyb2xsZXIuanMiLCJjb21wb25lbnRzL2FsdC1oZWFkZXIvYWx0LWhlYWRlci5qcyIsImNvbXBvbmVudHMvYWx0LXNwYWNlLXJvdy9hbHQtc3BhY2Utcm93LmpzIiwiY29tcG9uZW50cy9hcGkvc3BhY2UuanMiLCJjb21wb25lbnRzL2FwaS91c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG4vLyBEZWNsYXJlIGFwcCBsZXZlbCBtb2R1bGUgd2hpY2ggZGVwZW5kcyBvbiB2aWV3cywgYW5kIGNvbXBvbmVudHNcbmFuZ3VsYXIubW9kdWxlKCdteUFwcCcsIFtcbiAgICAnbmdSb3V0ZScsXG5cbiAgICAnbmdEcm9wZG93bnMnLFxuXG4gICAgJ215QXBwLmNvbnRyb2xsZXJzJyxcbiAgICAnbXlBcHAuZGlyZWN0aXZlcycsXG4gICAgJ215QXBwLnNlcnZpY2VzJyxcbiAgICAnbXlBcHAudGVtcGxhdGVzJ1xuXSk7XG5cbmFuZ3VsYXIubW9kdWxlKCdteUFwcC5jb250cm9sbGVycycsIFtdKTtcbmFuZ3VsYXIubW9kdWxlKCdteUFwcC5kaXJlY3RpdmVzJywgW10pO1xuYW5ndWxhci5tb2R1bGUoJ215QXBwLnNlcnZpY2VzJywgW10pO1xuYW5ndWxhci5tb2R1bGUoJ215QXBwLnRlbXBsYXRlcycsIFtdKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gRGVjbGFyZSBhcHAgbGV2ZWwgbW9kdWxlIHdoaWNoIGRlcGVuZHMgb24gdmlld3MsIGFuZCBjb21wb25lbnRzXG5hbmd1bGFyLm1vZHVsZSgnbXlBcHAnKS5jb25maWcoW1wiJHJvdXRlUHJvdmlkZXJcIiwgZnVuY3Rpb24oXG4gICAgJHJvdXRlUHJvdmlkZXJcbikge1xuICAgICRyb3V0ZVByb3ZpZGVyLndoZW4oJy8nLCB7XG4gICAgICAgIHRlbXBsYXRlVXJsOiAnZGFzaGJvYXJkL2Rhc2hib2FyZC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0Rhc2hib2FyZENvbnRyb2xsZXInXG4gICAgfSk7XG5cbiAgICAkcm91dGVQcm92aWRlci53aGVuKCcvc3BhY2VzLzppZCcsIHtcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdzcGFjZS9zcGFjZS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1NwYWNlQ29udHJvbGxlcidcbiAgICB9KTtcblxuICAgICRyb3V0ZVByb3ZpZGVyLm90aGVyd2lzZSh7cmVkaXJlY3RUbzogJy8nfSk7XG59XSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdteUFwcC5jb250cm9sbGVycycpLmNvbnRyb2xsZXIoJ0Rhc2hib2FyZENvbnRyb2xsZXInLCBbXCIkbG9jYXRpb25cIiwgXCIkcVwiLCBcIiRzY29wZVwiLCBcIlNwYWNlXCIsIFwiVXNlclwiLCBmdW5jdGlvbihcbiAgICAkbG9jYXRpb24sXG4gICAgJHEsXG4gICAgJHNjb3BlLFxuICAgIFNwYWNlLFxuICAgIFVzZXJcbikge1xuICAgICRzY29wZS5kZFNlbGVjdE9wdGlvbnMgPSBbe1xuICAgICAgICB0ZXh0OiAnQWxsIFNwYWNlcycsXG4gICAgICAgIHZhbHVlOiAnYWxsJ1xuICAgIH0sIHtcbiAgICAgICAgdGV4dDogJ1dlbGNvbWUgU3BhY2VzJyxcbiAgICAgICAgdmFsdWU6ICd3ZWxjb21lJ1xuICAgIH0sIHtcbiAgICAgICAgdGV4dDogJ1ByaXZhdGUgU3BhY2VzJyxcbiAgICAgICAgdmFsdWU6ICdwcml2YXRlJ1xuICAgIH0sIHtcbiAgICAgICAgdGV4dDogJ0ZlYXR1cmVkIFNwYWNlcycsXG4gICAgICAgIHZhbHVlOiAnZmVhdHVyZWQnXG4gICAgfV07XG5cbiAgICAkc2NvcGUuZGRTZWxlY3RTZWxlY3RlZCA9IHtcbiAgICAgICAgdGV4dDogJ0FsbCBTcGFjZXMnLFxuICAgICAgICB2YWx1ZTogJ2FsbCdcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogb25DaGFuZ2UgaGFuZGxlciBmb3IgdGhlIGRyb3Bkb3duIGZpbHRlci5cbiAgICAgKiBAcGFyYW0gdmFsdWVcbiAgICAgKi9cbiAgICAkc2NvcGUub25Ecm9wZG93bkNoYW5nZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGdldFNwYWNlcygpLnRoZW4oZnVuY3Rpb24oc3BhY2VzKSB7XG4gICAgICAgICAgICAkc2NvcGUuc3BhY2VzID0gc3BhY2VzLmZpbHRlcihmdW5jdGlvbihzcGFjZSkge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZS52YWx1ZSA9PT0gJ2FsbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNwYWNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gc3BhY2VbdmFsdWUudmFsdWVdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBUT0RPIERldGVybWluZSBhIGJldHRlciB3YXkgdG8gaGFuZGxlIHJldHJpZXZpbmcvc3RvcmluZyBkYXRhXG4gICAgZnVuY3Rpb24gZ2V0U3BhY2VzKCkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgIFNwYWNlLmdldEFsbChmdW5jdGlvbihzcGFjZXMpIHtcbiAgICAgICAgICAgIHZhciBzcGFjZURlZmVycmVkcyA9IFtdO1xuXG4gICAgICAgICAgICAvLyBHZXQgdGhlIGNyZWF0aW5nIHVzZXIgZm9yIGVhY2ggc3BhY2VcbiAgICAgICAgICAgIHNwYWNlcy5mb3JFYWNoKGZ1bmN0aW9uKHNwYWNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzcGFjZS5jcmVhdGVkX2J5ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHNwYWNlRGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgICAgIHNwYWNlRGVmZXJyZWRzLnB1c2goc3BhY2VEZWZlcnJlZCk7XG5cbiAgICAgICAgICAgICAgICBVc2VyLmdldEJ5SWQoe1xuICAgICAgICAgICAgICAgICAgICBpZDogc3BhY2UuY3JlYXRlZF9ieVxuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc3BhY2UuY3JlYXRlZF9ieSA9IHVzZXI7XG4gICAgICAgICAgICAgICAgICAgIHNwYWNlRGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAkcS5hbGwoc3BhY2VEZWZlcnJlZHMpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShzcGFjZXMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH1cblxuICAgICRzY29wZS5nbyA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICAgICAgJGxvY2F0aW9uLnBhdGgocGF0aCk7XG4gICAgfTtcblxuICAgIChmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICBnZXRTcGFjZXMoKS50aGVuKGZ1bmN0aW9uKHNwYWNlcykge1xuICAgICAgICAgICAgJHNjb3BlLnNwYWNlcyA9IHNwYWNlcztcbiAgICAgICAgfSk7XG4gICAgfSkoKTtcbn1dKTsiLCIndXNlIHN0cmljdCc7XG5cbmFuZ3VsYXIubW9kdWxlKCdteUFwcC5jb250cm9sbGVycycpLmNvbnRyb2xsZXIoJ1NwYWNlQ29udHJvbGxlcicsIGZ1bmN0aW9uKCkge1xuXG59KTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnbXlBcHAuZGlyZWN0aXZlcycpLmRpcmVjdGl2ZSgnYWx0SGVhZGVyJywgZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcclxuICAgICAgICBzY29wZToge30sXHJcbiAgICAgICAgbGluazogcG9zdExpbmssXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdjb21wb25lbnRzL2FsdC1oZWFkZXIvYWx0LWhlYWRlci5odG1sJ1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBwb3N0TGluayhzY29wZSwgZWxtLCBhdHRycykge1xyXG5cclxuICAgIH1cclxufSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdteUFwcC5kaXJlY3RpdmVzJykuZGlyZWN0aXZlKCdhbHRTcGFjZVJvdycsIGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXHJcbiAgICAgICAgc2NvcGU6IHtcclxuICAgICAgICAgICAgc3BhY2U6ICc9J1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbGluazogcG9zdExpbmssXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdjb21wb25lbnRzL2FsdC1zcGFjZS1yb3cvYWx0LXNwYWNlLXJvdy5odG1sJ1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBwb3N0TGluayhzY29wZSwgZWxtLCBhdHRycykge1xyXG5cclxuICAgIH1cclxufSk7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmFuZ3VsYXIubW9kdWxlKCdteUFwcC5zZXJ2aWNlcycpLnNlcnZpY2UoJ1NwYWNlJywgW1wiJGNhY2hlRmFjdG9yeVwiLCBmdW5jdGlvbihcclxuICAgICRjYWNoZUZhY3RvcnlcclxuKSB7XHJcbiAgICB2YXIgY2FjaGUgPSAkY2FjaGVGYWN0b3J5KCdzcGFjZScpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3BhY2UgZ2V0QWxsKCkgc2hpbS5cclxuICAgICAqIEBwYXJhbSByZXNvbHZlQ2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSByZWplY3RDYWxsYmFja1xyXG4gICAgICovXHJcbiAgICB0aGlzLmdldEFsbCA9IGZ1bmN0aW9uKHJlc29sdmVDYWxsYmFjaywgcmVqZWN0Q2FsbGJhY2spIHtcclxuICAgICAgICBEYXRhLlNwYWNlLmdldEFsbCgpLnRoZW4oZnVuY3Rpb24oc3BhY2VzKSB7XHJcbiAgICAgICAgICAgIC8vIENhY2hlIGVhY2ggcmV0dXJuZWQgc3BhY2VcclxuICAgICAgICAgICAgc3BhY2VzLmZvckVhY2goZnVuY3Rpb24oc3BhY2UpIHtcclxuICAgICAgICAgICAgICAgIGNhY2hlLnB1dChzcGFjZS5pZCwgc3BhY2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEludm9rZSB0aGUgcmVzb2x2ZUNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjayhzcGFjZXMpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjayA/IHJlamVjdENhbGxiYWNrKHJlYXNvbikgOiByZXNvbHZlQ2FsbGJhY2socmVhc29uKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTcGFjZSBnZXRCeUlkKCkgc2hpbS5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEBwYXJhbSByZXNvbHZlQ2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSByZWplY3RDYWxsYmFja1xyXG4gICAgICovXHJcbiAgICB0aGlzLmdldEJ5SWQgPSBmdW5jdGlvbihwYXJhbXMsIHJlc29sdmVDYWxsYmFjaywgcmVqZWN0Q2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoISBwYXJhbXMuaWQpIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2soJ0EgcmVxdWlyZWQgcGFyYW1ldGVyIChpZCkgaXMgbWlzc2luZy4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzdG9yZWREYXRhID0gY2FjaGUuZ2V0KHBhcmFtcy5pZCk7XHJcblxyXG4gICAgICAgIGlmIChzdG9yZWREYXRhKSB7XHJcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjayhzdG9yZWREYXRhKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBEYXRhLlNwYWNlLmdldEJ5SWQocGFyYW1zLmlkKS50aGVuKGZ1bmN0aW9uKHNwYWNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDYWNoZSByZXR1cm5lZCBzcGFjZVxyXG4gICAgICAgICAgICAgICAgY2FjaGUucHV0KHNwYWNlLmlkLCBzcGFjZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSW52b2tlIHRoZSByZXNvbHZlQ2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjayhzcGFjZSk7XHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2sgPyByZWplY3RDYWxsYmFjayhyZWFzb24pIDogcmVzb2x2ZUNhbGxiYWNrKHJlYXNvbik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTcGFjZSB1cGRhdGVCeUlkKCkgc2hpbS5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEBwYXJhbSByZXNvbHZlQ2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSByZWplY3RDYWxsYmFja1xyXG4gICAgICovXHJcbiAgICB0aGlzLnVwZGF0ZUJ5SWQgPSBmdW5jdGlvbihwYXJhbXMsIHJlc29sdmVDYWxsYmFjaywgcmVqZWN0Q2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoISBwYXJhbXMuaWQpIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2soJ0EgcmVxdWlyZWQgcGFyYW1ldGVyIChpZCkgaXMgbWlzc2luZy4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIERhdGEuU3BhY2UudXBkYXRlQnlJZChwYXJhbXMuaWQpLnRoZW4oZnVuY3Rpb24oc3BhY2UpIHtcclxuICAgICAgICAgICAgLy8gQ2FjaGUgcmV0dXJuZWQgc3BhY2VcclxuICAgICAgICAgICAgY2FjaGUucHV0KHNwYWNlLmlkLCBzcGFjZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBJbnZva2UgdGhlIHJlc29sdmVDYWxsYmFjayBmdW5jdGlvblxyXG4gICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2soc3BhY2UpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjayA/IHJlamVjdENhbGxiYWNrKHJlYXNvbikgOiByZXNvbHZlQ2FsbGJhY2socmVhc29uKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTcGFjZSBjcmVhdGUoKSBzaGltLlxyXG4gICAgICogQHBhcmFtIHBhcmFtc1xyXG4gICAgICogQHBhcmFtIHJlc29sdmVDYWxsYmFja1xyXG4gICAgICogQHBhcmFtIHJlamVjdENhbGxiYWNrXHJcbiAgICAgKi9cclxuICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24ocGFyYW1zLCByZXNvbHZlQ2FsbGJhY2ssIHJlamVjdENhbGxiYWNrKSB7XHJcbiAgICAgICAgRGF0YS5TcGFjZS5jcmVhdGUocGFyYW1zKS50aGVuKGZ1bmN0aW9uKHNwYWNlKSB7XHJcbiAgICAgICAgICAgIC8vIENhY2hlIHJldHVybmVkIHNwYWNlXHJcbiAgICAgICAgICAgIGNhY2hlLnB1dChzcGFjZS5pZCwgc3BhY2UpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW52b2tlIHRoZSByZXNvbHZlQ2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAgICAgICAgcmVzb2x2ZUNhbGxiYWNrKHNwYWNlKTtcclxuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2sgPyByZWplY3RDYWxsYmFjayhyZWFzb24pIDogcmVzb2x2ZUNhbGxiYWNrKHJlYXNvbik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU3BhY2UgZGVsZXRlQnlJZCgpIHNoaW0uXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1zXHJcbiAgICAgKiBAcGFyYW0gcmVzb2x2ZUNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0gcmVqZWN0Q2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgdGhpcy5kZWxldGVCeUlkID0gZnVuY3Rpb24ocGFyYW1zLCByZXNvbHZlQ2FsbGJhY2ssIHJlamVjdENhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKCEgcGFyYW1zLmlkKSB7XHJcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrKCdBIHJlcXVpcmVkIHBhcmFtZXRlciAoaWQpIGlzIG1pc3NpbmcuJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBEYXRhLlNwYWNlLmRlbGV0ZUJ5SWQocGFyYW1zLmlkKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZGVsZXRlZCBzcGFjZVxyXG4gICAgICAgICAgICBjYWNoZS5yZW1vdmUoc3BhY2UuaWQpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW52b2tlIHRoZSByZXNvbHZlQ2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAgICAgICAgcmVzb2x2ZUNhbGxiYWNrKCk7XHJcbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XHJcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrID8gcmVqZWN0Q2FsbGJhY2socmVhc29uKSA6IHJlc29sdmVDYWxsYmFjayhyZWFzb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufV0pO1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG5hbmd1bGFyLm1vZHVsZSgnbXlBcHAuc2VydmljZXMnKS5zZXJ2aWNlKCdVc2VyJywgW1wiJGNhY2hlRmFjdG9yeVwiLCBmdW5jdGlvbihcclxuICAgICRjYWNoZUZhY3RvcnlcclxuKSB7XHJcbiAgICB2YXIgY2FjaGUgPSAkY2FjaGVGYWN0b3J5KCd1c2VyJyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVc2VyIGdldEFsbCgpIHNoaW0uXHJcbiAgICAgKiBAcGFyYW0gcmVzb2x2ZUNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0gcmVqZWN0Q2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgdGhpcy5nZXRBbGwgPSBmdW5jdGlvbihyZXNvbHZlQ2FsbGJhY2ssIHJlamVjdENhbGxiYWNrKSB7XHJcbiAgICAgICAgRGF0YS5Vc2VyLmdldEFsbCgpLnRoZW4oZnVuY3Rpb24odXNlcnMpIHtcclxuICAgICAgICAgICAgLy8gQ2FjaGUgZWFjaCByZXR1cm5lZCB1c2VyXHJcbiAgICAgICAgICAgIHVzZXJzLmZvckVhY2goZnVuY3Rpb24odXNlcikge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUucHV0KHVzZXIuaWQsIHVzZXIpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEludm9rZSB0aGUgcmVzb2x2ZUNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjayh1c2Vycyk7XHJcbiAgICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XHJcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrID8gcmVqZWN0Q2FsbGJhY2socmVhc29uKSA6IHJlc29sdmVDYWxsYmFjayhyZWFzb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVzZXIgZ2V0QnlJZCgpIHNoaW0uXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1zXHJcbiAgICAgKiBAcGFyYW0gcmVzb2x2ZUNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0gcmVqZWN0Q2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgdGhpcy5nZXRCeUlkID0gZnVuY3Rpb24ocGFyYW1zLCByZXNvbHZlQ2FsbGJhY2ssIHJlamVjdENhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYgKCEgcGFyYW1zLmlkKSB7XHJcbiAgICAgICAgICAgIHJlamVjdENhbGxiYWNrKCdBIHJlcXVpcmVkIHBhcmFtZXRlciAoaWQpIGlzIG1pc3NpbmcuJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc3RvcmVkRGF0YSA9IGNhY2hlLmdldChwYXJhbXMuaWQpO1xyXG5cclxuICAgICAgICBpZiAoc3RvcmVkRGF0YSkge1xyXG4gICAgICAgICAgICByZXNvbHZlQ2FsbGJhY2soc3RvcmVkRGF0YSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgRGF0YS5Vc2VyLmdldEJ5SWQocGFyYW1zLmlkKS50aGVuKGZ1bmN0aW9uKHVzZXIpIHtcclxuICAgICAgICAgICAgICAgIC8vIENhY2hlIHJldHVybmVkIHVzZXJcclxuICAgICAgICAgICAgICAgIGNhY2hlLnB1dCh1c2VyLmlkLCB1c2VyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJbnZva2UgdGhlIHJlc29sdmVDYWxsYmFjayBmdW5jdGlvblxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZUNhbGxiYWNrKHVzZXIpO1xyXG4gICAgICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdENhbGxiYWNrID8gcmVqZWN0Q2FsbGJhY2socmVhc29uKSA6IHJlc29sdmVDYWxsYmFjayhyZWFzb24pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXNlciB1cGRhdGVCeUlkKCkgc2hpbS5cclxuICAgICAqIEBwYXJhbSBwYXJhbXNcclxuICAgICAqIEBwYXJhbSByZXNvbHZlQ2FsbGJhY2tcclxuICAgICAqIEBwYXJhbSByZWplY3RDYWxsYmFja1xyXG4gICAgICovXHJcbiAgICB0aGlzLnVwZGF0ZUJ5SWQgPSBmdW5jdGlvbihwYXJhbXMsIHJlc29sdmVDYWxsYmFjaywgcmVqZWN0Q2FsbGJhY2spIHtcclxuICAgICAgICBpZiAoISBwYXJhbXMuaWQpIHtcclxuICAgICAgICAgICAgcmVqZWN0Q2FsbGJhY2soJ0EgcmVxdWlyZWQgcGFyYW1ldGVyIChpZCkgaXMgbWlzc2luZy4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIERhdGEuVXNlci51cGRhdGVCeUlkKHBhcmFtcy5pZCkudGhlbihmdW5jdGlvbih1c2VyKSB7XHJcbiAgICAgICAgICAgIC8vIENhY2hlIHJldHVybmVkIHVzZXJcclxuICAgICAgICAgICAgY2FjaGUucHV0KHVzZXIuaWQsIHVzZXIpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW52b2tlIHRoZSByZXNvbHZlQ2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAgICAgICAgcmVzb2x2ZUNhbGxiYWNrKHVzZXIpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjayA/IHJlamVjdENhbGxiYWNrKHJlYXNvbikgOiByZXNvbHZlQ2FsbGJhY2socmVhc29uKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVc2VyIGNyZWF0ZSgpIHNoaW0uXHJcbiAgICAgKiBAcGFyYW0gcGFyYW1zXHJcbiAgICAgKiBAcGFyYW0gcmVzb2x2ZUNhbGxiYWNrXHJcbiAgICAgKiBAcGFyYW0gcmVqZWN0Q2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbihwYXJhbXMsIHJlc29sdmVDYWxsYmFjaywgcmVqZWN0Q2FsbGJhY2spIHtcclxuICAgICAgICBEYXRhLlVzZXIuY3JlYXRlKHBhcmFtcykudGhlbihmdW5jdGlvbih1c2VyKSB7XHJcbiAgICAgICAgICAgIC8vIENhY2hlIHJldHVybmVkIHVzZXJcclxuICAgICAgICAgICAgY2FjaGUucHV0KHVzZXIuaWQsIHVzZXIpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW52b2tlIHRoZSByZXNvbHZlQ2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAgICAgICAgcmVzb2x2ZUNhbGxiYWNrKHVzZXIpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjayA/IHJlamVjdENhbGxiYWNrKHJlYXNvbikgOiByZXNvbHZlQ2FsbGJhY2socmVhc29uKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVc2VyIGRlbGV0ZUJ5SWQoKSBzaGltLlxyXG4gICAgICogQHBhcmFtIHBhcmFtc1xyXG4gICAgICogQHBhcmFtIHJlc29sdmVDYWxsYmFja1xyXG4gICAgICogQHBhcmFtIHJlamVjdENhbGxiYWNrXHJcbiAgICAgKi9cclxuICAgIHRoaXMuZGVsZXRlQnlJZCA9IGZ1bmN0aW9uKHBhcmFtcywgcmVzb2x2ZUNhbGxiYWNrLCByZWplY3RDYWxsYmFjaykge1xyXG4gICAgICAgIGlmICghIHBhcmFtcy5pZCkge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjaygnQSByZXF1aXJlZCBwYXJhbWV0ZXIgKGlkKSBpcyBtaXNzaW5nLicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRGF0YS5Vc2VyLmRlbGV0ZUJ5SWQocGFyYW1zLmlkKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZGVsZXRlZCB1c2VyXHJcbiAgICAgICAgICAgIGNhY2hlLnJlbW92ZSh1c2VyLmlkKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEludm9rZSB0aGUgcmVzb2x2ZUNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgICAgICAgIHJlc29sdmVDYWxsYmFjaygpO1xyXG4gICAgICAgIH0sIGZ1bmN0aW9uKHJlYXNvbikge1xyXG4gICAgICAgICAgICByZWplY3RDYWxsYmFjayA/IHJlamVjdENhbGxiYWNrKHJlYXNvbikgOiByZXNvbHZlQ2FsbGJhY2socmVhc29uKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn1dKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9