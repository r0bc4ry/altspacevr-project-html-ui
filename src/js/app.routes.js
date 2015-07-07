'use strict';

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
