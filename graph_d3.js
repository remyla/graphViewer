(function (root, factory) {
        if (typeof define === 'function' && define.amd) {
                // AMD. Register as an anonymous module.
                define(['graph-common', 'd3'], factory);
        } else {
                // Browser globals
                root.damasGraph = factory(root.damasGraph, root.d3);
        }
}(this, function (damasGraph, d3) {


	damasGraph.init = function ( htmlelem )
	{
		this.svg = this.init_SVG2();
		//svg = this.svg;

		var width = window.innerWidth;
		var height = window.innerHeight;

		this.force = d3.layout.force()
			.charge(-200)
			.linkDistance(30)
			.size([width, height]);
	}

	damasGraph.init_SVG2 = function ( htmlelem )
	{
		var color = d3.scale.category20();

		var width = window.innerWidth;
		var height = window.innerHeight;

		svg = d3.select("#graph")
			.append("svg:svg")
				.attr("id", "svggraph")
//				.attr('width', width)
//				.attr('height', height)
				.attr("viewBox", "0 0 " + width + " " + height )
				.attr("preserveAspectRatio", "xMidYMid meet")
				.attr("pointer-events", "all");
//				.on("mousedown", mousedown);

		defs = svg.append('svg:defs');

		var background = svg.append('svg:rect')
				.attr("id", "backG")
//				.attr('width', width)
//				.attr('height', height)
				.attr('fill', 'gray')
				.attr("pointer-events", "all")
				.call(d3.behavior.zoom().on("zoom", rescale));

		var gBox= svg.append('svg:g')
				.attr("pointer-events", "all");

		function rescale() {
			trans=d3.event.translate;
			scale=d3.event.scale;
			gBox.attr("transform",
			"translate(" + trans + ")"
			+ " scale(" + scale + ")");
		}

		this.g2 = gBox.append('svg:g');
		this.g1 = gBox.append('svg:g');

			
	}

	damasGraph.load = function ( path )
	{
		d3.json( path, function(error, json) {

			// make links reference nodes directly for the JSON format:
			var hash_lookup = [];
			// make it so we can lookup nodes in O(1):
			json.nodes.forEach(function(d, i) {
			  hash_lookup[d.id] = d;
			});
			json.links.forEach(function(d, i) {
			  d.source = hash_lookup[d.src_id];
			  d.target = hash_lookup[d.tgt_id];
			});

			var dataNodes = damasGraph.force.nodes(json.nodes);
			var	dataLinks = damasGraph.force.links(json.links);
			damasGraph.force.start();

			var svgLinks = damasGraph.g2.selectAll(".link")
				.data(json.links)
				.enter().append("svg:line")
				.attr("class", "link")
				.style("stroke-width", function(d) { return Math.sqrt(d.value); })
				.style("marker-end",  "url(#arrow)");

			var arrow = defs.selectAll("marker")
				.data(json.links)
				.enter().append("svg:marker")
				.attr("id", "arrow")
				.attr("viewBox", "0 -5 10 10")
				.attr("refX", 25)
				.attr("refY", 0)
				.attr("markerWidth", 6)
				.attr("markerHeight", 6)
				.attr("orient", "auto")
				.append("svg:path")
				.attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
				.style("stroke", "#4679BD")
				.style("opacity", "0.6");



			var svgNodes = damasGraph.g1.selectAll(".node")
				.data(json.nodes)
				.enter().append("a")
				.attr('xlink:href', function(d) { return '#'+d.id })
				.call(damasGraph.force.drag);

			var circBG = svgNodes.append("circle")
					.attr("r", 10)
					.attr("class", "nodeBG");

			var circ = svgNodes.append("circle")
					.attr("r", 10)
					.attr("fill", function(d) { return "url(#thumb"+d.id+")"; })
//					.attr("fill", function(d) { return d.keys.image })
					.attr("class", "node");
//					.on("click", function(d) { return d.keys.image });

			circ.on("click", function(d) {
				if (d3.event.defaultPrevented) return; // click suppressed
				assetOverlay(d);
			});
			
			var patImage = defs.selectAll(".node")
				.data(json.nodes)
				.enter().append('svg:pattern')
				.attr('patternContentUnits', 'objectBoundingBox')
				.attr('id', function(d) { return "thumb"+d.id; })
				.attr('x', '0')
				.attr('y', '0')
				.attr('width', 1)
				.attr('height', 1);

			patImage.append('image')
				.attr('xlink:href', function(d) { return d.keys.image })
				.attr('x', '0')
				.attr('y', '0')
				.attr('width', 1)
				.attr('height', 1)
				.attr('preserveAspectRatio', 'xMidYMid slice');
			
			var open = svgNodes.append("circle")
				.attr('r', 3)
				.style("stroke", "white")
				.style("stroke-width", 0.5)
				.attr('fill', 'white');
			
			var openPlus = svgNodes.append("svg:image")
				.attr('xlink:href', 'scripts/graphViewer/icons/plus25.svg')
				.attr('width', 4)
				.attr('height', 4)
				.on('click', function (d) { alert( d.id)});

			svgNodes.append("title")
				.text(function(d) { return d.type; });
		
			svgNodes.append("svg:text")
				.attr("dx", 12)
				.attr("dy", ".35em")
				.text(function(d) { return d.keys.file.split('/').pop() });
//				.text(function(d) { return d.id });
//				.style("stroke", "white");

			damasGraph.force.on("tick", function() {
				svgLinks.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

				circ.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });

				circBG.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });
				
				open.attr("cx", function(d) { return (d.x) + 7; })
				.attr("cy", function(d) { return (d.y) + 7; })
				
				openPlus.attr("x", function(d) { return (d.x) + 5; })
				.attr("y", function(d) { return (d.y) + 5; });
				
				d3.selectAll("text").attr("x", function (d) {
					return d.x;
				})
					.attr("y", function (d) {
					return d.y;
				});
			});
		
//			circ.addEventListener( 'click', function(e){
//				if(window['assetOverlay']){
//					assetOverlay(this.json);
//				}
//			});
		
		
		
//			svgNodes.on('click', function(e){
//				if(window['assetOverlay']){
//					var node = d3.select(this)
//						.data(function(d) { return d.type; });
////						.data(json);
//					alert(node);
////					assetOverlay(node);
//				}
//			});

		
//				circ.on('click', function(d){
//					d3.select(this)
//						.classed('selected',true)
//						.transition()
//						.attr('r',20);
//					
//				});

//			node.on('click', function(d){
//				d3.select(this)
//						.splice(1, 1); // remove b
//					link.shift(); // remove a-b
//					link.pop(); // remove b-c
//					start();
//					d3.select(this)
//						.remove();
//			});

		});
	}

	return damasGraph;
}));
