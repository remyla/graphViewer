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
		this.svg = this.init_SVG();

		var width = window.innerWidth;
		var height = window.innerHeight;
		htmlelem.appendChild(this.svg);

		svg = d3.select("#svggraph")
			.attr("viewBox", "0 0 " + width + " " + height )
			.attr("preserveAspectRatio", "xMidYMid meet")
			.attr("pointer-events", "all")
			.call(d3.behavior.zoom().on("zoom", rescale));

		this.defs = d3.select("defs");
		var gBox = d3.select(this.gBox).attr("pointer-events", "all");

		function rescale() {
			trans=d3.event.translate;
			scale=d3.event.scale;
			gBox.attr("transform",
			"translate(" + trans + ")"
			+ " scale(" + scale + ")");
		}

		this.force = d3.layout.force()
			.charge(-200)
			.linkDistance(30)
			.size([width, height])
			.nodes([])
			.links([]);

		this.d3_nodes = [];
		this.d3_links = [];


		this.drag = function()
		{	d3.behavior.drag()
			return this.force.drag()
			.on("dragstart", dragstarted)
			.on("drag", dragged)
			.on("dragend", dragended);
		}

		function dragstarted(d) {
			d3.event.sourceEvent.stopPropagation();
			d3.select(this).classed("dragging", true);
			//graph.force.start();
		}

		function dragged(d) {
			d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
		}

		function dragended(d) {
			d3.select(this).classed("dragging", false);
		}

