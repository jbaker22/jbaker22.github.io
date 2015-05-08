var mapWidth = 650,
mapHeight = 450,
focused = false,
sens = 0.25;

var projection = d3.geo.equirectangular()
.scale(150)
.translate([mapWidth / 2, mapHeight / 2])

var path = d3.geo.path()
.projection(projection);

var svgMap = d3.select("div#map").append("svg")
.attr("overflow", "hidden")
.attr("width", mapWidth)
.attr("height", mapHeight);

var zoneTooltip = d3.select("div#map").append("div").attr("class", "zoneTooltip"),
infoLabel = d3.select("div#map").append("div").attr("class", "infoLabel");

var g = svgMap.append("g");

queue()
.defer(d3.json, "world-110m.json")
.defer(d3.tsv, "world-110m-country-names.tsv")
.await(ready);


function ready(error, world, countryData) {

  var countryById = {},
  countries = topojson.feature(world, world.objects.countries).features;

  //Adding countries by name

  countryData.forEach(function(d) {
    countryById[d.id] = d.name;
  });

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
              tx = Math.min(0, Math.max(e.translate[0], width - width * e.scale)),
              ty = Math.min(0, Math.max(e.translate[1], height - height * e.scale));
          // then, update the zoom behavior's internal translation, so that
          // it knows how to properly manipulate it on the next movement
          zoom.translate([tx, ty]);
          // and finally, update the <g> element's transform attribute with the
          // correct translation and scale (in reverse order)
          g.attr("transform", [
            "translate(" + [tx, ty] + ")",
            "scale(" + e.scale + ")"
          ].join(" "));

        // g.attr("transform","translate("+ 
        //     d3.event.translate.join(",")+")scale("+d3.event.scale+")");
        // // g.selectAll("circle")
        // //     .attr("d", path.projection(projection));
        // g.selectAll("path")  
        //     .attr("d", path.projection(projection)); 

  });

  svgMap.call(zoom);

  //Events processing

  world.on("mouseover", function(d) {
    // if (ortho === true) {
    //   infoLabel.text(countryById[d.id])
    //   .style("display", "inline");
    // } else {
      zoneTooltip.text(countryById[d.id])
      .style("left", (d3.event.pageX + 7) + "px")
      .style("top", (d3.event.pageY - 15) + "px")
      .style("display", "block");
    // }
  })
  .on("mouseout", function(d) {
      zoneTooltip.style("display", "none");
  })
  .on("mousemove", function() {
      zoneTooltip.style("left", (d3.event.pageX + 7) + "px")
      .style("top", (d3.event.pageY - 15) + "px");
  })
  .on("click", function(d) {
    if (focused === d) return reset();
    g.selectAll(".focused").classed("focused", false);
    d3.select(this).classed("focused", focused = d);
    infoLabel.text(countryById[d.id])
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
    infoLabel.style("display", "none");
    zoneTooltip.style("display", "none");

  }
};
