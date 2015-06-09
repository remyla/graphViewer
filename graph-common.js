(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else {
		// Browser globals
		root.damasGraph = factory();
	}
}(this, function () {

	// Constructor
	function damasGraph( htmlelem ) {
		this.nodes = [];
		this.links = [];
		this.selection = [];
		this.node_lut = {};
		this.initDebugFrame(document.querySelector('#graphDebug'));
		this.init(htmlelem);
		this.refreshDebugFrame();
	}

	damasGraph.prototype.selectToggle = function( node ) { 
		var position = this.selection.indexOf(node);
		if (position === -1 )
		{
			this.selection.push( node );
		}
		else
		{
			this.selection.splice( position, 1 );
		}
		if(this.getShape(node).classList.contains('selected')){
			this.getShape(node).classList.remove('selected');
		}
		else
			this.getShape(node).classList.add('selected');
		this.refreshDebugFrame();
	}

	damasGraph.prototype.unselectAll = function( ) {
		for(var x = 0; x < this.selection.length; x++){
			this.getShape(this.selection[x]).classList.remove('selected');
		}
		this.selection.length = 0;
		var links = this.links;

		for(var x = 0; x < links.length; x++){

			var link = this.node_lut[links[x]._id];
			var shape = this.getShape(this.node_lut[links[x]._id]);
			if(shape.classList.contains("hover"))
				shape.classList.remove("hover");
			
			this.getShape(link).style['marker-end'] = "url(#arrowD)";
		}
		this.refreshDebugFrame();
	}

	damasGraph.prototype.load = function( json ){
		var i;
		if(!json.nodes)
		{
			for(i=0;i<json.length;i++)
			{
				var n = json[i];
				if(n.src_id && n.tgt_id)
					this.newEdge(n);
				else
					this.newNode(n);
			}
			return;
		}
		for(i=0;i<json['nodes'].length;i++)
		{
			var n = json['nodes'][i];
			this.newNode(n);
		}
		for(i=0;i<json['links'].length;i++)
		{
			var l = json['links'][i];
			this.newEdge( l );
		}
		return true;
	}

	/**
	 * Method for get the links and nodes related to a node given. 
	 * @param {Object} node - Array object (generic damas node)
	 * @return {Object} data - Array object with the links & nodes related to node given
	 */
	damasGraph.prototype._getNeighborsR = function( node )
	{ 
		var nodeOrigin;
		var counter = 0;

		var data = {related_links: [], related_nodes: [] };

		getTargetsR(node);

		function getTargetsR(node)
		{
			if(counter == 0)
			{
				nodeOrigin = node;
				data.related_nodes.push(node._id);
			}
			if(node == nodeOrigin && counter != 0)
				return;

			function getLinksNeighbors( node ){
				var lin = graph.links.filter(function(l) { 
					return (l.src_id === node._id ); 
				});
				return lin;
			}

			var connections = getLinksNeighbors(node);

			var nodes = connections.map(function(l){
				var idTarget = l.tgt_id;
				return graph.nodes.filter(function(n){
					return (n._id === idTarget);
				})
			});

			nodes = nodes.map(function(n){return n[0]}); 

			connections.map(function(l){
				var link = graph.node_lut[l._id]._id;
				if(data.related_links.indexOf(link)== -1){
					data.related_links.push(link);
				}
			});

			for(var y = 0; y < nodes.length; y++)
			{
				var n = graph.node_lut[nodes[y]._id];
				if(data.related_nodes.indexOf(n._id) == -1){
					data.related_nodes.push(n._id);
					counter++;
					if(getLinksNeighbors(n).length > 0)
					{
						getTargetsR(n);
					}
				}
			}
		}
		return data;
	}

	/**
	 * Method for get the links and nodes not contained in the list of links and nodes related to node given. 
	 * @param {Object} data - Array object (nodes and links related to a node)
	 * @return {Object} remaining - Array object (nodes and links not related to a node)
	 */
	damasGraph.prototype._getTargetsRemaining = function( data ) {
		var remaining = { unrelated_links:[], unrelated_nodes:[] };

		//Links
		for (var i = 0; i < this.links.length; i++)
		{
			if(data.related_links.indexOf(this.node_lut[this.links[i]._id]._id) == -1)
				remaining.unrelated_links.push(this.node_lut[this.links[i]._id]._id);
		}

		//Nodes
		for (var i = 0; i < this.nodes.length; i++)
		{
			if(data.related_nodes.indexOf(this.node_lut[this.nodes[i]._id]._id) == -1)
				remaining.unrelated_nodes.push(this.node_lut[this.nodes[i]._id]._id);
		}

		return remaining;
	}
	
	/**
	 * Method for highlight the links and nodes contains in the array object. 
	 * @param {Object} data - Array object (nodes and links related to a node)
	 * @return {boolean} 
	 */
	damasGraph.prototype._highlightConnections = function( data ) { 
		data.related_links.map(function(l){
			var link = graph.node_lut[l];
			graph._highlightSelectedOrange(link);
		});
		data.related_nodes.map(function(n){
			var node = graph.node_lut[n];
			graph._highlightSelectedOrange(node);
		});
		
		return true;
	}

	/**
	 * Method for unhighlight the links highlighted.
	 */
	damasGraph.prototype.unhighlightLinks = function ( ) {
		
		var links = this.links;

		for(var x = 0; x < links.length; x++){

			var link = this.node_lut[links[x]._id];
			var shape = this.getShape(this.node_lut[links[x]._id]);
			if(shape.classList.contains("highlight")){
				shape.classList.remove("highlight");
				this.getShape(link).style['marker-end'] ="url(#arrowD)";
			}

			if(shape.classList.contains("withOpacity"))
				this._toggleOpacity(shape);	

			(this.selection.indexOf(link) != -1) ? shape.style["marker-end"] =  "url(#arrowS)" : shape.style["marker-end"] =  "url(#arrowD)";
		}
	}

	/**
	 * Method for highlight in orange the object passed. 
	 * @param {Object} node - Array object (object to highlight)
	 */
	damasGraph.prototype._highlightSelectedOrange = function( node ) { 

			var shape = this.getShape(node);
			
			if(node.tgt_id && node.src_id)
			{
				if(shape.classList.contains("highlight")) {
					shape.classList.remove("highlight");
					shape.style['marker-end'] ="url(#arrowD)";
				}
				else {
					shape.classList.add("highlight");
					shape.style['marker-end'] ="url(#arrowH)";
				}
			}
			else
				shape.classList.toggle('highlight');
	}

	/**
	 * Method for apply opacity to nodes & links not related.
	 * @param {Object} shape - Object with the shape to apply the opacity
	 */
	damasGraph.prototype._toggleOpacity = function( shape )
	{
		(shape.classList.contains("withOpacity")) ? shape.classList.remove("withOpacity") : shape.classList.add("withOpacity");
	}

	damasGraph.prototype.fetchJSONFile = function(path, callback)
	{
		var httpRequest = new XMLHttpRequest();
		httpRequest.onreadystatechange = function() {
			if (httpRequest.readyState === 4)
			{
				//if (httpRequest.status === 200) {
				var data = JSON.parse(httpRequest.responseText);
				if (callback) callback(data);
				//}
			}
		};
		httpRequest.open('GET', path);
		httpRequest.send();
	}

	damasGraph.prototype._newNode = function( node )
	{
		if(node.id && !node._id) node._id = node.id; // backward compatibility
		if (this.node_lut[node._id]) return false;
		this.nodes.push(node);
		this.node_lut[node._id] = node;
		this.refreshDebugFrame();
		return true;
	}

	damasGraph.prototype._newEdge = function( node )
	{
		this.links.push(node);
		this.node_lut[node._id] = node;
		this.refreshDebugFrame();
		return true;
	}

	damasGraph.prototype._removeNode = function( node )
	{
		var position = this.selection.indexOf(node);
		if(position !== -1)
			this.selection.splice(position, 1);
		(node.src_id && node.tgt_id) ? this.links.splice(this.links.indexOf(node), 1) : this.nodes.splice(this.nodes.indexOf(node), 1)
		delete this.node_lut[node._id];
		this.refreshDebugFrame();
		return true;
	}

	damasGraph.prototype.initDebugFrame = function ( htmlelem )
	{
		this.debug = {};
		if(!htmlelem) return;
		var c = 'DEBUG:<br/><span id="graphDebugNbNodes">?</span> node(s)<br/><span id="graphDebugNbEdges">?</span> edge(s)<br/><span id="graphDebugNbSelection">?</span> selected<br/><div id="graphDebugFileKeys"></div>';
		htmlelem.innerHTML = c;
		this.debug.nbNodes = htmlelem.querySelector('#graphDebugNbNodes');
		this.debug.nbEdges = htmlelem.querySelector('#graphDebugNbEdges');
		this.debug.nbSelection = htmlelem.querySelector('#graphDebugNbSelection');
		this.debug.fileKeys = htmlelem.querySelector('#graphDebugFileKeys');
	}

	damasGraph.prototype.refreshDebugFrame = function ( )
	{
		if(this.debug.nbNodes)
		{
			this.debug.nbNodes.innerHTML = this.nodes.length;
		}
		if(this.debug.nbEdges)
		{
			this.debug.nbEdges.innerHTML = this.links.length;
		}
		if(this.debug.nbSelection)
		{
			this.debug.nbSelection.innerHTML = this.selection.length;
		}
		if(this.debug.fileKeys)
		{
			var files = [];
			for(var i=0;i<this.nodes.length;i++)
			{
				files.push(this.nodes[i].file);
			}
			this.debug.fileKeys.innerHTML = files.sort().join('<br/>');
		}
	}

	damasGraph.prototype.init_SVG = function ( )
	{
		var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
		svg.setAttribute('id', 'svggraph' );
		svg.setAttribute('viewBox', '0 0 200 200' );
		//var css = document.createElementNS("http://www.w3.org/2000/svg", "style");
		//svg.appendChild(css);
		//css.setAttribute('type', 'text/css' );
		//css.setAttribute('href', 'graph.css' );
		var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
		// marker arrow default
		var markerD = document.createElementNS("http://www.w3.org/2000/svg", "marker");
		markerD.setAttribute('id', 'arrowD' );
		markerD.setAttribute('markerWidth', '6' );
		markerD.setAttribute('markerHeight', '6' );
		markerD.setAttribute('refX', '3' );
		markerD.setAttribute('refY', '3' );
		markerD.setAttribute('orient', 'auto' );
		markerD.setAttribute('markerUnits', 'strokeWidth' );
		var triangleD = document.createElementNS("http://www.w3.org/2000/svg", "path");
		triangleD.setAttribute('d', 'M0,0 L0,6 L6,3 Z' );
		markerD.appendChild(triangleD);
		defs.appendChild(markerD);
		// marker arrow selected
		var markerS = document.createElementNS("http://www.w3.org/2000/svg", "marker");
		markerS.setAttribute('id', 'arrowS' );
		markerS.setAttribute('markerWidth', '6' );
		markerS.setAttribute('markerHeight', '6' );
		markerS.setAttribute('refX', '3' );
		markerS.setAttribute('refY', '3' );
		markerS.setAttribute('orient', 'auto' );
		markerS.setAttribute('markerUnits', 'strokeWidth' );
		var triangleS = document.createElementNS("http://www.w3.org/2000/svg", "path");
		triangleS.setAttribute('d', 'M0,0 L0,6 L6,3 Z' );
		markerS.appendChild(triangleS);
		defs.appendChild(markerS);
		// marker arrow over
		var markerO = document.createElementNS("http://www.w3.org/2000/svg", "marker");
		markerO.setAttribute('id', 'arrowO' );
		markerO.setAttribute('markerWidth', '6' );
		markerO.setAttribute('markerHeight', '6' );
		markerO.setAttribute('refX', '3' );
		markerO.setAttribute('refY', '3' );
		markerO.setAttribute('orient', 'auto' );
		markerO.setAttribute('markerUnits', 'strokeWidth' );
		var triangleO = document.createElementNS("http://www.w3.org/2000/svg", "path");
		triangleO.setAttribute('d', 'M0,0 L0,6 L6,3 Z' );
		markerO.appendChild(triangleO);
		defs.appendChild(markerO);
		// marker arrow highlight
		var markerH = document.createElementNS("http://www.w3.org/2000/svg", "marker");
		markerH.setAttribute('id', 'arrowH' );
		markerH.setAttribute('markerWidth', '6' );
		markerH.setAttribute('markerHeight', '6' );
		markerH.setAttribute('refX', '3' );
		markerH.setAttribute('refY', '3' );
		markerH.setAttribute('orient', 'auto' );
		markerH.setAttribute('markerUnits', 'strokeWidth' );
		var triangleH = document.createElementNS("http://www.w3.org/2000/svg", "path");
		triangleH.setAttribute('d', 'M0,0 L0,6 L6,3 Z' );
		markerH.appendChild(triangleH);
		defs.appendChild(markerH);
		
		// X & Y axes
		var axisX = document.createElementNS("http://www.w3.org/2000/svg", "line");
		axisX.setAttribute('x1', '0' );
		axisX.setAttribute('y1', '0' );
		axisX.setAttribute('x2', '10' );
		axisX.setAttribute('y2', '0' );
		axisX.setAttribute('class', 'axis' );
		svg.appendChild(axisX);
		
		
		var axisY = document.createElementNS("http://www.w3.org/2000/svg", "line");
		axisY.setAttribute('x1', '0' );
		axisY.setAttribute('y1', '0' );
		axisY.setAttribute('x2', '0' );
		axisY.setAttribute('y2', '10' );
		axisY.setAttribute('class', 'axis' );
		svg.appendChild(axisY);
		
//		var center = document.createElementNS("http://www.w3.org/2000/svg", "circle");
//		center.setAttribute('cx', '00' );
//		center.setAttribute('cy', '0' );
//		center.setAttribute('r', '1' );
//		center.setAttribute('fill', 'red' );
//		svg.appendChild(center);


		// marker timealert
		var marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
		marker.setAttribute('id', 'arrowTimealert' );
		marker.setAttribute('markerWidth', '3' );
		marker.setAttribute('markerHeight', '3' );
		marker.setAttribute('refX', '1.5' );
		marker.setAttribute('refY', '1.5' );
		marker.setAttribute('orient', 'auto' );
		marker.setAttribute('markerUnits', 'strokeWidth' );
		var triangle = document.createElementNS("http://www.w3.org/2000/svg", "path");
		triangle.setAttribute('d', 'M0,0 L0,3 L3,1.5 Z' );
		marker.appendChild(triangle);
		defs.appendChild(marker);
		

		var gBox = document.createElementNS("http://www.w3.org/2000/svg", "g");
		var g1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
		g1.setAttribute('class', 'edges');
		var g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
		g2.setAttribute('class', 'nodes');
		var g3 = document.createElementNS("http://www.w3.org/2000/svg", "g");
		g3.setAttribute('class', 'texts');
		svg.appendChild(defs);
		svg.appendChild(gBox);
		
		gBox.appendChild(g2);
		gBox.appendChild(g1);
		gBox.appendChild(g3);
		this.gBox = gBox;
		this.defs = defs;
		this.g3 = g3;
		this.g2 = g2;
		this.g1 = g1;
		return svg;
	}
	
	damasGraph.prototype.nodeText = function(node){
		var ext = document.createElementNS("http://www.w3.org/2000/svg", "text");
		ext.setAttribute('class', 'extText');
		ext.setAttribute('text-anchor', 'middle');
		ext.setAttribute('dx', 0);
		ext.setAttribute('dy', 2);
		if (node.file && !node.image){
			ext.textContent = node.file.split(".").pop().toUpperCase();
			return ext;
		}
		if (node.abbr){
			ext.textContent = node.abbr.toUpperCase();
			return ext;
		}
		//To do : Find a way to prevent element ext creation if no text
		return ext;
	}

	return damasGraph;
}));
