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
		var sel = []; //Temp array for rectangle selection
		htmlelem.appendChild(this.svg);

		svg = d3.select("#svggraph")
			.attr("viewBox", "0 0 " + width + " " + height )
			.attr("preserveAspectRatio", "xMidYMid meet")
			.attr("pointer-events", "all")
			.on("mousedown", function(d){
				if(! d3.event.shiftKey)
					return;
				graph.dragging = true;
				//Stop zoom in selection
				svg.call(graph.zoomm.on("zoom", null));

				//Mouse position in gBox
				var p = d3.mouse(graph.gBox);
				p[0] = parseInt( p[0] , 10);
				p[1] = parseInt( p[1] , 10);

				//Rectangle for selection
				d3.select(graph.gBox).append( "rect")
				.attr({
					rx: 6,
					ry: 6,
					class: "rect_selection",
					x: p[0],
					y: p[1],
					width: 0,
					height: 0
				})
			})
			.on( "mousemove", function() {
				if(!graph.dragging)
					return;
				svg.call(d3.behavior.zoom());
				var s = svg.select("rect.rect_selection");

				if( !s.empty()) {
					var p =  d3.mouse(graph.gBox);
					p[0] = parseInt( p[0] , 10);
					p[1] = parseInt( p[1] , 10);
					var d = {
							x: parseInt( s.attr( "x"), 10),
							y: parseInt( s.attr( "y"), 10),
							width: parseInt( s.attr( "width"), 10),
							height: parseInt( s.attr( "height"), 10)
						},
					move = {
						x : p[0] - d.x,
						y : p[1] - d.y
					}
					;

					if( move.x < 1 || (move.x*2<d.width)) {
						d.x = p[0];
						d.width -= move.x;
					} else {
						d.width = move.x;
					}

					if( move.y < 1 || (move.y*2<d.height)) {
						d.y = p[1];
						d.height -= move.y;
					} else {
						d.height = move.y;
					}

					s.attr( d);

				
					var nodes = graph.d3_nodes;
				
					nodes.map(function(data, i){

						var radius = data.shape.r.animVal.value;

						if( (sel.indexOf(data._id) === -1) &&
							(parseInt( data.x, 10)-radius >= d.x) && (parseInt( data.x, 10)+radius<=d.x+parseInt( d.width, 10)) &&
							(parseInt( data.y, 10)-radius >= d.y) && (parseInt( data.y, 10)+radius<=d.y+parseInt( d.height, 10)) )
						{
								sel.push(data._id);
						}
					})
				}
			})
			.on( "mouseup", function() {
				if(!graph.dragging)
					return;

				for(var x = 0; x < sel.length; x++){
					graph.selectToggle( graph.node_lut[ sel[x] ] );
				}
				
				//Reset array
				sel.length = 0;

				graph.dragging = false;

				// reassign zoom
				svg.call(graph.zoomm.on("zoom", rescale));

				// remove selection frame
				svg.selectAll( "rect.rect_selection").remove();
			})
		;

		this.zoomm = d3.behavior.zoom();
		svg.call(this.zoomm.on("zoom", rescale));

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
			graph.dragging = true;
			d3.event.sourceEvent.stopPropagation();
			d3.select(this).classed("dragging", true);
			//graph.force.start();
		}

		function dragged(d) {
			d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
		}

		function dragended(d) {
			graph.dragging = false;
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
			if(this.getShape(node).classList.contains("highlight"))
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

	/*
	 * Function to delete an element (node or link)
	 * @param {Object} node- Node damas
	 */
	damasGraph.prototype.removeNode = function( node ){
		var shape = this.getShape(node);
		var remove , pos;
		var nodeLinks;
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
			var nodeLinksFrom = this._getNodeLinksFrom(node); //Links source
			var nodeLinksTo = this._getNodeLinksTo(node); //Links target
			nodeLinks = nodeLinksFrom.concat(nodeLinksTo); //Concat two arrays (source & target)
			nodeLinks.map(function(l) {
				var link = graph.node_lut[l._id];
				var position_sel = graph.selection.indexOf(link);

				if(position_sel === -1){
					graph.d3_links.splice(graph.d3_links.indexOf(l), 1);
					graph._removeNode(link);
				}
			});
		}
		
		if(this._removeNode(node)){
			this.restart();
			return true;
		}

		function search(remove){
			for(var x= 0; x < remove.length; x++)
			{
				if(remove[x]._id === node._id){
					return x;
				}
			}
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
			.style("marker-end",  "url(#arrowD)")
			// Need to fix key style on links. setAttribute fct no working
//			.attr("style", function(d){ return d.style;})
			.on("click", function(d, l) {
				if (d3.event.defaultPrevented) return; // click suppressed
				if(window['node_pressed']){
					node_pressed.call(graph.node_lut[d._id], d3.event);
				}
			})
			.on("mouseenter", function(d) {
				if(graph.dragging){return;}
				graph.getShape(graph.node_lut[d._id]).classList.add("hover");
				graph.force.stop();
				path.style("marker-end",  "url(#arrowO)")
			})
			.on("mouseleave", function(d) {
				if(graph.dragging){return;}
				graph.force.resume();
				graph.getShape(graph.node_lut[d._id]).classList.remove("hover");
				if(graph.selection.indexOf(graph.node_lut[d._id]) == -1){
					path.style("marker-end",  "url(#arrowD)");
				}
				else
				{
					graph.getShape(graph.node_lut[d._id]).classList.add("selected");
					path.style("marker-end",  "url(#arrowS)");
				}
			});

		//for delete elements in the DOM if they are more elements DOM than number links-data
		this.svgLinks.exit().remove();


		// add new nodes
		this.svgNodes = this.svgNodes.data( this.d3_nodes, function(d){
			return d._id;
		});
		
		var g = this.svgNodes.enter().append('svg:a').call(graph.force.drag()
				.on("dragstart", function(d){ graph.dragging = true; d3.event.sourceEvent.stopPropagation(); })
				.on("drag", function(d) { graph.drag(); }))
				.attr("style", function(d){ return d.style;});
				//.attr('xlink:href', function(d){ return "#"+ d._id;});
		
		var tools = g.append('svg:g')
			.attr("class", "tools")
			.style('display', 'none');
		
/*
		var openCircle = tools.append("circle")
			.attr('r', 3)
			.attr('cx', '-8.5')
			.attr('cy', '8.5')
//			.style("stroke", "white")
//			.style("stroke-width", 0.5)
			.attr('fill', "white");

		var shareCircle = tools.append("circle")
			.attr('r', 3)
			.attr('cx', '-12')
			.attr('cy', '0')
//			.style("stroke", "white")
//			.style("stroke-width", 0.5)
			.attr('fill', 'white');

		var deleteCircle = tools.append("circle")
			.attr('r', 3)
			.attr('cx', '-8.5')
			.attr('cy', '-8.5')
//			.style("stroke", "white")
//			.style("stroke-width", 0.5)
			.attr('fill', 'white');
*/

		var pin = tools.append("circle")
			.attr('r', 3)
			.attr('cx', '-9')
			.attr('cy', '-9')
			.style("stroke", "white")
			.style("stroke-width", 0.5)
			.style('fill', 'ddd');


/*
		var openPlus = tools.append("svg:image")
			.attr('xlink:href', 'scripts/graphViewer/icons/plus25.svg')
			.attr("class", "openPlus")
			.attr('x', '-10.25')
			.attr('y', '6.75')
			.attr('width', 3.5)
			.attr('height', 3.5);
*/
			
		var pin2 = tools.append("svg:polygon")
			.attr('transform', 'translate(-11, -11) scale(0.01)')
			.attr("points", "291.282,268.509 384.723,169.25 294.709,191.246 151.04,58.874 151.04,0 0,154.527 68.258,150.821 190.529,301.642 176.224,382.492 266.059,290.545 478.165,478.165")
			.on('click', function(d){
				if(d.fixed === true || d.fixed === 1){
					d.fixed = false;
					graph.restart();
				}
				else{
					d.fixed = true;
				}
			});

/*
		var pin2 = tools.append("svg:image")
			.attr('xlink:href', "icons/pin.svg")
			//.attr('xlink:href', "scripts/graphViewer/icons/pin.svg")
			.attr("class", "pin")
			.attr('x', '-10.5')
			.attr('y', '-10.5')
			.attr('width', 3.5)
			.attr('height', 3.5)
			.on('click', function(d){
				if(d.fixed === true || d.fixed === 1){
					d3.select(this).attr('xlink:href', "scripts/graphViewer/icons/pin.svg")
					d.fixed = false;
					graph.restart();
				}
				else{
					d3.select(this).attr('xlink:href', "scripts/graphViewer/icons/pin-selected.svg")
					d.fixed = true;
				}
			});
*/

		g.append("circle")
			.attr("r", 10)
			.attr("class", function(d){ d.shape = this; return "nodeBG"});
		
		g.append('svg:circle')
			.attr("id", function(d) { return "thumbCirc"+d._id; })
			.attr("r", 10)
/*
			.style("fill", function(d) {
				return "url(#thumb"+d._id+")";
			})
*/
			//.attr("class", "node " + d._id.split(/_/)[0]);
			.attr("class", function(d) { return "node " + d._id.split(/_|\//)[0]});
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
				return d.name || d._id;
				//return (d.file)? d.file.split('/').pop() : d._id;
			});

		//for delete elements in the DOM if they are more elements DOM than number svgLabels-data
		this.svgLabels.exit().remove(); 
		
		g.append(function(d){
			return graph.nodeText(d);
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
			.enter().append( function(d){
				return graph.nodePattern(d);
			});

		g.on("mouseenter", function(d) {
			if(graph.dragging){return;}
			graph.force.stop();
			graph.showConnections(graph.node_lut[d._id]);
			graph.getShape(graph.node_lut[d._id]).classList.remove("highlight");
			graph.getShape(graph.node_lut[d._id]).classList.add("hover");
//			tools.style({opacity:'1.0'});
			tools.style({display:'block'});
		});
		g.on("mouseleave", function(d) {
			if(graph.dragging){return;}
			graph.force.resume();
			graph.unhighlightElements();
			graph.getShape(graph.node_lut[d._id]).classList.remove("hover");
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
