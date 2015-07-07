'use strict';

angular.module('myApp.directives').directive('altChart', function(
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
});
