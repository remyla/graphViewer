(function (root, factory) {
        if (typeof define === 'function' && define.amd) {
                // AMD. Register as an anonymous module.
                define(['graph-common', 'd3'], factory);
        } else {
                // Browser globals
                root.damasGraph = factory(root.damasGraph, root.d3);
        }
}(this, function (damasGraph, d3) {

	damasGraph.node_lut = {};

	damasGraph.init = function ( htmlelem )
	{
		this.svg = this.init_SVG2();
		this.nodes = [];
		this.links = [];
		var width = window.innerWidth;
		var height = window.innerHeight;
		this.force = d3.layout.force()
			.charge(-200)
			.linkDistance(30)
			.size([width, height])
			.nodes(this.nodes)
			.links(this.links);

		this.svgNodes = this.g1.selectAll('g');
		this.svgLinks = this.g2.selectAll('line');
		this.force.on("tick", damasGraph.tick);
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
				.attr("pointer-events", "all")
				.call(d3.behavior.zoom().on("zoom", rescale));
//				.on("mousedown", mousedown);

		this.defs = svg.append('svg:defs');

/*
		var background = svg.append('svg:rect')
				.attr("id", "backG")
//				.attr('width', width)
//				.attr('height', height)
				.attr('fill', 'gray')
				.attr("pointer-events", "all")
				.call(d3.behavior.zoom().on("zoom", rescale));
*/

		var gBox= svg.append('svg:g')
				.attr("pointer-events", "all");

		function rescale() {
			trans=d3.event.translate;
			scale=d3.event.scale;
			gBox.attr("transform",
			"translate(" + trans + ")"
			+ " scale(" + scale + ")");
		}

		this.g1 = gBox.append('svg:g');
		this.g2 = gBox.append('svg:g');
		return svg[0][0];
	}

	damasGraph.newNode = function ( node )
	{
		if (this.node_lut[node.id]) return false;
		this.nodes.push( node );
		this.node_lut[node.id] = node;
		this.restart();
		return true;
	}

	damasGraph.newEdge = function ( link )
	{
		for( l in this.force.links )
		{
			if (l.id === link.link_id) return false;
		}
		//if (this.force.links[node.id]) return false;
		this.links.push({
			id: link.link_id,
			source: this.node_lut[link.src_id],
			target: this.node_lut[link.tgt_id]
		});
		this.restart();
		return true;
	}

	damasGraph.restart = function ()
	{
		this.force.links(this.links);
		this.force.nodes(this.nodes);
		// add new nodes
		this.svgNodes = this.svgNodes.data( this.nodes, function(d){ return d.id });
		var g = this.svgNodes.enter().append('svg:g');
		g.append("circle")
			.attr("r", 10)
			.attr("class", "nodeBG");
		g.append('svg:circle')
			.attr("r", 10)
			.attr("fill", function(d) { return "url(#thumb"+d.id+")"; })
			.attr("class", "node");
		g.append('svg:text')
			.attr("dx", 12)
			.attr("dy", ".35em")
			.text(function(d) { if(d.keys.file) return d.keys.file.split('/').pop() });
//				.text(function(d) { return d.id });
//				.style("stroke", "white");
		g.append("a")
			.attr('xlink:href', function(d) { return '#'+d.id })
		g.on("click", function(d) {
			if (d3.event.defaultPrevented) return; // click suppressed
			assetOverlay(d);
		});

		var patImage = this.defs.selectAll(".node")
			.data(this.nodes)
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

/*
		var open = damasGraph.svgNodes.append("circle")
			.attr('r', 3)
			.style("stroke", "white")
			.style("stroke-width", 0.5)
			.attr('fill', 'white');

		var openPlus = damasGraph.svgNodes.append("svg:image")
			.attr('xlink:href', 'scripts/graphViewer/icons/plus25.svg')
			.attr('width', 4)
			.attr('height', 4)
			.on('click', function (d) { alert( d.id)});
*/

		//damasGraph.svgNodes.append("title")
			//.text(function(d) { return d.type; });

		g.call(this.force.drag);

		// add new links
		console.log(this.links);
		this.svgLinks = this.svgLinks.data(this.links);
			this.svgLinks.enter().append("svg:line")
			.attr("class", "link")
			//.style("stroke-width", function(d) { return Math.sqrt(d.value); })
			.style("stroke-width", '1');
			//.style("marker-end",  "url(#arrow)");

/*
		var arrow = this.defs.selectAll("marker")
			.data(this.links)
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
*/

		this.force.start();
	}
	damasGraph.tick = function ( )
	{
		damasGraph.svgLinks.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		damasGraph.svgNodes.attr('transform', function(d) {
			return 'translate(' + d.x + ',' + d.y + ')';
		});
/*
		circ.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });

		circBG.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
			
		open.attr("cx", function(d) { return (d.x) + 7; })
			.attr("cy", function(d) { return (d.y) + 7; })
			
		openPlus.attr("x", function(d) { return (d.x) + 5; })
			.attr("y", function(d) { return (d.y) + 5; });
			
		d3.selectAll("text").attr("x", function (d) { return d.x; })
			.attr("y", function (d) { return d.y; });
*/
	}

	damasGraph.load2 = function ( path )
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
			damasGraph.nodes = damasGraph.force.nodes();
			//damasGraph.force
			var dataLinks = damasGraph.force.links(json.links);
			damasGraph.links = damasGraph.force.links();

			//damasGraph.force.start();

/*
			this.svgLinks = damasGraph.g2.selectAll(".link")
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


			damasGraph.svgNodes = damasGraph.g1.selectAll(".node")
				.data(json.nodes)
				.enter().append("a")
				.attr('xlink:href', function(d) { return '#'+d.id })
				.call(damasGraph.force.drag);


*/
			damasGraph.force.start();
			damasGraph.restart();

//			circ.addEventListener( 'click', function(e){
//				if(window['assetOverlay']){
//					assetOverlay(this.json);
//				}
//			});
		
		
		
//			damasGraph.svgNodes.on('click', function(e){
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
