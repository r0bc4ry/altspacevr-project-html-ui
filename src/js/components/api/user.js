'use strict';

angular.module('myApp.services').service('User', function(
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
});
