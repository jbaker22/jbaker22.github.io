function multiline(data) {
    // http://bl.ocks.org/gniemetz/4618602
    // http://bl.ocks.org/mbostock/3884955
    var focus_margin = {top: 20, right: 80, bottom: 100, left: 40},
        focus_width = 960 - focus_margin.left - focus_margin.right,
        focus_height = 500 - focus_margin.top - focus_margin.bottom,
        context_margin = {top: 430, right: 80, bottom: 20, left: 40},
        context_height = 500 - context_margin.top - context_margin.bottom;

    var formatting = d3.format(",.0f");

    var formatDate = d3.time.format("%b %Y"),
        parseDate = formatDate.parse,
        formatting = d3.format(",.0f");
        bisectDate = d3.bisector(function(d) { return d.Month; }).left,
        formatOutput0 = function(d) { return formatDate(d.Month) + " - " + "Total Drivers: " + formatting(d.drivers); },
        formatOutput1 = function(d) { return formatDate(d.Month) + " - " + "Drivers Killed: " + d.DriversKilled; },
        formatOutput2 = function(d) { return formatDate(d.Month) + " - " + "Front-Seat Casualties: " + formatting(d.front); };

    data.forEach(function(d) {
        d.Month = parseDate(d.Month);
        d.drivers = +d.drivers;
        d.DriversKilled = +d.DriversKilled;
        d.front = +d.front;
    });

    // set x scales for both context and focus views
    var focus_x = d3.time.scale()
        .range([0, focus_width]),
        context_x = d3.time.scale()
        .range([0, focus_width]);

    // set y scales for both context and focus views
    var focus_y0 = d3.scale.linear()
        .range([focus_height, 0]),
        context_y0 = d3.scale.linear()
        .range([context_height, 0]);

    // create x-axes for focus and context
    var focus_xAxis = d3.svg.axis()
        .scale(focus_x)
        .tickFormat(d3.time.format("%b %Y"))
        .orient("bottom"),
        context_xAxis = d3.svg.axis()
        .scale(context_x)
        .tickFormat(d3.time.format("%b %Y"))
        .orient("bottom");

    // create left and right axes for focus only
    var focus_yAxisLeft = d3.svg.axis()
        .scale(focus_y0)
        .orient("left");
        // focus_yAxisRight = d3.svg.axis()
        // .scale(focus_y1)
        // .orient("right");

    // create brush object
    var brush = d3.svg.brush()
        .x(context_x)
        .on("brush", brush);

    var focus_line0 = d3.svg.line()
        .interpolate("linear")
        .x(function(d) { return focus_x(d.Month); })
        .y(function(d) { return focus_y0(d.drivers); });

    var focus_line1 = d3.svg.line()
        .interpolate("linear")
        .x(function(d) { return focus_x(d.Month); })
        .y(function(d) { return focus_y0(d.DriversKilled); });

    var focus_line2 = d3.svg.line()
        .interpolate("linear")
        .x(function(d) { return focus_x(d.Month); })
        .y(function(d) { return focus_y0(d.front); });


    // add lines to context plot
    var context_line0 = d3.svg.line()
        .x(function(d) { return context_x(d.Month); })
        .y(function(d) { return context_y0(d.drivers); });

    var context_line1 = d3.svg.line()
        .x(function(d) { return context_x(d.Month); })
        .y(function(d) { return context_y0(d.DriversKilled); });

    var context_line2 = d3.svg.line()
        .x(function(d) { return context_x(d.Month); })
        .y(function(d) { return context_y0(d.front); });

    var svg = d3.select("#multiseries").append("svg")
        .attr("id", "plot")
        .attr("display", "block")
        .attr("width", focus_width + focus_margin.left + focus_margin.right)
        .attr("height", focus_height + focus_margin.top + focus_margin.bottom);

    var area = d3.svg.area()
            .interpolate("linear")
            .x(function(d) { return x(d.Month); })
            .y(function(d) { return y(d.drivers); });
            // .y0(function(d) { return y(0); });


    // ensure line paths don't overlap axes
    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", focus_width)
        .attr("height", focus_height);

    var main = svg.append("g")
        .attr("transform", "translate(" + focus_margin.left + "," + focus_margin.top + ")");

    var mini = svg.append("g")
        .attr("transform", "translate(" + context_margin.left + "," + context_margin.top + ")");

    // order dates sequentially
    data.sort(function(a, b) {
        return a.Month - b.Month;
    });

    // set domains for x, y1, and y2 for both context and focus plots
    focus_x.domain([data[0].Month, data[data.length - 1].Month]);
    focus_y0.domain([0, d3.max(data, function(d) { return d.drivers; })]).nice();
    // focus_y1.domain([0, d3.max(data, function(d) { return d.kms; })]).nice();
    context_x.domain(focus_x.domain());
    context_y0.domain(focus_y0.domain()).nice();
    // context_y1.domain(focus_y1.domain()).nice();

    // add x- and y-axis
    main.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + focus_height + ")")
        .call(focus_xAxis);

    main.append("g")
        .attr("class", "y axis axisLeft")
        .call(focus_yAxisLeft)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Drivers");

    // add clipping paths - draws the actual lines
    main.append("path")
        .datum(data)
        .attr("clip-path", "url(#clip)")
        .attr("class", "line line0")
        .attr("d", focus_line0);

    main.append("path")
        .datum(data)
        .attr("clip-path", "url(#clip)")
        .attr("class", "line line1")
        .attr("d", focus_line1);

    main.append("path")
        .datum(data)
        .attr("clip-path", "url(#clip)")
        .attr("class", "line line2")
        .attr("d", focus_line2);

    mini.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + context_height + ")")
        .call(focus_xAxis);

    // append fill portion for time period when law was enacted
    mini.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", context_line0);

    mini.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", context_line1);

    mini.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", context_line2);


    mini.append("g")
        .attr("class", "x brush")
        .call(brush)
        .selectAll("rect")
        .attr("y", -6)
        .attr("height", context_height + 7);

    var focus = main.append("g")
        .attr("class", "focus")
        .style("display", "none");

    // Display on the timeline
    focus.append("line")
        .attr("class", "x")
        .attr("y1", focus_y0(0) - 6)
        .attr("y2", focus_y0(0) + 6)

    // Display on the left bar
    focus.append("line")
        .attr("class", "y0")
        .attr("x1", focus_width - 6) // to the left
        .attr("x2", focus_width + 6); // to the right

    focus.append("line")
        .attr("class", "y2")
        .attr("x1", focus_width - 6)
        .attr("x2", focus_width + 6);

    // Display on the right bar
    focus.append("line")
        .attr("class", "y1")
        .attr("x1", focus_width - 6)
        .attr("x2", focus_width + 6);

    // add focus circles and text to the hover tooltips
    focus.append("circle")
        .attr("class", "y0")
        .attr("r", 4);

    focus.append("text")
        .attr("class", "y0")
        .attr("dy", "-1em")
        .style("text-anchor", "end");

    focus.append("circle")
        .attr("class", "y1")
        .attr("r", 4);

    focus.append("text")
        .attr("class", "y1")
        .attr("dy", "-1em")
        .style("text-anchor", "end");


    focus.append("circle")
        .attr("class", "y2")
        .attr("r", 4);

    focus.append("text")
        .attr("class", "y2")
        .attr("dy", "-1em")
        .style("text-anchor", "end");


    main.append("rect")
        .attr("class", "overlay")
        .attr("width", focus_width)
        .attr("height", focus_height)
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove);


    function mousemove() {
        var x0 = focus_x.invert(d3.mouse(this)[0]),
        i = bisectDate(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.Month > d1.Month - x0 ? d1 : d0;
        // add circles and text to the mousemove event
        focus.select("circle.y0").attr("transform", "translate(" + focus_x(d.Month) + "," + focus_y0(d.drivers) + ")");
        focus.select("text.y0").attr("transform", "translate(" + focus_x(d.Month) + "," + focus_y0(d.drivers) + ")")
            .text(formatOutput0(d));     // text for hover tooltip
        focus.select("circle.y1").attr("transform", "translate(" + focus_x(d.Month) + "," + focus_y0(d.DriversKilled) + ")");
        focus.select("text.y1").attr("transform", "translate(" + focus_x(d.Month) + "," + focus_y0(d.DriversKilled) + ")")
            .text(formatOutput1(d));   // text for hover tooltip
        focus.select("circle.y2").attr("transform", "translate(" + focus_x(d.Month) + "," + focus_y0(d.front) + ")");
        focus.select("text.y2").attr("transform", "translate(" + focus_x(d.Month) + "," + focus_y0(d.front) + ")")
            .text(formatOutput2(d));   // text for hover tooltip

        focus.select(".x").attr("transform", "translate(" + focus_x(d.Month) + ",0)");
        // control dotted lines to axis (y0, y1, y2)
        focus.select(".y0").attr("transform", "translate(" + focus_width * -1 + ", " + focus_y0(d.drivers) + ")")
               .attr("x2", focus_width + focus_x(d.Month));
        focus.select(".y1").attr("transform", "translate(" + focus_width * -1 + ", " + focus_y0(d.DriversKilled) + ")")
               .attr("x2", focus_width + focus_x(d.Month));
        focus.select(".y2").attr("transform", "translate(" + focus_width * -1 + ", " + focus_y0(d.front) + ")")
               .attr("x2", focus_width + focus_x(d.Month));
    }

    function brush() {
        focus_x.domain(brush.empty() ? context_x.domain() : brush.extent());
        main.select(".line0").attr("d", focus_line0);
        main.select(".line1").attr("d", focus_line1);
        main.select(".line2").attr("d", focus_line2);
        main.select(".x.axis").call(focus_xAxis);
    }
}