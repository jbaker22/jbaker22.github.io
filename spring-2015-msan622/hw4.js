function drawBars(data) {
    var opacity = d3.scale.linear()
        .domain([d3.min(data, function (d) { return d.values; }), 
                 d3.max(data, function (d) { return d.values; })])
        .range([1, .5]);

    // functions to fade in and fade out the bars on mouseover
    function fade(state_division, opacity) {
        svg.selectAll("rect")
            .style("fill", function(d) {return color(d.key);})
            .filter(function (d) {
                return d.key != key;
            })
            .style("opacity", opacity);
    }

    function fadeOut() {
        svg.selectAll("rect")
        .style("fill", "steelblue")
        .style("opacity", function (d) { opacity(d.key); });
    }

    // bars grouped by MPAA
    data = d3.nest()
        .key(function(d) {return d.mpaa;})
        .rollup(function(leaves) {return leaves.length;})
        .entries(data);

    var margin = {top: 20, right: 10, bottom: 20, left: 50},
        width = 425 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .domain(data.map(function(d) { return d.key; }))
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .domain([0, d3.max(data, function(d) { return +d.values; })])
        .range([height, 0])
        .nice();

    var formatting = d3.format(",.0f");
    // set color scale for regions
    var color = d3.scale.category10();


    // remove x-axis tick marks for each letter
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .outerTickSize(0)
        .innerTickSize(0);

    // set y-axis ticks to increment by 5
    var yAxis = d3.svg.axis()
         .scale(y)
        .orient("left")
        .ticks(4)
        .tickFormat(d3.format("d"))
        .tickSubdivide(0);

    // tooltip that includes the letter and frequency count on bar hover
    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([0, -15])
      .direction('n')
      .html(function(d) {
        return "<span style='font: 11px sans-serif;'>" +
                "MPAA: <span style='font-size: 14px; color: #fdae61;'>" + d.key + "</span><br>" + 
                "<span style='font: 11px sans-serif;'># of Movies: <strong><span style='font-size: 14px; color: #fdae61;'>" + formatting(d.values) + "</span></strong></span>";
      })

    // append a new SVG within the chart div
    var svg = d3.select("svg#bars")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
; 

    // var bbox = svg.node().getBoundingClientRect();
    // console.log("drawing x axis")
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      // .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "-1.2em")
      .style("text-anchor", "end")
      .text("# Movies");

    // calls the tooltip function
    svg.call(tip);


    // add bars
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.key); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.values); })
        .attr("height", function(d) { return height - y(d.values); })
        .attr("opacity", function (d) { return opacity(d.key); })
        .style("fill", "steelblue")
        .on('mouseover', function (d) {
            tip.show(d);
        })
        .on('mouseout', function (d) {
            tip.hide(d);
        });


}

function drawHeatmap(data) {
    // http://blog.nextgenetics.net/?e=44
    // http://bl.ocks.org/tjdecke/5558084
    var margin = {top: 20, right: 10, bottom: 20, left: 50},
        width = 425 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

      gridSize = Math.floor(width / 6),
      legendElementWidth = gridSize*2,
      buckets = 6,
      colors = ['rgb(178,24,43)','rgb(239,138,98)','rgb(253,219,199)','rgb(209,229,240)','rgb(103,169,207)','rgb(33,102,172)']
      mpaa = ["NC-17", "PG", "PG-13","R"],
      genres = ["Animation", "Documentary", "Drama", "Mixed", "NA", "Short"];

  d3.csv("movie_heatmap_data.csv",
    function(d) {
      return {
        mpaa: +d.mpaa,
        genre: +d.genre,
        value: +d.arpt
      };
    },
    function(error, data) {
      var colorScale = d3.scale.quantile()
          .domain([0, buckets - 1, d3.max(data, function (d) { return d.value; })])
          .range(colors);

      var svg = d3.select("svg#heatmap")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var dayLabels = svg.selectAll(".dayLabel")
          .data(mpaa)
          .enter().append("text")
            .text(function (d) { return d; })
            .attr("x", 0)
            .attr("y", function (d, i) { return i * gridSize; })
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
            .attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

      var timeLabels = svg.selectAll(".timeLabel")
          .data(genres)
          .enter().append("text")
            .text(function(d) { return d; })
            .attr("x", function(d, i) { return i * gridSize; })
            .attr("y", 0)
            .style("text-anchor", "middle")
            .attr("transform", "translate(" + gridSize / 2 + ", -6)")
            .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

      // console.log("data", data);
      var heatMap = svg.selectAll(".hour")
          .data(data)
          .enter().append("rect")
          .attr("x", function(d) { return (d.genre - 1) * gridSize; })
          .attr("y", function(d) { return (d.mpaa - 1) * gridSize; })
          .attr("rx", 4)
          .attr("ry", 4)
          .attr("class", "hour bordered")
          .attr("width", gridSize)
          .attr("height", gridSize)
          .style("fill", function(d) { return colorScale(d.value); });

      heatMap.append("title").text(function(d) { return d.value; });
          
      var legend = svg.selectAll(".legend")
          .data([0].concat(colorScale.quantiles()), function(d) { return d; })
          .enter().append("g")
          .attr("class", "legend");

      legend.append("rect")
        .attr("x", function(d, i) { return legendElementWidth * i; })
        .attr("y", height)
        .attr("width", legendElementWidth)
        .attr("height", gridSize / 2)
        .style("fill", function(d, i) { return colors[i]; });

      legend.append("text")
        .attr("class", "mono")
        .text(function(d) { return "≥ " + Math.round(d); })
        .attr("x", function(d, i) { return legendElementWidth * i; })
        .attr("y", height + gridSize);

  });



}


