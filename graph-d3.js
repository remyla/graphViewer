(function (root, factory) {
        if (typeof define === 'function' && define.amd) {
                // AMD. Register as an anonymous module.
                define(['graph-common', 'd3'], factory);
        } else {
                // Browser globals
                root.damasGraph = factory(root.damasGraph, root.d3);
        }
}(this, function (damasGraph, d3) {

	//damasGraph.prototype.node_lut = {};

	damasGraph.prototype.init = function ( htmlelem )
	{
		this.svg = this.init_SVG2();

		var width = window.innerWidth;
		var height = window.innerHeight;
		this.force = d3.layout.force()
			.charge(-200)
			.linkDistance(30)
			.size([width, height])
			.nodes([])
			.links([]);
		this.nodes = [];
		this.links = [];
		this.svgNodes = this.g1.selectAll('g');
		this.svgLinks = this.g2.selectAll('line');
		this.force.on("tick", this.tick);


		this.refreshDebugFrame(htmlelem);
	}

	damasGraph.prototype.init_SVG2 = function ( htmlelem )
	{
		var color = d3.scale.category20();

		var width = window.innerWidth;
		var height = window.innerHeight;

		svg = d3.select("#graph")
			.append("svg:svg")
				.attr("id", "svggraph")
				.attr("viewBox", "0 0 " + width + " " + height )
				.attr("preserveAspectRatio", "xMidYMid meet")
				.attr("pointer-events", "all")
				.call(d3.behavior.zoom().on("zoom", rescale));
//				.on("mousedown", mousedown);

		this.defs = svg.append('svg:defs');

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

	damasGraph.prototype.newNode = function ( node )
	{
		if( this._newNode(node) )
		{
			this.restart();
			return true;
		}
		return false;
	}

	damasGraph.prototype.newEdge = function ( link )
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
		this.refreshDebugFrame();
		return true;
	}

	damasGraph.prototype.restart = function ()
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
			.text(function(d) { if(d.file) return d.file.split('/').pop() });
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
			.attr('xlink:href', function(d) { return d.image })
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
	damasGraph.prototype.tick = function ( )
	{
		graph.svgLinks.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		graph.svgNodes.attr('transform', function(d) {
			return 'translate(' + d.x + ',' + d.y + ')';
		});
/*
		circ.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });

		openPlus.attr("x", function(d) { return (d.x) + 5; })
			.attr("y", function(d) { return (d.y) + 5; });
			
		d3.selectAll("text").attr("x", function (d) { return d.x; })
			.attr("y", function (d) { return d.y; });
*/
	}
	return damasGraph;
}));
