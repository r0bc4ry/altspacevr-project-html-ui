'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp').config(function(
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
});
