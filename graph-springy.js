(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['graph-common', 'springy', 'svg-pan-zoom'], factory);
	} else {
		// Browser globals
		root.damasGraph = factory(root.damasGraph, root.Springy, root.svgPanZoom);
	}
}(this, function (damasGraph, Springy, svgPanZoom) {


	springy_damas = {
		ray: 10,
		edge_distance: 10,
		graph_all_nodes : []
	};

	//damasGraph.node_indexes = [];
	damasGraph.prototype.springy_lut = {};

	//damasGraph.prototype.init = function ( htmlelem )
	damasGraph.prototype.init = function ( htmlelem )
	{ 	
		this.springy_graph = new Springy.Graph();
		this.springy_layout = new Springy.Layout.ForceDirected(this.springy_graph, 300.0, 300.0, 0.5);
		this.svg = this.init_SVG();
		htmlelem.appendChild(this.svg);

		this.svgpanzoominstance = svgPanZoom('#svggraph', { minZoom: 0.1, maxZoom: 10 } );
		springy_damas.currentBB = this.springy_layout.getBoundingBox();
		this.springy_renderer = springy_damas.get_renderer( this.springy_layout );
		htmlelem.addEventListener('mousemove', function(e){
    		if(graph.selection.length == 0)
				return;
			graph.springy_renderer.stop();
    	});
		this.springy_renderer.start();
	}

	damasGraph.prototype.newNode = function( node )
	{
		if (this._newNode(node))
		{
			var springy_node = this.springy_graph.newNode(node);
			if(node.id && !node._id) node._id = node.id; // backward compatibility
			this.springy_lut[node._id] = springy_node;
			return true;
		}
		return false;
	}

	damasGraph.prototype.newEdge = function( l ){
		if (this._newEdge(l))
		{
			var springy_source_id = this.springy_lut[l['src_id']].id;
			var springy_target_id = this.springy_lut[l['tgt_id']].id;
			var springy_source_node;
			for(var x = 0; x < this.springy_graph.nodes.length; x++)
			{
				if( this.springy_graph.nodes[x].id === springy_source_id )
					springy_source_node = this.springy_graph.nodes[x];
			}
			var springy_target_node;
			for(var x = 0; x < this.springy_graph.nodes.length; x++)
			{
				if( this.springy_graph.nodes[x].id === springy_target_id )
					springy_target_node = this.springy_graph.nodes[x];
			}
			/*var springy_source_node = this.springy_graph.nodes[springy_source_id];
			var springy_target_node = this.springy_graph.nodes[springy_target_id];*/
			var springy_edge = this.springy_graph.newEdge(springy_source_node, springy_target_node, l);
			this.springy_lut[l._id] = springy_edge;
			return true;
		}
		return false;
	}
	
	/*
	 * Function to delete an element (node or link)
	 * @param {Object} node- Node damas
	 */
	damasGraph.prototype.removeNode = function( node ){

		var dataNode = this.springy_lut[node._id]; 
		var shape = graph.getShape(this.node_lut[node._id]);
		
		if(!node.src_id && !node.tgt_id){ //Nodes
			spliceLinksForNode(node);
			var text = this.getText(this.node_lut[node._id]);

			text.parentNode.removeChild(text);
		}
		
		shape.parentNode.removeChild(shape);
		delete this.springy_lut[node._id];

		var spr_graph = this.springy_graph;
		(dataNode.source && dataNode.target) ? spr_graph.removeEdge( dataNode ) : spr_graph.removeNode( dataNode );
		
		if(this._removeNode(node))
			return true;

		function spliceLinksForNode(node) {
			var links = graph.links;
			var toSplice = links.filter(function(l) { 
				return (l.src_id === node._id || l.tgt_id === node._id);
			});
			toSplice.map(function(l) {
				var position = graph.selection.indexOf(graph.node_lut[l._id]);
				var shape = graph.getShape(graph.node_lut[l._id]);
				var link =  graph.node_lut[l._id];
				if(position === -1)
				{ 
					shape.parentNode.removeChild(shape);
					graph._removeNode(link);
					delete graph.springy_lut[l._id];
				}
			});
		}
	}

	damasGraph.prototype.getShape = function( node ){
		var dataNode = this.springy_lut[node._id];
		var search;
		var figure;

		(dataNode.source && dataNode.target) ? search = this.springy_graph.edges :  search = this.springy_graph.nodes;

		for(var x=0; x < search.length; x++)
		{
			if(search[x].id == dataNode.id)
				figure = search[x].shape;
		}
		if(figure === undefined) //Already deleted by RemoveNode. If a node is deleted spryngy delete all links related
			figure = dataNode.shape;
		return figure; //shape
	}

	damasGraph.prototype.getText = function( node ){
		var text = this.springy_lut[node._id].text;
		return text;
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
				var shape = graph.getShape(graph.node_lut[n]);
				var text = graph.getText(graph.node_lut[n]); //Get text each node exluded
				graph._toggleOpacity(shape);
				graph._toggleOpacity(text); //apply opacity also the text
			});
			return true;
		}
	}

	damasGraph.prototype.unhighlightElements = function ( )
	{
		//Unhighlight elements commons (links)
		this.unhighlightLinks();

		var nodes = this.nodes;
		//var labels = this.svgLabels[0];

		//Remove orange and opacity to nodes
		for(var x = 0; x < nodes.length; x++){

			var node = this.node_lut[nodes[x]._id];
			var shape = this.getShape(this.node_lut[nodes[x]._id]);
			var text = this.getText(this.node_lut[nodes[x]._id]); 
		
			if(this.getShape(node).classList.contains("highlight"))
				this._highlightSelectedOrange(node);

			if(shape.classList.contains("withOpacity"))
				this._toggleOpacity(shape);


			if(text.classList.contains("withOpacity"))
				this._toggleOpacity(text);
			
		}
	}

	/**
	 * Clear the graph
	 */
	damasGraph.prototype.erase = function( ){
		this.springy_graph.filterNodes( function(){return false} );
		while(this.g1.firstChild)
			this.g1.removeChild(this.g1.firstChild);
		while(this.g2.firstChild)
			this.g2.removeChild(this.g2.firstChild);
		this.node_lut = {};
		//this.node_indexes.length = 0;
		this.springy_graph.nextNodeId = 0;
		this.springy_graph.nextLinkId = 0;
		this.nodes.length = 0;
		this.links.length = 0;
		return true;
	}

	springy_damas.get_renderer = function( layout )
	{
		return new Springy.Renderer(layout,
			function clear() {
				// code to clear screen
			},
			function drawEdge(edge, p1, p2) {
				if( !edge.shape )
				{
					edge.shape = document.createElementNS("http://www.w3.org/2000/svg", 'line');
					graph.g1.appendChild( edge.shape );
					if( edge.source.data.time > edge.target.data.time )
					//if( edge.source.data.keys.time > edge.target.data.keys.time )
					{
						edge.shape.setAttribute('marker-end', 'url(#arrowTimealert)' );
						edge.shape.setAttribute('class', 'timealert' );
						//edge.source.shape.style.stroke = 'red';
						//edge.source.shape.style.strokeWidth = '1';
					}
					else
					{
						edge.shape.setAttribute('marker-end', 'url(#arrowD)' );
						edge.shape.setAttribute('style', edge.data.style);
					}
					edge.shape.addEventListener( 'click', function(e){
  						if(window['node_pressed']){
	  						node_pressed.call(this, e);
   						}
    				}.bind(graph.node_lut[edge.data._id]));
    				edge.shape.addEventListener( 'mouseover', function(e){
    					graph.getShape(graph.node_lut[this._id]).classList.add("hover");
    					graph.springy_renderer.stop();
    					edge.shape.style["marker-end"] = "url(#arrowO)";
    				}.bind(graph.node_lut[edge.data._id]));
    				
    				edge.shape.addEventListener( 'mouseout', function(e){ 
    					graph.springy_renderer.start();
    					graph.getShape(graph.node_lut[this._id]).classList.remove("hover");
		  				if(graph.selection.indexOf(graph.node_lut[this._id]) == -1){
		  					edge.shape.style["marker-end"] = "url(#arrowD)";
						}
						else
						{
							graph.getShape(graph.node_lut[this._id]).classList.add("selected");
							edge.shape.style["marker-end"] = "url(#arrowS)";
						}
    				}.bind(graph.node_lut[edge.data._id]));
				}
				var s1 = springy_damas.toScreen(p1);
				var s2 = springy_damas.toScreen(p2);

				var theta = Math.atan2(s2.y-s1.y, s2.x-s1.x);
				var tx1 = s1.x + springy_damas.edge_distance * Math.cos(theta);
				var ty1 = s1.y + springy_damas.edge_distance * Math.sin(theta);

				var theta = Math.atan2(s1.y-s2.y, s1.x-s2.x);
				var tx2 = s2.x + springy_damas.edge_distance * Math.cos(theta);
				var ty2 = s2.y + springy_damas.edge_distance * Math.sin(theta);

				edge.shape.setAttribute('x1', tx1 );
				edge.shape.setAttribute('y1', ty1 );
				edge.shape.setAttribute('x2', tx2 );
				edge.shape.setAttribute('y2', ty2 );

				edge.shape.addEventListener("mouseover", function(){
					//this.orig_stroke = edge.shape.getAttribute('stroke');
					//this.setAttribute('stroke', 'green');
					/*
					if( $('graph_select') )
					{
						$('graph_select').update( this.damelem.rightbox() );
						$('graph_select').setStyle({'opacity': '1'});
					}
					*/
				});
				edge.shape.addEventListener("mouseout", function(){
					//alert(this.orig_stroke);
					//this.setAttribute('stroke', this.orig_stroke );
					/*
					if( $('graph_select') )
					{
						$('graph_select').update();
						$('graph_select').setStyle( {'opacity': '0'});
					}
					*/
				});
			},
			function drawNode(node, p) {
				if( !node.shape )
				{
					a = document.createElementNS("http://www.w3.org/2000/svg", 'a');
					a.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + node.data._id );
					a.setAttribute('style', node.data.style);
					var circleBG = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
					circleBG.setAttribute('class','nodeBG');
					circleBG.setAttribute('r',springy_damas.ray);
					a.appendChild(circleBG);

					var circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');

					node.text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
					node.text.setAttribute('style', 'font: 4px arial');
					
					node.shape = a;
					circle.node = node;
					circle.point = p;
					a.appendChild(circle);
					circle.setAttribute('r',springy_damas.ray);
					node.ext = graph.nodeText(node.data);
					a.appendChild(node.ext);

					var name = node.data.name;
					if (name)
					{
						var title = document.createElementNS("http://www.w3.org/2000/svg", 'title');
						var titleText = document.createTextNode(name);
						title.appendChild(titleText);
						circle.appendChild(title);
					}
					
					var image = node.data.image;
					if (image)
					{
						graph.defs.appendChild(graph.nodePattern(node.data));
						circle.style.fill = 'url(#thumb'+node.data._id+')';
					}
					
					var file = node.data.file;
					if (file)
					{

						var title = document.createElementNS("http://www.w3.org/2000/svg", 'title');
						var titleText = document.createTextNode( file.split('/').reverse()[0]);
						title.appendChild(titleText);
						circle.appendChild(title);

						var textNode = document.createTextNode( file.split('/').reverse()[0]);
						node.text.appendChild(textNode);
						
					}
					var type = node.data.type;
					if(type)
					{
						circle.setAttribute('class', type);
					}
					if(node.data.targets > 0)
					{

					}

//					node.plus = document.createElementNS("http://www.w3.org/2000/svg", 'image');
//					a.appendChild(node.plus);
//					node.plus.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'scripts/graphViewer/icons/plus25.svg');
//					node.plus.setAttribute('width', 5);
//					node.plus.setAttribute('height', 5);
					
					graph.g3.appendChild(node.text);
					graph.g2.appendChild(a);

					a.addEventListener( 'click', function(e){
						if(window['node_pressed']){
							node_pressed.call(this, e);
						}
					}.bind(graph.node_lut[node.data._id]));

					//Add listeners for get the connections
					a.addEventListener( 'mouseenter', function(e){ 
						graph.springy_renderer.stop();
						graph.showConnections(this);
					}.bind(graph.node_lut[node.data._id]));

					a.addEventListener( 'mouseleave', function(e){
						graph.springy_renderer.start();
						graph.unhighlightElements();
					});
				}
				var s = springy_damas.toScreen(p);
				node.shape.setAttribute('transform', 'translate(' + s.x + ',' + s.y + ')');
				node.text.setAttribute('x', (s.x) + 11 );
				node.text.setAttribute('y', (s.y) + 1 );
			}
		);
	}

	springy_damas.toScreen = function(p) {
		var size = springy_damas.currentBB.topright.subtract(springy_damas.currentBB.bottomleft);
		min = 60;
		var sx = p.subtract(springy_damas.currentBB.bottomleft).divide(size.x).x * min + 60;
		var sy = p.subtract(springy_damas.currentBB.bottomleft).divide(size.y).y * min + 80;
		return new Springy.Vector(sx, sy);
	};

	springy_damas.fromScreen = function(s) {
		var size = springy_damas.currentBB.topright.subtract(springy_damas.currentBB.bottomleft);
		var px = (s.x / springy_damas.viewport.getBBox().width) * size.x + springy_damas.currentBB.bottomleft.x;
		var py = (s.y / springy_damas.viewport.getBBox().height) * size.y + springy_damas.currentBB.bottomleft.y;
		return new Springy.Vector(px, py);
	};


	//var damasGraph = new damasGraph();

	return damasGraph;

}));
