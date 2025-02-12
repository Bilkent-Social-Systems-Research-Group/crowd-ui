<script>
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/tauri';
	import {
		project,
		simulationName,
		simulationDirectory,
		nodeOrEdge,
		runNumber
	} from '$lib/stores/projects';
	import { Button, Heading, Modal, P, Span, Spinner } from 'flowbite-svelte';
	import NetworkViz from './NetworkViz.svelte';
	import EdgeSimViz from './EdgeSimViz.svelte';
	import { ExclamationCircleOutline } from 'flowbite-svelte-icons';

	// A boolean which will set to true when we are loading the simulation data
	// by sending a request to backend side
	let loadingSimulation = true;
	let simulationGraph;
	let simulationInfo;
	let addedEdges;

	let errorModalOpen = false;
	let latestError = 'error';

	onMount(async () => {
		loadingSimulation = true;
		await loadSimulationGraph();
		await loadSimulationInfo();

		if ($nodeOrEdge === 'edge') {
			await loadAddedEdges();
		}

		loadingSimulation = false;
	});

	async function loadSimulationInfo() {
		try {
			let result = await invoke('run_python_load_simulation_info', {
				project_name: $project.name,
				simulation_directory: $simulationDirectory
			});

			simulationInfo = JSON.parse(result);

			// console.log('Simulation info in JS:', result);

			return result;
		} catch (error) {
			console.error('Error loading simulation info:', error);
			latestError = error;
			errorModalOpen = true;
		}
	}
	async function loadSimulationGraph() {
		try {
			let result = await invoke('run_python_load_simulation_graph', {
				project_name: $project.name,
				simulation_directory: $simulationDirectory
			});

			simulationGraph = JSON.parse(result);
			// console.log('Simulation graph in JS:', result);

			return result;
		} catch (error) {
			console.error('Cannot load simulation graph', error);
			latestError = error;
			errorModalOpen = true;
		}
	}

	async function loadAddedEdges() {
		try {
			let result = await invoke('run_python_load_added_edges', {
				project_name: $project.name,
				simulation_directory: $simulationDirectory
			});

			addedEdges = JSON.parse(result);
			// console.log('Added edges in JS:', addedEdges);
		} catch (error) {
			console.error('Cannot load added edges', error);
			latestError = error;
			errorModalOpen = true;
		}
	}
</script>

{#if loadingSimulation}
	<div class="text-center">
		<Heading tag="h1" class="mb-4" customSize="text-3xl font-bold  md:text-4xl lg:text-5xl">
			Network
		</Heading>
		<P class="mb-2 mt-2 text-center text-lg dark:text-gray-400 sm:px-16 lg:text-xl xl:px-48">
			Project: <Span gradient>{$project.name}</Span>
		</P>
		<P class="mb-2 mt-1 text-center text-lg dark:text-gray-400 sm:px-16 lg:text-xl xl:px-48">
			Simulation: <Span gradient>{$simulationName}-{$runNumber}</Span>
		</P>
		<Spinner class="mt-4" size="10" />
		<P class="my-2 text-center text-gray-400 dark:text-gray-400 sm:px-16 lg:text-lg xl:px-24">
			Loading the project
		</P>
	</div>
{:else}
	<div class="text-center">
		<Heading tag="h1" class="mb-4" customSize="text-3xl font-bold  md:text-4xl lg:text-5xl">
			Network
		</Heading>
		<P class="mb-1 mt-2 text-center text-lg dark:text-gray-400 sm:px-16 lg:text-xl xl:px-48">
			Project: <Span gradient>{$project.name}</Span>
		</P>
		<P class="mb-2 mt-1 text-center text-lg dark:text-gray-400 sm:px-16 lg:text-xl xl:px-48">
			Simulation: <Span gradient>{$simulationName}-{$runNumber}</Span>
		</P>
	</div>
	{#if simulationGraph && simulationInfo}
		{#if $nodeOrEdge === 'node' || $nodeOrEdge === 'custom'}
			<NetworkViz data={simulationGraph} simulation_info={simulationInfo} />
		{:else if $nodeOrEdge === 'edge' && addedEdges}
			<EdgeSimViz
				data={simulationGraph}
				simulation_info={simulationInfo}
				new_addition={addedEdges}
			/>
		{/if}
	{:else}
		<div class="text-center">
			<Spinner class="mt-4" size="10" />
			<P class="my-2 text-center text-gray-400 dark:text-gray-400 sm:px-16 lg:text-lg xl:px-24">
				Loading simulation data
			</P>
		</div>
	{/if}
{/if}

<Modal bind:open={errorModalOpen} size="xs" autoclose>
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
		<h3 class="mb-1 text-xl font-normal text-gray-800 dark:text-gray-400">Error:</h3>
		<P class="mb-5 text-center text-lg font-normal text-gray-700 dark:text-gray-400"
			>{latestError}</P
		>
		<Button
			color="red"
			class="me-2"
			on:click={() => {
				errorModalOpen = false;
			}}>Try again</Button
		>
	</div>
</Modal>
