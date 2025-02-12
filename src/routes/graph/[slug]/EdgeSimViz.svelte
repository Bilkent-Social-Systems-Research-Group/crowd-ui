<script>
	// @ts-nocheck

	/*
        Base code for d3 & svelte graph by Mark Hughes 
        from: https://github.com/happybeing/d3-fdg-svelte/tree/master?tab=readme-ov-file
    */
	import { onMount } from 'svelte';
	import { scaleLinear, scaleOrdinal } from 'd3-scale';
	import { zoom, zoomIdentity } from 'd3-zoom';
	// import { schemeCategory10 } from 'd3-scale-chromatic'; // Imported for color scheme
	import { select, selectAll } from 'd3-selection';
	import { drag } from 'd3-drag';
	import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
	import {
		A,
		Range,
		Helper,
		Label,
		Drawer,
		Button,
		CloseButton,
		P,
		Card,
		Input
	} from 'flowbite-svelte';
	import { Tabs, TabItem, List, Li, Search, Dropdown, DropdownItem } from 'flowbite-svelte';
	import {
		SearchOutline,
		ChevronDownOutline,
		CirclePlusSolid,
		CloseCircleSolid
	} from 'flowbite-svelte-icons';

	import { schemeCategory10 } from 'd3-scale-chromatic';
	import {
		InfoCircleSolid,
		ArrowRightOutline,
		AdjustmentsVerticalSolid
	} from 'flowbite-svelte-icons';
	import { sineIn } from 'svelte/easing';

	let d3 = {
		zoom,
		zoomIdentity,
		scaleLinear,
		scaleOrdinal,
		select,
		selectAll,
		drag,
		forceSimulation,
		forceLink,
		forceManyBody,
		forceCenter
	};

	// The data needed for the graph which will be provided by the parent component
	export let data;
	export let simulation_info;
	export let new_addition;

	// console.log('Data:', data);
	// console.log('Simulation info:', simulation_info);
	const epoch_num = simulation_info['epoch_num'];
	const snapshot_period = simulation_info['snapshot_period'];

	let curr_iteration = 0; // Current iteration

	let hoveredData = null;
	let neighbors = new Set(); // Set to store neighbors of the hovered node

	let svg;
	let width = 1000;
	let height = 800;
	const nodeRadius = 5;
	const padding = { top: 20, right: 40, bottom: 40, left: 25 };

	let graph = data[curr_iteration]; // Initial graph data
	let new_edges = new_addition[curr_iteration];
	// $: console.log('iteration:', curr_iteration, 'graph:', graph);
	let links = graph.links.map((d) => Object.create(d));
	let nodes = graph.nodes.map((d) => Object.create(d));

	// Search logic
	let searchId = '';
	let nodeInfo = null;
	let errorMessage = '';

	function searchNode() {
		const nodeId = parseInt(searchId);
		nodeInfo = graph.nodes.find((node) => node.id === nodeId);
		if (!nodeInfo) {
			errorMessage = `Node with ID ${nodeId} not found.`;
		} else {
			errorMessage = '';
			showConnectedEdges();
		}
	}

	let edgeSearchInput = '';
	let edgeInfo = null;
	let edgeErrorMessage = '';

	let connectedEdges = [];
	let showEdgesBool = false;
	$: console.log(showEdgesBool);

	function searchEdge() {
		const [sourceId, targetId] = edgeSearchInput.split(/[ ,]+/).map(Number);
		edgeInfo = graph.links.find(
			(link) =>
				(link.source === sourceId && link.target === targetId) ||
				(link.source === targetId && link.target === sourceId)
		);
		if (!edgeInfo) {
			edgeErrorMessage = `Edge between nodes ${sourceId} and ${targetId} not found.`;
		} else {
			edgeErrorMessage = '';
		}
	}

	function showConnectedEdges() {
		const nodeId = parseInt(searchId);
		connectedEdges = graph.links.filter((link) => link.source === nodeId || link.target === nodeId);
	}

	let currentColor = null;

	const scaleX = scaleLinear()
		.domain([0, width])
		.range([nodeRadius, width - nodeRadius]);
	const scaleY = scaleLinear()
		.domain([0, height])
		.range([nodeRadius, height - nodeRadius]);

	let transform = d3.zoomIdentity;
	let simulation;

	onMount(() => {
		initializeSimulation();
	});

	function initializeSimulation() {
		simulation = d3
			.forceSimulation(nodes)
			.force(
				'link',
				d3.forceLink(links).id((d) => d.id)
			)
			.force('charge', d3.forceManyBody().strength(-110))
			.force('center', d3.forceCenter(width / 2, height / 2))
			.alpha(0.3) // [0,1] how much movement, how fast
			.alphaDecay(0.05)
			.on('tick', simulationUpdate);

		d3.select(svg)
			.call(
				d3
					.drag()
					.container(svg)
					.subject(dragsubject)
					.on('start', dragstarted)
					.on('drag', dragged)
					.on('end', dragended)
			)
			.call(
				d3
					.zoom()
					.scaleExtent([1 / 10, 8])
					.on('zoom', zoomed)
			);
	}

	function updateGraph() {
		graph = data[curr_iteration];
		links = graph.links.map((d) => Object.create(d));
		nodes = graph.nodes.map((d) => Object.create(d));
		simulation.nodes(nodes);
		simulation.force('link').links(links);
		simulation
			.alpha(0.3) // [0,1] how much movement, how fast
			.alphaDecay(0.05) //[0, 1] the rate which alpha approaches zero. how long does it take btw simulation states
			.restart(); // Restart simulation with new data
	}

	function simulationUpdate() {
		simulation.tick();
		nodes.forEach((node) => {
			node.x = scaleX(node.x);
			node.y = scaleY(node.y);
		});
		nodes = [...nodes];
		links = [...links];
	}

	function zoomed(currentEvent) {
		transform = currentEvent.transform;
		simulationUpdate();
	}

	function dragsubject(currentEvent) {
		const node = simulation.find(
			transform.invertX(currentEvent.x),
			transform.invertY(currentEvent.y),
			nodeRadius
		);
		if (node) {
			node.x = transform.applyX(node.x);
			node.y = transform.applyY(node.y);
		}
		return node;
	}

	function dragstarted(currentEvent) {
		if (!currentEvent.active) simulation.alphaTarget(0.3).restart();
		currentEvent.subject.fx = transform.invertX(currentEvent.subject.x);
		currentEvent.subject.fy = transform.invertY(currentEvent.subject.y);
	}

	function dragged(currentEvent) {
		currentEvent.subject.fx = transform.invertX(currentEvent.x);
		currentEvent.subject.fy = transform.invertY(currentEvent.y);
	}

	function dragended(currentEvent) {
		if (!currentEvent.active) simulation.alphaTarget(0);
		currentEvent.subject.fx = null;
		currentEvent.subject.fy = null;
	}

	function resize() {
		({ width, height } = svg.getBoundingClientRect());
	}

	function getNeighbors(node) {
		const neighbors = new Set();
		links.forEach((link) => {
			if (link.source.id === node.id) {
				neighbors.add(link.target.id);
			} else if (link.target.id === node.id) {
				neighbors.add(link.source.id);
			}
		});
		return neighbors;
	}

	// Function to handle color change
	function updateColor(nodeState, newColor) {}
	// Inspect nodes off-canvas element
	let inspectNodesHidden = true;
	let editSizeandColorsHidden = true;
	let transitionParamsRight = {
		x: 320,
		duration: 200,
		easing: sineIn
	};

	const categoriesToInspect = [
		{
			label: 'Nodes'
		},
		{
			label: 'Edges'
		}
	];

	let selectedInspectCategory = 'Nodes';
