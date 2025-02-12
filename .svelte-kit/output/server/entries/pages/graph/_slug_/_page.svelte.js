import { c as create_ssr_component, d as subscribe, v as validate_component, i as escape } from "../../../../chunks/ssr.js";
import "@tauri-apps/api/tauri";
import { a as simulationDirectory, p as project, n as nodeOrEdge, s as simulationName, r as runNumber } from "../../../../chunks/projects.js";
import { B as Button } from "../../../../chunks/Button.js";
import { S as Span, M as Modal, E as ExclamationCircleOutline } from "../../../../chunks/ExclamationCircleOutline.js";
import { S as Spinner } from "../../../../chunks/Spinner.js";
import { H as Heading } from "../../../../chunks/Heading.js";
import { P } from "../../../../chunks/P.js";
import "d3-zoom";
import "file-saver";
import "gifshot";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_simulationDirectory;
  let $project, $$unsubscribe_project;
  let $$unsubscribe_nodeOrEdge;
  let $simulationName, $$unsubscribe_simulationName;
  let $runNumber, $$unsubscribe_runNumber;
  $$unsubscribe_simulationDirectory = subscribe(simulationDirectory, (value) => value);
  $$unsubscribe_project = subscribe(project, (value) => $project = value);
  $$unsubscribe_nodeOrEdge = subscribe(nodeOrEdge, (value) => value);
  $$unsubscribe_simulationName = subscribe(simulationName, (value) => $simulationName = value);
  $$unsubscribe_runNumber = subscribe(runNumber, (value) => $runNumber = value);
  let errorModalOpen = false;
  let latestError = "error";
  let $$settled;
  let $$rendered;
  let previous_head = $$result.head;
  do {
    $$settled = true;
    $$result.head = previous_head;
    $$rendered = `${`<div class="text-center">${validate_component(Heading, "Heading").$$render(
      $$result,
      {
        tag: "h1",
        class: "mb-4",
        customSize: "text-3xl font-bold  md:text-4xl lg:text-5xl"
      },
      {},
      {
        default: () => {
          return `Network`;
        }
      }
    )} ${validate_component(P, "P").$$render(
      $$result,
      {
        class: "mb-2 mt-2 text-center text-lg dark:text-gray-400 sm:px-16 lg:text-xl xl:px-48"
      },
      {},
      {
        default: () => {
          return `Project: ${validate_component(Span, "Span").$$render($$result, { gradient: true }, {}, {
            default: () => {
              return `${escape($project.name)}`;
            }
          })}`;
        }
      }
    )} ${validate_component(P, "P").$$render(
      $$result,
      {
        class: "mb-2 mt-1 text-center text-lg dark:text-gray-400 sm:px-16 lg:text-xl xl:px-48"
      },
      {},
      {
        default: () => {
          return `Simulation: ${validate_component(Span, "Span").$$render($$result, { gradient: true }, {}, {
            default: () => {
              return `${escape($simulationName)}-${escape($runNumber)}`;
            }
          })}`;
        }
      }
    )} ${validate_component(Spinner, "Spinner").$$render($$result, { class: "mt-4", size: "10" }, {}, {})} ${validate_component(P, "P").$$render(
      $$result,
      {
        class: "my-2 text-center text-gray-400 dark:text-gray-400 sm:px-16 lg:text-lg xl:px-24"
      },
      {},
      {
        default: () => {
          return `Loading the project`;
        }
      }
    )}</div>`} ${validate_component(Modal, "Modal").$$render(
      $$result,
      {
        size: "xs",
        autoclose: true,
        open: errorModalOpen
      },
      {
        open: ($$value) => {
          errorModalOpen = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `<div class="text-center">${validate_component(ExclamationCircleOutline, "ExclamationCircleOutline").$$render(
            $$result,
            {
              class: "mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200"
            },
            {},
            {}
          )} <h3 class="mb-1 text-xl font-normal text-gray-800 dark:text-gray-400" data-svelte-h="svelte-2e0vep">Error:</h3> ${validate_component(P, "P").$$render(
            $$result,
            {
              class: "mb-5 text-center text-lg font-normal text-gray-700 dark:text-gray-400"
            },
            {},
            {
              default: () => {
                return `${escape(latestError)}`;
              }
            }
          )} ${validate_component(Button, "Button").$$render($$result, { color: "red", class: "me-2" }, {}, {
            default: () => {
              return `Try again`;
            }
          })}</div>`;
        }
      }
    )}`;
  } while (!$$settled);
  $$unsubscribe_simulationDirectory();
  $$unsubscribe_project();
  $$unsubscribe_nodeOrEdge();
  $$unsubscribe_simulationName();
  $$unsubscribe_runNumber();
  return $$rendered;
});
export {
  Page as default
};
