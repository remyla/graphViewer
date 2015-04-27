(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['graph-common', 'springy', 'svg-pan-zoom'], factory);
	} else {
		// Browser globals
		root.damasGraph = factory(root.damasGraph, root.Springy, root.svgPanZoom);
	}
}(this, function (damasGraph, Springy, svgPanZoom) {

//define( ['springy', 'svg-pan-zoom' ], function( Springy, svgPanZoom ){

springy_damas = {
	ray: 12,
	edge_distance: 12,
	graph_all_nodes : []
};

/*

GRAPH =  function(){
	this.nodes = {};
	this.edges = {};

}
*/

	damasGraph.node_indexes = [];
	damasGraph.node_lut = {};

	damasGraph.init = function ( htmlelem )
	{
		//window.Springy = Springy;
		this.springy_graph = new Springy.Graph();
		this.springy_layout = new Springy.Layout.ForceDirected(this.springy_graph, 300.0, 300.0, 0.5);
		//this.svg = damassvggraph.getSVG();
		this.svg = this.init_SVG();
		htmlelem.appendChild(this.svg);

		this.svgpanzoominstance = svgPanZoom('#svggraph', { minZoom: 0.1, maxZoom: 10 } );
		springy_damas.currentBB = this.springy_layout.getBoundingBox();
		this.springy_renderer = springy_damas.get_renderer( this.springy_layout );
		this.springy_renderer.start();
	}

	damasGraph.newNode = function( node ){
		if (this.node_lut[node.id]) return false;
		this.node_indexes.push(node.id);
		var springy_node = this.springy_graph.newNode(node);
		this.node_lut[node.id] = springy_node.id;
		//this.node_lut[springy_node.id] = node.id;
		return true;
	}

	damasGraph.newEdge = function( source, target ){
		springy_source_id = this.node_lut[source];
		springy_target_id = this.node_lut[target];
		springy_source_node = this.springy_graph.nodes[springy_source_id];
		springy_target_node = this.springy_graph.nodes[springy_target_id];
		this.springy_graph.newEdge(springy_source_node, springy_target_node);
	}

damassvggraph = {
	makeSVGinteractive: function() {
		// TEST FOR DROP
		/*
		allowDrop = function(ev){
			ev.preventDefault();
			return false;
		}
		drop = function(ev){
			alert('drop');
			ev.preventDefault();
			//console.log(ev.dataTransfer);
			//console.log(ev.dataTransfer.files[0]);
			console.log(ev.dataTransfer.files);
			var files = ev.dataTransfer.files;
			//alert(files.length);
			for(i=0;i<files.length;i++)
			{
				var file = files[i];
				var elem = damas.create(file);
				elem.update({label: file.name });
				nodes[elem.id] = graph.newNode({'label': file.name});
				nodes[elem.id].damelem = elem;
				//console.log(ev.dataTransfer);
			}
		}
		svg.setAttribute('ondragover', 'allowDrop(event)');
		svg.setAttribute('ondrop', 'drop(event)');
		*/

		function cancel(e){
			e.stopPropagation();
			if(e.preventDefault) e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
			return false; // required by IE
		}
		svg.ondragover = cancel;
		svg.ondragenter = cancel;
/*
		svg.ondragover = function(e){
			e.stopPropagation();
			e.preventDefault();
		}
*/
		svg.ondragleave = function(e){
			e.stopPropagation();
			e.preventDefault();
		}
		svg.ondrop = function(e){
			//alert( e.dataTransfer.getData('Text'));
			e.stopPropagation();
			if(e.preventDefault) e.preventDefault();
			//alert('ondrop');
			console.log(e.dataTransfer);
			console.log(e.dataTransfer.files);
			var files = e.dataTransfer.files;

			// DROP FILES
			for(i=0;i<files.length;i++)
			{
				var file = files[i];
				var elem = damas.create(file);
				elem.update({label: file.name });
				nodes[elem.id] = graph.newNode({'label': file.name});
				nodes[elem.id].damelem = elem;
				//console.log(ev.dataTransfer);
			}
			console.log(e.dataTransfer.types);
			var types = e.dataTransfer.types;
			if(e.dataTransfer.types)
			{
				// DROP EXISTING NODE
				var text = e.dataTransfer.getData('Text');
				if( text.indexOf(window.location.origin) === 0)
				{
					id = text.replace(window.location.origin+window.location.pathname+'#view=', '');
					var elem = damas.read(parseInt(id));
                                	Object.extend( elem, damas.element_canvas );
                                	var img = elem.imageURL();
                                	nodes[elem.id] = graph.newNode( { 'elem':elem, 'label': elem.label(), 'damid': elem.id, 'damimg': img } );
                                	nodes[elem.id].damelem = elem;
				}
				// DROP LINK
				else
				{
					var elem = damas.create( {
						url: e.dataTransfer.getData('Text')
					});
					nodes[elem.id] = graph.newNode({'label': e.dataTransfer.getData('Text')});
					nodes[elem.id].damelem = elem;
				}
			}
		}
		// TEST END
	}
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
				damasGraph.g1.appendChild( edge.shape );
				if( edge.source.data.keys.time > edge.target.data.keys.time )
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
				a.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + node.data.id );
				//a.setAttributeNS('http://www.w3.org/1999/xlink', 'href', node.data.keys.file );
				//a.setAttribute('title', escape(JSON.stringify(node.data)));
				var circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
				//var txt = JSON.stringify(node.data);

				node.text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
				node.text.setAttribute('style', 'font: 4px arial');
				a.appendChild(node.text);

				if( node.data.keys.file )
				{
					var title = document.createElementNS("http://www.w3.org/2000/svg", 'title');
					var titleText = document.createTextNode( node.data.keys.file.split('/').reverse()[0]);
					title.appendChild(titleText);
					circle.appendChild(title);

					var textNode = document.createTextNode( node.data.keys.file.split('/').reverse()[0]);
					node.text.appendChild(textNode);

				}
				if( node.data.keys.name )
				{
					var title = document.createElementNS("http://www.w3.org/2000/svg", 'title');
					var titleText = document.createTextNode(node.data.keys.name);
					title.appendChild(titleText);
					circle.appendChild(title);
				}
				node.shape = circle;
				circle.node = node;
				circle.point = p;
				a.appendChild(circle);
				circle.setAttribute('r',springy_damas.ray);
				if(node.data.keys.image)
				{
					pattern = document.createElementNS("http://www.w3.org/2000/svg", 'pattern');
					damasGraph.defs.appendChild( pattern );
					pattern.setAttribute('id', 'thumb'+node.data.id);
					pattern.setAttribute('patternContentUnits', 'objectBoundingBox');
					pattern.setAttribute('x', '0');
					pattern.setAttribute('y', '0');
					pattern.setAttribute('width', 1);
					pattern.setAttribute('height', 1);
					pattern.setAttribute('preserveAspectRatio', 'xMidYMid slice');
					var image = document.createElementNS("http://www.w3.org/2000/svg", 'image');
					pattern.appendChild( image );
					image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', node.data.keys.image );
					image.setAttribute('x', '0');
					image.setAttribute('y', '0');
					image.setAttribute('width', '1');
					image.setAttribute('height', '1');
					image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
					/*
					var c = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
					c.setAttribute('x', '0');
					c.setAttribute('y', '0');
					c.setAttribute('width', '1');
					c.setAttribute('height', '1');
					c.setAttribute('fill', 'none');
					pattern.appendChild( c );
					*/
					circle.setAttribute('fill','url(#thumb'+node.data.id+')');
				}
				if(node.data.keys.type)
				{
					circle.setAttribute('class', node.data.keys.type);
				}
				if(node.data.targets > 0)
				{
					
				}
				
				node.plus = document.createElementNS("http://www.w3.org/2000/svg", 'image');
				a.appendChild(node.plus);
				node.plus.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'scripts/graphViewer/icons/plus25.svg' );
				node.plus.setAttribute('width', 5);
				node.plus.setAttribute('height', 5);
				
				damasGraph.g2.appendChild(a);

/*
				a.addEventListener("click", function( e ){
					e.stop();
					var but = simpleui.accordion( new Element('button').insert('node '+this.getAttribute('href')) );
					$('content').insert(but);
					$('content').insert(this.damnode.title());
					//alert(this.damelem.tooltip());
					//window.location.hash='#'+this.damelem.id;
				});
				
				circle.addEventListener("mouseover", function(){
					//this.setAttribute('stroke', 'yellow');
					if( $('graph_select') )
					{
						//$('graph_select').update( this.damelem.rightbox() );
						$('graph_select').setStyle({'opacity': '1'});
					}
				});
				
				circle.addEventListener("mouseout", function(){
					//this.setAttribute('stroke', this.orig_stroke );
					if( $('graph_select') )
					{
						$('graph_select').update();
						$('graph_select').setStyle( {'opacity': '0'});
					}
				});
				
				circle.addEventListener("mousedown", function(){
					this.setAttribute('stroke', 'green');
				});
				circle.addEventListener("mouseup", function(e){
					//this.setAttribute('stroke', 'yellow');
					var v = springy_damas.fromScreen( { x: e.pageX, y: e.pageY } );
					//alert( e.pageX + "," + e.pageY);
					//alert( this.point.x + "," + this.point.y);
					//alert( v.x + "," + v.y);
					//p.x = v.x;
					//p.y = v.y;
					//this.point.x = v.x;
					//this.point.y = v.y;
					this.point.x = 0;
					this.point.y = 0;
					window.springy_renderer.start();
				});
				circle.addEventListener("mousemove", function( e ){
					//var v = springy_damas.fromScreen( { x: e.clientX, y: e.clientY } );
					var v = springy_damas.fromScreen( { x: e.pageX, y: e.pageY } );
					//this.setAttribute('cx', v.x );
					//this.setAttribute('cy', v.y );
					//this.setAttribute('stroke', 'black');
					this.point.x = v.x;
					this.point.y = v.y;
					//e.clientX
				});
*/
				circle.addEventListener( 'click', function(e){
					if(e.ctrlKey)
					{
						damas_open(this.data.id);
						e.preventDefault();
						return false;
					}
					if(window['assetOverlay']){
						assetOverlay(this.data);
					}
				}.bind(node));
			}
			var s = springy_damas.toScreen(p); 
			node.shape.setAttribute('cx', s.x );
			node.shape.setAttribute('cy', s.y );
			node.plus.setAttribute('x', (s.x) + 5 );
			node.plus.setAttribute('y', (s.y) + 5 );
			node.text.setAttribute('x', (s.x) + 10 );
			node.text.setAttribute('y', (s.y) - 5 );
		}
	);
}

