'use strict';

angular.module('myApp.directives').directive('altChart', function(
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
});