// function to draw small multiple time series

function drawMultiples(data) {
  // http://flowingdata.com/2014/10/15/linked-small-multiples/
  // http://bl.ocks.org/officeofjane/7315455
  // http://bl.ocks.org/mbostock/9490313
  // gist.github.com/mbostock/1157787

    // reset margins for small multiples
    var margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = 425 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

    var cat_list = ["state_pop", "state_income", "murder", "frost", "life_exp"];
        // set fade levels to correspond to values
    var opacity = d3.scale.linear()
        .domain([d3.min(data, function (d) { return d[name]; }), 
                 d3.max(data, function (d) { return d[name]; })])
        .range([1, .5]);

    // functions to fade in and fade out the bars on mouseover
    function fade(state_division, opacity) {
        svg.selectAll("rect")
            .style("fill", function(d) {return color(d.state_division);})
            .filter(function (d) {
                return d.state_division != state_division;
            })
            .style("opacity", opacity);
    }

    function fadeOut() {
        svg.selectAll("rect")
        .style("fill", "steelblue")
        .style("opacity", function (d) { opacity(d.state_division); });
    }
    
    var mult_data = [];
    var cat_data = {};
    // for each category... 
    for (var i = 0; i < cat_list.length; i++) {
        // set key: category
        var cat_data = d3.nest()
            .key(function(d) {return cat_list[i];})
            .entries(data);
        // update dictionary of category & state values
        mult_data.push(cat_data[0]);
    }

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width + 10], .1);

    // Scales. Note the inverted domain fo y-scale: bigger is up!
    var y = d3.scale.linear()
        .range([height, 0.5]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .outerTickSize(0)
        .innerTickSize(0);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

      // Compute the minimum and maximum year and percent across symbols.
      x.domain(data.map(function(d) { return d.state_abb; }));
      // y.domain([0, d3.max(mult_data, function(s) { return s.values[0].state_pop; })]);

      // Add an SVG element for each category, with the desired dimensions and margin.
      var svg = d3.select("#smallMultiples").selectAll("svg")
        .data(mult_data)
        .enter()
        .append("svg:svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("id", "plot")
        .attr("display", "block")
        .append("g")
        .attr("transform", "translate(10,"  + margin.top + ")")
        // function to change the y-domain based on the statistic
        .each(multiple);

      svg.append("g")
          .attr("class", "x axis2")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

      svg.append("g")
        .append("text")
        .attr("x", width + 30)
        .attr("y", height/2)
        .attr("dy", ".71em")
        .attr("text-anchor", "start")
        .attr("font-size", "1.1em")
        .text(function(d) { 
            switch (d.key) {
                case "state_pop": return "Population"; 
                case "state_income": return "Income"; 
                case "murder": return "Murder"; 
                case "frost": return "Frost Days"; 
                case "life_exp": return "Life Expectancy"; 
            }
        });

    var tip3 = d3.tip()
      .attr('class', 'd3-tip2')
      .offset([-10, 0])
      .direction('n')
      .html(function(d) {
        return "<span style='font: 11px sans-serif;'><span style='color: " + color(d.state_division) + ";'>" + 
                d.state_division + "</span><br>" + 
                "State: <span style='color: orange;'>" + d.state_abb + "</span><br>" + 
                "Population (000): <span style='color: orange;'>" + formatting(d.state_pop) + "</span><br>" +
                "Income (per capita): <span style='color: orange;'>$" + formatting(d.state_income) + "</span><br>" + 
                "Murder: <span style='color: orange;'>" + d.murder + "</span><br>" + 
                "Frost Days: <span style='color: orange;'>" + d.frost + "</span><br>" + 
                "Life Expectancy: <span style='color: orange;'>" + d.life_exp + "</span>";
      })

      svg.call(tip3);

      function multiple(category) {
          var svg = d3.select(this);
          // console.log(svg)
          name = category.key;
          y.domain([0, d3.max(category.values, function(d) { return d[name]; })]);
          svg.selectAll(".bar")
              .data(function(d) {return d.values;})
              .enter()
              .append("rect")
              .attr("class", "bar")
              .attr("x", function(d) { return x(d.state_abb); })
              .attr("width", x.rangeBand())
              .attr("y", function(d) { return y(d[name]); })
              .attr("height", function(d) { return height - y(d[name]); })
              .attr("opacity", function (d) { return opacity(name); })
              .style("fill", "steelblue")
              // .style("fill", function (d) { return color(d.state_division); })
              .on('mouseover', function (d) {
                  tip2.show(d);
                  fade(d.state_division, .1);
              })
              .on('mouseout', function (d) {
                  tip2.hide(d);
                  fadeOut(d);
              });
        }
} 