springy_damas.toScreen = function(p) {
	var size = springy_damas.currentBB.topright.subtract(springy_damas.currentBB.bottomleft);
	//var sx = p.subtract(springy_damas.currentBB.bottomleft).divide(size.x).x * 60 + 200;
	//var sy = p.subtract(springy_damas.currentBB.bottomleft).divide(size.y).y * 60 + 200;
	//var min = Math.min(this.svg.getBoundingClientRect().width, this.svg.getBoundingClientRect().height) /4;
	min = 60;

	var sx = p.subtract(springy_damas.currentBB.bottomleft).divide(size.x).x * min + 60;
	var sy = p.subtract(springy_damas.currentBB.bottomleft).divide(size.y).y * min + 80;
	//var sx = p.subtract(springy_damas.currentBB.bottomleft).x *5;
	//var sy = p.subtract(springy_damas.currentBB.bottomleft).y *5;
	return new Springy.Vector(sx, sy);
};

springy_damas.fromScreen = function(s) {
	var size = springy_damas.currentBB.topright.subtract(springy_damas.currentBB.bottomleft);
	var px = (s.x / springy_damas.viewport.getBBox().width) * size.x + springy_damas.currentBB.bottomleft.x;
	var py = (s.y / springy_damas.viewport.getBBox().height) * size.y + springy_damas.currentBB.bottomleft.y;
	return new Springy.Vector(px, py);
};



return damasGraph;

}));
