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
		this.initDebugFrame(htmlelem);
		this.init(htmlelem);
		this.refreshDebugFrame();
	}

	damasGraph.prototype.selectToggle = function( node ) {
		if (this.selection.indexOf(node) === -1 )
		{
			this.selection.push( node );
		}
		else
		{
			this.selection.pop( node );
		}
		this.getShape(node).classList.toggle('selected');
		this.refreshDebugFrame();
	}

	damasGraph.prototype.unselectAll = function( ) {
		this.selection.forEach(function(n){
			this.getShape(n).classList.remove('selected');
		});
		this.selection.length = 0;
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
		this.selection.pop(node);
		this.nodes.pop(node);
		return true;
	}

	damasGraph.prototype.initDebugFrame = function ( htmlelem )
	{
		this.debug = {};
		var div = document.createElement("div");
		div.setAttribute('id', 'graphDebugFrame' );
		var c = 'DEBUG:<br/><span id="graphDebugNbNodes">?</span> node(s)<br/><span id="graphDebugNbEdges">?</span> edge(s)<br/><span id="graphDebugNbSelection">?</span> selected<br/>';
		div.innerHTML = c;
		this.debug.nbNodes = div.querySelector('#graphDebugNbNodes');
		this.debug.nbEdges = div.querySelector('#graphDebugNbEdges');
		this.debug.nbSelection = div.querySelector('#graphDebugNbSelection');
		htmlelem.appendChild(div);
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
		// marker 1
		var marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
		marker.setAttribute('id', 'arrow' );
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
		
		// extensions
		extensionTxt = function(node){
				var ext = document.createElementNS("http://www.w3.org/2000/svg", "text");
				ext.setAttribute('class', 'extText');
				ext.setAttribute('text-anchor', 'middle');
				ext.setAttribute('dx', 0);
				ext.setAttribute('dy', 2);
				ext.textContent = node.file.split(".").pop().toUpperCase();
				return ext;
		}
		
		var gBox = document.createElementNS("http://www.w3.org/2000/svg", "g");
		var g1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
		var g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
		var g3 = document.createElementNS("http://www.w3.org/2000/svg", "g");
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

	return damasGraph;
}));
