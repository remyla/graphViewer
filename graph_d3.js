damassvggraph = {
	getSVG: function() {
		
		var width = window.innerWidth;
		var height = window.innerHeight;

		var color = d3.scale.category20();

		var force = d3.layout.force()
			.charge(-200)
			.linkDistance(30)
			.size([width, height]);

		svg = d3.select("#graph")
			.append("svg:svg")
				.attr("id", "svggraph")
//				.attr('width', width)
//				.attr('height', height)
				.attr("viewBox", "0 0 " + width + " " + height )
				.attr("preserveAspectRatio", "xMidYMid meet")
				.attr("pointer-events", "all");

		defs = svg.append('svg:defs');

		var background = svg.append('svg:rect')
				.attr("id", "backG")
//				.attr('width', width)
//				.attr('height', height)
				.attr('fill', 'gray')
				.attr("pointer-events", "all")
				.call(d3.behavior.zoom().on("zoom", rescale));

		var gBox= svg.append('svg:g')
				.attr("pointer-events", "all");

		function rescale() {
			trans=d3.event.translate;
			scale=d3.event.scale;
			gBox.attr("transform",
			"translate(" + trans + ")"
			+ " scale(" + scale + ")");
		}

		var g2 = gBox.append('svg:g');
		var g1 = gBox.append('svg:g');


		d3.json("bigbuckbunny_characters.json", function(error, data) {

			// make links reference nodes directly for the JSON format:
			var hash_lookup = [];
			// make it so we can lookup nodes in O(1):
			data.nodes.forEach(function(d, i) {
			  hash_lookup[d.id] = d;
			});
			data.links.forEach(function(d, i) {
			  d.source = hash_lookup[d.src_id];
			  d.target = hash_lookup[d.tgt_id];
			});

			force
				.nodes(data.nodes)
				.links(data.links)
				.start();

			var link = g2.selectAll(".link")
				.data(data.links)
				.enter().append("line")
				.attr("class", "link")
				.style("stroke-width", function(d) { return Math.sqrt(d.value); })
				.style("marker-end",  "url(#arrow)");

			var arrow = defs.selectAll("marker")
				.data(data.links)
				.enter().append("svg:marker")
				.attr("id", "arrow")
				.attr("viewBox", "0 -5 10 10")
				.attr("refX", 25)
				.attr("refY", 0)
				.attr("markerWidth", 6)
				.attr("markerHeight", 6)
				.attr("orient", "auto")
			.append("path")
				.attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
				.style("stroke", "#4679BD")
				.style("opacity", "0.6");



			var node = g1.selectAll(".node")
				.data(data.nodes)
				.enter().append("a")
				.attr('xlink:href', function(d) { return '#'+d.id })
				.call(force.drag)

			var circBG = node.append("circle")
					.attr("r", 10)
					.attr("class", "nodeBG");


			var circ = node.append("circle")
					.attr("r", 10)
					.attr("fill", function(d) { return "url(#thumb"+d.id+")"; })
//					.attr("fill", function(d) { return d.keys.image })
					.attr("class", "node");

			var patImage = defs.selectAll(".node")
				.data(data.nodes)
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
					.attr('x', '0')
					.attr('y', '0')
					.attr('width', 1)
					.attr('height', 1)
					.attr('preserveAspectRatio', 'xMidYMid slice');
			

			node.append("title")
				.text(function(d) { return d.type; });

			force.on("tick", function() {
				link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

				circ.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; })

				circBG.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; })
			});

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
