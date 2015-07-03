angular.module("myApp.templates").run(["$templateCache", function($templateCache) {$templateCache.put("dashboard/dashboard.html","<div class=\"dashboard\">\n    <section class=\"filters\">\n        <div dropdown-select=\"ddSelectOptions\" dropdown-model=\"ddSelectSelected\" dropdown-onchange=\"onDropdownChange(selected)\"></div>\n        <div class=\"search\">\n            <i class=\"fa fa-search\"></i>\n            <input type=\"text\" ng-model=\"search\" placeholder=\"Search Spaces\">\n        </div>\n    </section>\n    <section>\n        <div class=\"table\">\n            <header>\n                <div class=\"title-column\">\n                    Name\n                </div>\n                <div class=\"description-column\">\n                    Description\n                </div>\n                <div class=\"members-column\">\n                    Users\n                </div>\n                <div class=\"created-by-column\">\n                    Created By\n                </div>\n                <div class=\"welcome-column\" title=\"Welcome Space\">\n                    <i class=\"fa fa-home\"></i>\n                </div>\n                <div class=\"private-column\" title=\"Private Space\">\n                    <i class=\"fa fa-lock\"></i>\n                </div>\n                <div class=\"featured-column\" title=\"Featured Space\">\n                    <i class=\"fa fa-star\"></i>\n                </div>\n            </header>\n            <alt-space-row ng-repeat=\"space in spaces | filter: search\" space=\"space\"></alt-space-row>\n        </div>\n    </section>\n</div>");
$templateCache.put("space/space.html","<div class=\"space\">\n    This is a space.\n</div>");
$templateCache.put("components/alt-header/alt-header.html","<header class=\"alt-header\">\r\n    <div class=\"branding\">\r\n        AltspaceVR Spaces Admin\r\n    </div>\r\n    <nav>\r\n        <button>\r\n            <i class=\"fa fa-plus\"></i> Create Space\r\n        </button>\r\n    </nav>\r\n</header>");
$templateCache.put("components/alt-space-row/alt-space-row.html","<div class=\"alt-space-row\">\r\n    <div class=\"title-column\">\r\n        {{ space.title }}\r\n    </div>\r\n    <div class=\"description-column\">\r\n        {{ space.description }}\r\n    </div>\r\n    <div class=\"members-column\">\r\n        {{ space.members ? space.members.length : 0 }}\r\n    </div>\r\n    <div class=\"created-by-column\">\r\n        {{ space.created_by.first_name }} {{ space.created_by.last_name }}\r\n    </div>\r\n    <div class=\"welcome-column\">\r\n        <i class=\"fa fa-circle-o\" ng-hide=\"space.welcome\"></i>\r\n        <i class=\"fa fa-dot-circle-o\" ng-show=\"space.welcome\"></i>\r\n    </div>\r\n    <div class=\"private-column\">\r\n        <i class=\"fa fa-circle-o\" ng-hide=\"space.private\"></i>\r\n        <i class=\"fa fa-dot-circle-o\" ng-show=\"space.private\"></i>\r\n    </div>\r\n    <div class=\"featured-column\">\r\n        <i class=\"fa fa-circle-o\" ng-hide=\"space.featured\"></i>\r\n        <i class=\"fa fa-dot-circle-o\" ng-show=\"space.featured\"></i>\r\n    </div>\r\n</div>");}]);