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

damassvggraph = {
	getSVG: function() {
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

/*
		var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		rect.setAttribute('x', '-100' );
		rect.setAttribute('y', '-100' );
		rect.setAttribute('width', '200' );
		rect.setAttribute('height', '200' );
		svg.appendChild(rect);
*/

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

		var g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
		var g1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
		svg.appendChild(defs);
		svg.appendChild(g2);
		svg.appendChild(g1);
		this.defs = defs;
		this.g2 = g2;
		this.g1 = g1;
		return svg;
	},
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
				damassvggraph.g1.appendChild( edge.shape );
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
				//a.setAttribute('title', escape(JSON.stringify(node.data)));
				var circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
				//var txt = JSON.stringify(node.data);
				if( node.data.keys.file )
				{
					var title = document.createElementNS("http://www.w3.org/2000/svg", 'title');
					var titleText = document.createTextNode( node.data.keys.file.split('/').reverse()[0]);
					title.appendChild(titleText);
					circle.appendChild(title);
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
					damassvggraph.defs.appendChild( pattern );
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
				damassvggraph.g2.appendChild(a);

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
					if(window['assetOverlay']){
						assetOverlay(this.data);
					}
				}.bind(node));
			}
			var s = springy_damas.toScreen(p); 
			node.shape.setAttribute('cx', s.x );
			node.shape.setAttribute('cy', s.y );
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