//		this.svgNodes = this.g1.selectAll('g');
//		this.svgLinks = this.g2.selectAll('path');
		this.svgNodes = d3.select(this.g2).selectAll('g');
		this.svgLinks = d3.select(this.g1).selectAll('path');
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
			this.d3_nodes.push(JSON.parse(JSON.stringify(node)));
			this.restart();
			return true;
		}
		return false;
	}

	damasGraph.prototype.newEdge = function ( link )
	{
		function search_node(id){
			for( var i=0; i< graph.d3_nodes.length; i++){
				if (graph.d3_nodes[i]._id === id)
					return graph.d3_nodes[i];
			}
		}
		if (this._newEdge(link))
		{
			this.d3_links.push({
				_id: link._id,
				source: search_node(link.src_id),
				target: search_node(link.tgt_id)
			});
			this.restart();
			return true;
		}
		return false;
	}

	damasGraph.prototype.getShape = function( node )
	{
		var _id = node._id;
		var type, shape;
		(node.src_id && node.tgt_id) ? type = this.d3_links : type = this.d3_nodes;
		for(var x = 0; x < type.length; x++)
		{
			if(type[x]._id == _id)
				shape = type[x].shape;
		}
		return shape;
	}

	/**
	 * Main method which calls other methods for get links and nodes related to a node given.
	 * This method first get a list of links and nodes related to node given. 
	 * Then  these links and nodes are highlighted in orange.
	 * Finally is applied the opacity to elements which aren't included in the firs list.
	 * @param {Object} node - Array object (node to search his connections)
	 */
	damasGraph.prototype.showConnections = function( node ){ 
		//Get a list of links & nodes related and highlight in orange 
		var data = this._getNeighborsR(node);
		
		if(data){
			//Highlight in orange links and nodes
			this._highlightConnections(data);

			//Get nodes and links not related to main node
			var targetsRemaining = this._getTargetsRemaining(data);

			//Aply opacity to Links
			var l = targetsRemaining.unrelated_links.map(function(l){ 
			var shape = graph.getShape(graph.node_lut[l]);
				graph._toggleOpacity(shape);
			});

			//Aply opacity to Nodes
			var n = targetsRemaining.unrelated_nodes.map(function(n){ 
				var shape = graph.getShape(graph.node_lut[n])
				shape = shape.parentNode; //Needed to apply the opacity also the extension file.
				graph._toggleOpacity(shape);
			});

			//Aply opacity to Labels
			var labels = this.svgLabels[0];
			for (var i = 0; i < labels.length; i++)
			{
				if(data.related_nodes.indexOf(this.node_lut[this.nodes[i]._id]._id) == -1)
					this._toggleOpacity(labels[i]);
			}

			return true;
		}
	}

	damasGraph.prototype.unhighlightElements = function ( )
	{
		//Unhighlight elements commons (links)
		this.unhighlightLinks();

		var nodes = this.nodes;
		var labels = this.svgLabels[0];

		//Remove orange and opacity to nodes
		for(var x = 0; x < nodes.length; x++){

			var node = this.node_lut[nodes[x]._id];
			var shape = this.getShape(this.node_lut[nodes[x]._id]);
			shape = shape.parentNode;
			if(this.getShape(node).classList.contains("select_orange"))
				this._highlightSelectedOrange(node);

			if(shape.classList.contains("withOpacity"))
				this._toggleOpacity(shape);
		}
		
		//Remove opacity to Labels
		for (var i = 0; i < labels.length; i++)
		{
			var label = labels[i];

			if(label.classList.contains("withOpacity"))
				this._toggleOpacity(label);
			
		}
	}

	damasGraph.prototype.removeNode = function( node ){ 
		var shape = this.getShape(node);
		var remove , pos;
		
		if(node.src_id && node.tgt_id)
		{
			remove = this.d3_links;
			pos = search(remove);
			remove.splice(pos, 1);
		}
		else
		{
			remove = this.d3_nodes ;
			pos = search(remove);
			remove.splice(pos, 1);
			spliceLinksForNode(node);
		}
		
		this._removeNode(node);
		
		this.restart();
		return true;

		function search(remove){
			for(var x= 0; x < remove.length; x++)
			{
				if(remove[x]._id == node._id){
					return x;
				}
			}
		}
		
		function spliceLinksForNode(node) {
			var links = graph.links;
			var toSplice = graph.d3_links.filter(function(l) { 
				return (l.source._id === node._id || l.target._id === node._id);
			});
			toSplice.map(function(l) {
				graph.d3_links.splice(graph.d3_links.indexOf(l), 1);
				graph.links.splice(graph.links.indexOf(l), 1) 
			});
		}
	}

	damasGraph.prototype.restart = function ()
	{
		this.force.nodes(this.d3_nodes);
		this.force.links(this.d3_links);

		// add data links
		this.svgLinks = this.svgLinks.data(this.d3_links);

		// update existing links
		this.svgLinks.classed('selected' , function(d){ d.shape = this; return false; });

		// add new links
		var path = this.svgLinks.enter().append("svg:path")
			.attr("class", function(d){ d.shape = this; return "link" })
//			.style("marker-end",  "url(#arrowD)")
			.attr("style", function(d){ return d.style;})
			.on("click", function(d, l) {
				if (d3.event.defaultPrevented) return; // click suppressed
				if(window['node_pressed']){
					node_pressed.call(graph.node_lut[d._id], d3.event);
				}
			})
			.on("mouseover", function(d) {
				path.style("marker-end",  "url(#arrowO)")
			})
			.on("mouseout", function(d) {
				path.style("marker-end",  "url(#arrowD)")
			});

		//for delete elements in the DOM if they are more elements DOM than number links-data
		this.svgLinks.exit().remove(); 

		// add new nodes
		this.svgNodes = this.svgNodes.data( this.d3_nodes, function(d){
			return d._id;
		});
		
		var g = this.svgNodes.enter().append('svg:g').call(graph.force.drag()
				.on("dragstart", function(d){ d3.event.sourceEvent.stopPropagation(); })
				.on("drag", function(d) { graph.drag(); }));
		
		var tools = g.append('svg:g')
			.attr("class", "tools")
			.style('display', 'none');
		
		var openCircle = tools.append("circle")
			.attr('r', 3)
			.attr('cx', '-8.5')
			.attr('cy', '8.5')
			.style("stroke", "white")
			.style("stroke-width", 0.5)
			.attr('fill', 'white');

		var shareCircle = tools.append("circle")
			.attr('r', 3)
			.attr('cx', '-12')
			.attr('cy', '0')
			.style("stroke", "white")
			.style("stroke-width", 0.5)
			.attr('fill', 'white');

		var deleteCircle = tools.append("circle")
			.attr('r', 3)
			.attr('cx', '-8.5')
			.attr('cy', '-8.5')
			.style("stroke", "white")
			.style("stroke-width", 0.5)
			.attr('fill', 'white');

		var openPlus = tools.append("svg:image")
			.attr('xlink:href', 'scripts/graphViewer/icons/plus25.svg')
			.attr("class", "openPlus")
			.attr('x', '-10.25')
			.attr('y', '7')
			.attr('width', 3.5)
			.attr('height', 3.5);
		
		g.append("circle")
			.attr("r", 10)
			.attr("class", function(d){ d.shape = this; return "nodeBG"})
			.attr("style", function(d){ return d.style;});
		
		g.append('svg:circle')
			.attr("id", function(d) { return "thumb"+d._id; })
			.attr("r", 10)
			.style("fill", function(d) {
				return "url(#thumbPat"+d._id+")";
			})
			.attr("class", "node");
//		g.append('svg:image')
//			.attr('id', function(d) { return "thumb"+d.id; })
//			.attr('xlink:href', function(d) {return  thumbnail(d);})
//			.attr('x', '0')
//			.attr('y', '0');
		this.svgLabels = d3.select(this.g3).selectAll('text');
		this.svgLabels = this.svgLabels.data( this.d3_nodes, function(d){
			return d._id;
		});
		this.svgLabels.enter().append('svg:text')
			.attr("class", "label")
			.attr("dx", 12)
			.attr("dy", ".35em")
			.text(function(d) {
				return (d.file)? d.file.split('/').pop() : d._id;
			});

		//for delete elements in the DOM if they are more elements DOM than number svgLabels-data
		this.svgLabels.exit().remove(); 
		
		g.append(function(d){
			return graph.nodeText(d);
		});

		g.append("a")
			.attr('xlink:href', function(d) {
				return '#'+d._id;
			});

		g.on("click", function(d) {
			if (d3.event.defaultPrevented) return; // click suppressed
			//assetOverlay(d);
			if(window['node_pressed']){
				node_pressed.call(graph.node_lut[d._id], d3.event);
			}
		});
		
		var patImage = this.defs.selectAll("pattern")
			.data(this.nodes)
			.enter().append('svg:pattern')
			.attr('patternContentUnits', 'objectBoundingBox')
			.attr('id', function(d) {
				return "thumbPat"+d._id;
			})
			.attr('x', '0')
			.attr('y', '0')
			.attr('width', 1)
			.attr('height', 1);

		var image = patImage.append('image')
			.attr('id','thumbnail')
			.attr('xlink:href', function(d) {
				return d.image;
			})
			.attr('x', '0')
			.attr('y', '0')
			.attr('width', 1)
			.attr('height', 1);
//			.attr('preserveAspectRatio', 'xMidYMid slice');
		
//		image.attr('xlink:href', function(d) {
//				return  thumbnail(d);
//			});
		
		

		g.on("mouseenter", function(d) {
			graph.showConnections(graph.node_lut[d._id]);
//			tools.style({opacity:'1.0'});
			tools.style({display:'block'});
		});
		g.on("mouseleave", function(d) {
			graph.unhighlightElements();
//			tools.style({opacity:'0.0'});
			tools.style({display:'none'});
		});
		
		

		//for delete elements in the DOM if they are more elements DOM than number nodes-data
		this.svgNodes.exit().remove(); 

		this.force.start();
	}
	damasGraph.prototype.tick = function ( )
	{
		graph.svgLinks.attr('d', function(d) {
		    var deltaX = d.target.x - d.source.x,
		        deltaY = d.target.y - d.source.y,
		        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
		        normX = deltaX / dist,
		        normY = deltaY / dist,
		        sourcePadding = d.left ? 17 : 10.5,
		        targetPadding = d.right ? 17 : 12,
		        sourceX = d.source.x + (sourcePadding * normX),
		        sourceY = d.source.y + (sourcePadding * normY),
		        targetX = d.target.x - (targetPadding * normX),
		        targetY = d.target.y - (targetPadding * normY);
		    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
		});
		graph.svgNodes.attr('transform', function(d) {
			return 'translate(' + d.x + ',' + d.y + ')';
		});
		graph.svgLabels.attr('transform', function(d) {
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
