var mapWidth = 630,
mapHeight = 300,
focused = false;

var projection = d3.geo.equirectangular()
.scale(100)
.translate([mapWidth / 2, mapHeight / 2])

var path = d3.geo.path()
.projection(projection);

var svgMap = d3.select("svg#map")
.attr("overflow", "hidden")
.attr("width", mapWidth)
.attr("height", mapHeight);

var zoneTooltip = d3.select("section#plots").append("div").attr("class", "zoneTooltip"),
miniTooltip = d3.select("div#multiples").append("div").attr("class", "zoneTooltip"),
infoLabel = d3.select("span#countryName").attr("class", "infoLabel");

var g = svgMap.append("g");

queue()
.defer(d3.json, "world-110m.json")
.defer(d3.tsv, "world-110m-country-names.tsv")
.await(plotEverything);

var results = {}
var region = ""
var otherCountries = {}

function plotEverything(error, world, countryData) {
// http://bl.ocks.org/mbostock/9656675
    var countryById = {},
    countries = topojson.feature(world, world.objects.countries).features;
    // console.log("countries", countries)


    //Adding countries by name
    countryData.forEach(function(d) {
      // console.log("id", d.id, "name", d.name)
      countryById[d.id] = d.name;
    });

    country_data = d3.json("alcohol_consumption.json", function(data) {

        var margin = {top: 30, right: 20, bottom: 20, left: 50},
            width = 630 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;

        var colorfill = d3.scale.category10();

        formatting = d3.format(".2f");

        // DROPDOWN LIST: 
        optionlist = ["All types", "Beer", "Wine", "Spirits", "Other alcoholic beverages"];

        var select = d3.select("#listanchor")
            .append("select")
            .attr("class", "select")
            .on("change",filterStat);

        var options = select
        .selectAll("option")
        .data(optionlist).enter()
        .append("option")
        .text(function (d) { 
            return d;
        });

        var x = d3.time.scale()
        .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        x.domain([2000, 2013]);
        y.domain([0, 15]).nice();

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(d3.format("0000"))
            .ticks(10);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var line = d3.svg.line()
            // only draw the line for years that have entries
            .defined(function(d) { return !isNaN(d.val); })
            .x(function(d) { return x(d.year); })
            .y(function(d) { return y(d.val); });

        var svgLine = d3.select("svg#lines")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("display", "block")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svgLine.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        //Drawing countries on the globe
        var world = g.selectAll("path").data(countries);
        world.enter().append("path")
        .attr("class", "mapData")
        .attr("d", path);

        // zoom and pan
        var zoom = d3.behavior.zoom()
            .scaleExtent([1, 50])
            .on("zoom",function() {
            // the "zoom" event populates d3.event with an object that has
            // a "translate" property (a 2-element Array in the form [x, y])
            // and a numeric "scale" property
                var e = d3.event,
                    // now, constrain the x and y components of the translation by the
                    // dimensions of the viewport
                    tx = Math.min(0, Math.max(e.translate[0], mapWidth - mapWidth * e.scale)),
                    ty = Math.min(0, Math.max(e.translate[1], mapHeight - mapHeight * e.scale));
                // then, update the zoom behavior's internal translation, so that
                // it knows how to properly manipulate it on the next movement
                zoom.translate([tx, ty]);
                // and finally, update the <g> element's transform attribute with the
                // correct translation and scale (in reverse order)
                g.attr("transform", [
                  "translate(" + [tx, ty] + ")",
                  "scale(" + e.scale + ")"
                ].join(" "));
            });

    svgMap.call(zoom);

    //Events processing
    world.on("mouseover", function(d) {
        zoneTooltip.text(countryById[d.id])
        .style("left", (d3.event.pageX + 70) + "px")
        .style("top", (d3.event.pageY - 15) + "px")
        .style("display", "block");
        })
        .on("mouseout", function(d) {
            zoneTooltip.style("display", "none");
        })
        .on("mousemove", function() {
            zoneTooltip.style("left", (d3.event.pageX + 15) + "px")
            .style("top", (d3.event.pageY - 15) + "px");
        })
        .on("click", function(d) {
            // zoom in on the focused country
            var bounds = path.bounds(d),
                  dx = bounds[1][0] - bounds[0][0],
                  dy = bounds[1][1] - bounds[0][1],
                  x = (bounds[0][0] + bounds[1][0]) / 2,
                  y = (bounds[0][1] + bounds[1][1]) / 2,
                  scale = .9 / Math.max(dx / width, dy / height),
                  translate = [width / 2 - scale * x, height / 2 - scale * y];

              svgMap.transition()
                  .duration(1200)
                  .call(zoom.translate(translate).scale(scale).event);

            // remove any lines in the chart
            var svgLine = d3.select("svg#lines").select(".line").transition();
            svgLine
                .duration(750)
                .remove(); // update line

            // svgLine.selectAll(".dot")
            //     .duration(1000)
            //     .remove();

            if (focused === d) return reset();
            g.selectAll(".focused").classed("focused", false);
            d3.select(this).classed("focused", focused = d);
            // update text on info label
            infoLabel.transition().duration(750).style('opacity', 0);
            infoLabel.transition().duration(750).text(function(g) {
                results = data.filter(function(entry) {
                    return entry.name === countryById[d.id];
                })
                // pass the selected country's object to the line draw function
                lineseries(results[0]);
                smallMultiples(results[0]);
                header = d3.select("#rHeader");
                header.transition().duration(750).style('opacity', 0);
                header.transition().delay(750).duration(750)
                    .text("Average Liters per Capita, 2010-2013: " + results[0].region)
                    .style('opacity', 1);
                return "Country: " + countryById[d.id] + " (" + results[0].region + ")";
            })
            .style("opacity",1)
            .style("display", "inline");
        });
    //Adding extra data when focused

    function focus(d) {
      if (focused === d) return reset();
      g.selectAll(".focused").classed("focused", false);
      d3.select(this).classed("focused", focused = d);
    }

    function reset() {
      g.selectAll(".focused").classed("focused", focused = false);

      // reset the results
      results = {};

      infoLabel.style("display", "none");
      zoneTooltip.style("display", "none");
      var svgLine = d3.select(".y.axis").transition() // change the y axis
          .duration(750)
          .style("opacity", 0)
          .remove();

    svgMap.transition()
      .duration(750)
      .call(zoom.translate([0, 0]).scale(1).event);

    var svgLine = d3.select("svg#lines").selectAll(".line").transition();
        svgLine
            .duration(750)
            .style("opacity", 0)
            .remove(); // update line
        svgLine.select(".y.axis")
            .transition() // change the y axis
            .duration(750)
            .remove();

    var svgMinis = d3.select("#multiples").selectAll("svg").transition();
        svgMinis
            .duration(750)
            .style("opacity", 0)
            .remove();
    header = d3.select("#rHeader");
    header.transition().duration(750).style('opacity', 0);
    header.transition()
        .delay(750)
        .duration(750)
        .text("Regional Data ").style('opacity', 1);

        // svgLine.selectAll(".dot")
        //     .duration(100)
        //     .remove();

    }

    function convertData(entryData) {

        // get the category that's selected
        // var linedata = data[cat];
        // console.log("linedata:", entryData);
        var newdata = entryData.map(function(d) {
            return {
                year: +d[0],
                val: +d[1]
            };
        });    
        // console.log("newdata:", newdata);

        return newdata;

    }

    function lineseries(entryData) {
        // http://bl.ocks.org/mbostock/3883195
        // http://www.delimited.io/blog/2014/3/3/creating-multi-series-charts-in-d3-lines-bars-area-and-streamgraphs
        // http://jsfiddle.net/superboggly/XK53c/
        // http://mypage.iu.edu/~jlorince/projects/tagging/tagExplorer.html
        // http://bl.ocks.org/mbostock/3035090

        // get the category that's selected
        cat = d3.select("select").property("value");

        // convert array data types
        var linedata = entryData[cat].map(function(d) {
            return {
                year: +d[0],
                val: +d[1]
            };
        });    

        // console.log("new data! ", linedata);
        y.domain([d3.min(linedata, function(d) { return d.val; })*.9, 
                  d3.max(linedata, function(d) { return d.val; })*1.1]).nice();

        svgLine.select(".y.axis").transition()
            .duration(750)
            .remove();

        svgLine.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("x", 10)
            .attr("y", -52)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .attr("transform", "translate(5,10), rotate(-90)")
            .text("Liters Consumed per Capita");

        svgLine.append("path")
            .datum(linedata)
            .attr("class", "line")
            .attr("d", line);

        console.log("line added:", linedata)

        // add dots
        // svgLine.selectAll(".dot")
        //     .data(newdata.filter(function(d) { return +d.val; }))
        //   .enter().append("circle")
        //     .attr("class", "dot")
        //     .attr("cx", line.x())
        //     .attr("cy", line.y())
        //     .attr("r", 3.5);


      }


    function filterStat() {
        cat = d3.select("select").property("value");

        // get data for the new category
        filterData = results[0][cat];
        console.log("filterData:", filterData);

        // convert array data types
        var linedata = filterData.map(function(d) {
            return {
                year: +d[0],
                val: +d[1]
            };
        });    

// ************   UPDATE LINE   *************
        // update line domain
        y.domain([d3.min(linedata, function(d) { return d.val; })*.9, 
                  d3.max(linedata, function(d) { return d.val; })*1.1]).nice();

        // update line
        var newline = d3.select("svg#lines").transition();
        newline.select(".line")
            .duration(750)
            .attr("d", line(linedata));

        newline.select(".y.axis") // change the y axis
            .duration(750)
            .call(yAxis);

// ********* UPDATE SMALL MULTIPLES ********* 
        var margin2 = {top: 20, right: 10, bottom: 20, left: 10},
            width2 = 31 - margin2.right - margin2.left,
            height2 = 110 - margin2.top - margin2.bottom;

        filtered = otherCountries.map(function(d) {
            if (typeof d[cat] != 'undefined') {
                return {
                    name: d.name,
                    code: d.code,
                    avg: d3.sum(d[cat], function(f){ return +f[1];}) / d[cat].length
                }
          }
        });

        // reset domains for the multiples
        miniDomain = d3.extent(filtered, function(d) { return d.avg; });
        miniScale = d3.scale.linear()
            .domain(miniDomain).range([height2+5, 0]);

        // select each svg
        filtered.forEach(function(d) {
            circles = d3.select("svg#"+d.code)   // select the svg with the same country name
            .datum(d)
            .selectAll(".circles")
            .datum(d)
            .append("circle")
            .attr("cx", width2+3)
            .attr("cy", function(d) { return miniScale(d.avg) + margin2.top; })
            .attr("r", 5)
            .style("fill", "orangered"); 

            // y.exit().remove();
                   circles
            // .duration(750)
            .append("circle")
            .attr("cx", width2+3)
            .attr("cy", function(d) { return miniScale(d.avg) + margin2.top; })
            .attr("r", 5)
            .style("fill", "orangered");

        })
    }


    function smallMultiples(country) {

        var colors = d3.scale.category10();

        var margin2 = {top: 20, right: 10, bottom: 20, left: 10},
            width2 = 31 - margin2.right - margin2.left,
            height2 = 110 - margin2.top - margin2.bottom;
        // lines will be 90 tall, 4 wide

        // identify the region the country is in
        region = country["region"];

        console.log("got region: ", region, cat)
        console.log("results region: ", results[0].region)
        // get all countries that are from the same region
        otherCountries = data.filter(function(entry) {
                return entry["region"] === region;
        });

        console.log("other countries!", otherCountries)
        // get the current category
        cat = d3.select("select").property("value");

        // retrieve category data from each country
        filtered = otherCountries.map(function(d) {
          // console.log(d.name, d.code, cat, ": ", d[cat])
            if (typeof d[cat] != 'undefined') {
                return {
                    name: d.name,
                    code: d.code,
                    avg: d3.sum(d[cat], function(f){ return +f[1];}) / d[cat].length
                }
          }
        });
        // console.log("filtered:", filtered)

        miniDomain = d3.extent(filtered, function(d) { return d.avg; });
        miniScale = d3.scale.linear()
            .domain(miniDomain).range([height2+5, 0]);

        // var svgMinis = d3.select("div#multiples").selectAll("svg").transition();
        //     svgMinis
        //     .duration(750)
        //     .style("opacity", 0)
        //     .remove();

        // add svgs for each country that meets the criteria
        var svgMinis = d3.select("div#multiples").selectAll("svg")
            .data(filtered)
            .enter()
            .append("svg")
            .attr("class", "smalls")
            .attr("id", function(d) { return d.code; })
            // .attr("style", "outline: thin solid red;")  
            .attr("width", width2 + margin2.left + margin2.right)
            .attr("height", height2 + margin2.top + margin2.bottom)
            .style("opacity", 0)
            .on("mouseover", function(d) {
                miniTooltip.text(d.name + ": " + formatting(d.avg))
                .style("left", (d3.event.pageX + 70) + "px")
                .style("top", (d3.event.pageY - 15) + "px")
                .style("display", "block");
            })
            .on("mouseout", function(d) {
                miniTooltip.style("display", "none");
            })
            .on("mousemove", function() {
                miniTooltip.style("left", (d3.event.pageX + 15) + "px")
                .style("top", (d3.event.pageY - 15) + "px");
            });

        lines2 = svgMinis.append("g")
            .attr("class", "lines");

        lines2.append("rect")
            .attr("x", width2+1.5)
            .attr("y", margin2.top)
            .attr("width", 3)
            .attr("height", 85)
            .style("fill", colors(0));

        // miniDomain = d3.extent(filtered, function(d) { return d.avg; });
        // miniScale = d3.scale.linear()
        //     .domain(miniDomain).range([height2+5, 0]);

        dots = svgMinis.append("g")
            .attr("class", "circles");

        dots.append("circle")
            .attr("cx", width2+3)
            .attr("cy", function(d) { return miniScale(d.avg) + margin2.top; })
            .attr("r", 5)
            .style("fill", "orangered");

        svgMinis.append("text")
            .attr("class", "countryName")
            .attr("text-anchor", "middle")
            .attr("x", (margin2.left+width2+margin2.right)/2)
            .attr("y", 15)
            .text(function(d) { return d.code; });

        var svgMinis = d3.select("div#multiples").selectAll("svg").transition()
            .delay(800)
            .duration(750)
        .style("opacity", 1);

    }

  });
}
