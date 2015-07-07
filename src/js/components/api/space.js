'use strict';

angular.module('myApp.services').service('Space', function(
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
});
