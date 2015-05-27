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
		this.springy_renderer.start();
	}

	damasGraph.prototype.newNode = function( node )
	{
		if (this._newNode(node))
		{
			var springy_node = this.springy_graph.newNode(node);
			if(node.id && !node._id) node._id = node.id; // backward compatibility
			this.springy_lut[node._id] = springy_node.id;
			return true;
		}
		return false;
	}

	damasGraph.prototype.newEdge = function( l ){
		if (this._newEdge(l))
		{
			var springy_source_id = this.springy_lut[l['src_id']];
			var springy_target_id = this.springy_lut[l['tgt_id']];
			var springy_source_node = this.springy_graph.nodes[springy_source_id];
			var springy_target_node = this.springy_graph.nodes[springy_target_id];
			this.springy_graph.newEdge(springy_source_node, springy_target_node);
			return true;
		}
		return false;
	}

	damasGraph.prototype.removeNode = function( node ){

		if (this.removeNode(node))
		{
			node.shape.parentNode.removeChild(node.shape);
			this.springy_graph.removeNode( node );
		}
	}

	damasGraph.prototype.getShape = function( node ){
		return this.springy_graph.nodes[this.springy_lut[node._id]].shape;
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
						console.log(edge.source);
						//edge.source.shape.style.stroke = 'red';
						//edge.source.shape.style.strokeWidth = '1';
					}
					else
					{
						edge.shape.setAttribute('marker-end', 'url(#arrow)' );
					}
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
						pattern = document.createElementNS("http://www.w3.org/2000/svg", 'pattern');
						graph.defs.appendChild(pattern);
						pattern.setAttribute('id', 'thumb'+node.data._id);
						pattern.setAttribute('patternContentUnits', 'objectBoundingBox');
						pattern.setAttribute('x', '0');
						pattern.setAttribute('y', '0');
						pattern.setAttribute('width', 1);
						pattern.setAttribute('height', 1);
						pattern.setAttribute('preserveAspectRatio', 'xMidYMid slice');
						var svgimage = document.createElementNS("http://www.w3.org/2000/svg", 'image');
						pattern.appendChild( svgimage );
						svgimage.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', image );
						svgimage.setAttribute('x', '0');
						svgimage.setAttribute('y', '0');
						svgimage.setAttribute('width', '1');
						svgimage.setAttribute('height', '1');
						svgimage.setAttribute('preserveAspectRatio', 'xMidYMid slice');
						/*
						var c = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
						c.setAttribute('x', '0');
						c.setAttribute('y', '0');
						c.setAttribute('width', '1');
						c.setAttribute('height', '1');
						c.setAttribute('fill', 'none');
						pattern.appendChild( c );
						*/
//						circle.setAttribute('fill','url(#thumb'+node.data._id+')');
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

					circle.addEventListener( 'click', function(e){
						if(window['node_pressed']){
							node_pressed.call(this, e);
						}
					}.bind(graph.node_lut[node.data._id]));
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