</script>

<svelte:window on:resize={resize} />

<div class="center-container">
	<div class="grid-container">
		<div class="left-align">
			<Label>Current iteration: {curr_iteration}/{epoch_num - 1}</Label>
			<Range
				id="range-minmax"
				min="0"
				step={snapshot_period}
				max={epoch_num - 1}
				bind:value={curr_iteration}
				on:change={updateGraph}
			/>
		</div>
		<div class="right-align">
			<Button on:click={() => (inspectNodesHidden = false)}>Inspect nodes</Button>
		</div>
		<div class="right-align">
			<Button on:click={() => (editSizeandColorsHidden = false)}>Edit node size and colors</Button>
		</div>
	</div>
	<div>
		<svg id="graph1" bind:this={svg} {width} {height}>
			<g>
				{#each links as link}
					<line
						class="link"
						x1={link.source.x}
						y1={link.source.y}
						x2={link.target.x}
						y2={link.target.y}
						stroke-opacity={hoveredData
							? hoveredData.id === link.source.id || hoveredData.id === link.target.id
								? '.9'
								: '.1'
							: '.9'}
						transform="translate({transform.x} {transform.y}) scale({transform.k} {transform.k})"
					>
						<title>{link.source.id}</title>
					</line>
				{/each}

				{#each nodes as point}
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<circle
						class="node"
						r="5"
						fill="blue"
						cx={point.x}
						cy={point.y}
						opacity={hoveredData
							? hoveredData.id === point.id || neighbors.has(point.id)
								? '1'
								: '.3'
							: '1'}
						on:mouseover={() => {
							hoveredData = point;
							neighbors = getNeighbors(point);
						}}
						on:focus={() => {
							hoveredData = point;
							neighbors = getNeighbors(point);
						}}
						on:mouseleave={() => {
							hoveredData = null;
							neighbors = new Set();
						}}
						transform="translate({transform.x} {transform.y}) scale({transform.k} {transform.k})"
					>
						<title>{point.id}</title></circle
					>
				{/each}
			</g>
		</svg>
	</div>
</div>

<Drawer
	placement="right"
	transitionType="fly"
	transitionParams={transitionParamsRight}
	bind:hidden={inspectNodesHidden}
	id="sidebar1"
>
	<div class="flex items-center">
		<h5
			id="drawer-label"
			class="mb-4 inline-flex items-center text-base font-semibold text-gray-500 dark:text-gray-400"
		>
			<InfoCircleSolid class="me-2.5 h-5 w-5" />Inspect Nodes
		</h5>
		<CloseButton on:click={() => (inspectNodesHidden = true)} class="mb-4 dark:text-white" />
	</div>
	<p class="text-md mb-6 text-gray-500 dark:text-gray-400">
		Search to inspect nodes and edges in more detail:
	</p>
	<form class="my-4 flex">
		<div class="relative">
			<Button class="whitespace-nowrap rounded-e-none border border-e-0 border-primary-700">
				{selectedInspectCategory}
				<ChevronDownOutline class="ms-2.5 h-2.5 w-2.5" />
			</Button>
			<Dropdown classContainer="w-40">
				{#each categoriesToInspect as { label }}
					<DropdownItem
						on:click={() => {
							selectedInspectCategory = label;
						}}
						class={selectedInspectCategory === label ? 'underline' : ''}
					>
						{label}
					</DropdownItem>
				{/each}
			</Dropdown>
		</div>
		<div>
			{#if selectedInspectCategory === 'Nodes'}
				<Search size="md" class="rounded-none py-2.5" placeholder="123" bind:value={searchId} />
			{:else}
				<Search
					size="md"
					class="rounded-none py-2.5"
					placeholder="123, 456"
					bind:value={edgeSearchInput}
				/>
			{/if}
		</div>
		<Button
			on:click={() => {
				if (selectedInspectCategory === 'Nodes') {
					searchNode();
				} else if (selectedInspectCategory === 'Edges') {
					searchEdge();
				}
			}}
			class="rounded-s-none !p-2.5"
		>
			<SearchOutline class="h-5 w-5" />
		</Button>
	</form>

	{#if selectedInspectCategory === 'Nodes'}
		<Helper class="text-gray-600">Search: Enter node ID</Helper>
		<Card class="my-4">
			<h6 class="mb-2 font-bold tracking-tight text-gray-900 dark:text-white">Node Info</h6>
			{#if nodeInfo}
				<List tag="ul" class="space-y-1 dark:text-gray-400">
					{#each Object.entries(nodeInfo) as [key, value]}
						<Li><strong>{key}:</strong> {value}</Li>
					{/each}
				</List>
				{#if showEdgesBool}
					<A on:click={() => (showEdgesBool = !showEdgesBool)} class="mt-2"
						><CloseCircleSolid class="mr-2" />Hide Connected Edges</A
					>
				{:else}
					<A on:click={() => (showEdgesBool = !showEdgesBool)} class="mt-2"
						><CirclePlusSolid class="mr-2" />Show Connected Edges</A
					>
				{/if}

				{#if connectedEdges.length > 0 && showEdgesBool}
					<List tag="ul" class="ml-2 mt-2 space-y-1 dark:text-gray-400">
						{#each connectedEdges as edge}
							<Li><strong>Source:</strong> {edge.source}, <strong>Target:</strong> {edge.target}</Li
							>
						{/each}
					</List>
				{/if}
			{:else if errorMessage}
				<P class="text-red-500">{errorMessage}</P>
			{/if}
		</Card>
	{:else if selectedInspectCategory === 'Edges'}
		<Helper>Search: Enter source and target IDs (separated by space or comma)</Helper>
		<Card class="my-4">
			<h6 class="mb-2 font-bold tracking-tight text-gray-900 dark:text-white">Edge Info</h6>
			{#if edgeInfo}
				<List tag="ul" class="space-y-1 dark:text-gray-400">
					{#each Object.entries(edgeInfo) as [key, value]}
						<Li><strong>{key}:</strong> {value}</Li>
					{/each}
				</List>
			{:else if edgeErrorMessage}
				<P class="text-red-500">{edgeErrorMessage}</P>
			{/if}
		</Card>
	{/if}

	<!-- <div class="grid grid-cols-2 gap-4">
		<Button color="light" href="/">Learn more</Button>
		<Button href="/" class="px-4">Get access <ArrowRightOutline class="ms-2 h-5 w-5" /></Button>
	</div> -->
</Drawer>

<Drawer
	placement="right"
	transitionType="fly"
	transitionParams={transitionParamsRight}
	bind:hidden={editSizeandColorsHidden}
	id="sidebar2"
>
	<div class="flex items-center">
		<h5
			id="drawer-label"
			class="mb-4 inline-flex items-center text-base font-semibold text-gray-500 dark:text-gray-400"
		>
			<AdjustmentsVerticalSolid class="me-2.5 h-5 w-5" />Graph settings
		</h5>
		<CloseButton on:click={() => (editSizeandColorsHidden = true)} class="mb-4 dark:text-white" />
	</div>
	<P class="mb-4">Adjust the color and size of the nodes.</P>

	<div>
		<Tabs tabStyle="underline">
			<TabItem open title="Color">
				<P>Changes will be applied on input.</P>
				<h6 class="mb-2 mt-4 inline-flex items-center text-base font-semibold dark:text-gray-400">
					Node types:
				</h6>
			</TabItem>
			<TabItem title="Size">Here change sizes</TabItem>
		</Tabs>
	</div>

	<div class="my-4 grid grid-cols-2 gap-4">
		<Button class="px-4">Apply <ArrowRightOutline class="ms-2 h-5 w-5" /></Button>
	</div>
</Drawer>

<style>
	svg {
		float: left;
		border: 1px solid black;
	}

	circle {
		stroke: #060606;
		stroke-width: 1;
	}

	line {
		stroke: #999;
	}

	.center-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.grid-container {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 1rem;
		align-items: center;
	}

	.left-align {
		justify-self: start;
	}

	.right-align {
		justify-self: end;
	}
</style>
