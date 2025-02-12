<script>
	//This component gets all the recent simulations and displays it in a list format

	import { Button, A, Modal, P } from 'flowbite-svelte';
	import {
		CirclePlusSolid,
		CloseCircleSolid,
		ExclamationCircleOutline
	} from 'flowbite-svelte-icons';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		TableSearch
	} from 'flowbite-svelte';

	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/tauri';

	import { project, simulationDirectory, simulationName, runNumber } from '$lib/stores/projects';
	import { generateSlug } from '$lib/utils';

	let allSimulations = [];
	let subsimulationsInfo = {};

	let errorModalOpen = false;
	let latestError = 'error';

	onMount(async () => {
		await run_python_list_simulations(generateSlug($project.name));
	});

	async function run_python_list_simulations(project_name) {
		try {
			const result = await invoke('run_python_list_simulations', { project_name });
			allSimulations = JSON.parse(result);
		} catch (error) {
			console.error('Error running Python list simulations:', error);
			latestError = error;
			errorModalOpen = true;
		}
	}

	async function run_python_get_sub_simulations_info(item) {
		// let parent_dir_name = getFileName(item.start_time);
		let parent_dir_name = item.directory_name;
		console.log('parent dir:', parent_dir_name, 'project_name', generateSlug($project.name));
		try {
			const result = await invoke('run_python_get_sub_simulations_info', {
				project_name: generateSlug($project.name),
				simulation_directory: parent_dir_name
			});

			// console.log(result);
			//now we have a dictionary in the following format: {sim_no: info_dict}
			subsimulationsInfo = JSON.parse(result);
		} catch (error) {
			console.error('Error running Python get sub simulations info', error);
			latestError = error;
			errorModalOpen = true;
		}
	}

	let showAllSimulations = false;

	function toggleShow() {
		showAllSimulations = !showAllSimulations;
	}

	let searchTerm = '';

	$: filteredItems = allSimulations.filter(
		(item) => item.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
	);

	let openRow = null;

	async function toggleRow(i) {
		if (openRow === i) {
			openRow = null;
		} else {
			await run_python_get_sub_simulations_info(i);
			openRow = i;
		}
	}

	//Not used because of recent changes, may remove
	function formattedDate(directory_name) {
		// Extract the date and time parts
		const [datePart, timePart] = directory_name.split('=');

		// Format and return the desired string
		// return `${datePart} ${hours}:${minutes}:${seconds}`;
		return `${datePart} ${timePart}`;
	}

	function setSimulationDirectory(directory_name) {
		simulationDirectory.set(directory_name);
	}
</script>

{#if !showAllSimulations}
	<div class="mx-20 my-4">
		<A on:click={toggleShow}><CirclePlusSolid class="h-6 w-6" /> Show all simulations</A>
	</div>
{:else}
	<div class="mx-20 my-4">
		<A on:click={toggleShow}><CloseCircleSolid class="h-6 w-6" />Close all simulations</A>
		<div class="my-2">
			<TableSearch placeholder="Search by name" hoverable={true} bind:inputValue={searchTerm}>
				<TableHead class="bg-indigo-400 text-white">
					<TableHeadCell>Date</TableHeadCell>
					<TableHeadCell>Name</TableHeadCell>
					<TableHeadCell>Epochs</TableHeadCell>
					<TableHeadCell>States</TableHeadCell>
					<TableHeadCell>Batch number</TableHeadCell>
				</TableHead>
				<TableBody tableBodyClass="divide-y">
					{#each filteredItems as item}
						<TableBodyRow
							hoverable={true}
							class="hover:cursor-pointer"
							on:click={() => toggleRow(item)}
						>
							<TableBodyCell>{formattedDate(item.directory_name)}</TableBodyCell>
							<TableBodyCell>{item.name.slice(0, -2)}</TableBodyCell>
							<TableBodyCell>{item.epoch_num}</TableBodyCell>
							<TableBodyCell>{item.states}</TableBodyCell>
							<TableBodyCell>{item.child_sim_count}</TableBodyCell>
						</TableBodyRow>

						<!-- Sub-table rendered conditionally -->
						{#if openRow === item}
							<TableBodyRow class="p-0">
								<TableBodyCell colspan="5" class="p-7">
									<div class="overflow-x-auto">
										<Table class="w-full">
											<TableHead class="bg-indigo-100">
												<TableHeadCell>Name</TableHeadCell>
												<TableHeadCell>Start Time</TableHeadCell>
												<TableHeadCell>End Time</TableHeadCell>
												<TableHeadCell>Simulation Duration</TableHeadCell>
												<TableHeadCell></TableHeadCell>
											</TableHead>
											<TableBody>
												{#each Object.entries(subsimulationsInfo) as [subSimID, subSim]}
													<TableBodyRow>
														<TableBodyCell>{subSim.name}</TableBodyCell>
														<TableBodyCell>{subSim.start_time}</TableBodyCell>
														<TableBodyCell>{subSim.end_time}</TableBodyCell>
														<TableBodyCell>{subSim.simulation_duration}</TableBodyCell>
														<TableBodyCell>
															<a
																href={'/graph/' + generateSlug(item.name) + '-' + subSimID}
																on:click={() => {
																	setSimulationDirectory(item.directory_name);
																	simulationName.set(generateSlug(item.name.slice(0, -2)));
																	runNumber.set(subSimID);
																}}
																class="font-medium text-primary-600 hover:underline dark:text-primary-500"
															>
																Go
															</a>
														</TableBodyCell>
													</TableBodyRow>
												{/each}
											</TableBody>
										</Table>
									</div>
								</TableBodyCell>
							</TableBodyRow>
						{/if}
					{/each}
				</TableBody>
			</TableSearch>
		</div>
	</div>
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
