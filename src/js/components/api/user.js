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
});
