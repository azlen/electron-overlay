
const { ipcRenderer, contextBridge } = require('electron')
const Interpreter = require('js-interpreter')
const fs = require('fs')

let isCapturingAllEvents = false

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
	ipcRenderer.on('mouse-pos', (event, arg) => {
		let interactiveElement = (document.elementFromPoint(arg.x, arg.y) || document.body).closest('[data-interactive]')
		let isInteractive = interactiveElement != undefined || isCapturingAllEvents

		const mouseEvent = new CustomEvent('mouseGlobal', { detail: { x: arg.x, y: arg.y } });
		window.dispatchEvent(mouseEvent)

		if(isInteractive) {
			ipcRenderer.send('setInteractive', true)
		} else {
			ipcRenderer.send('setInteractive', false)
		}
	})
})

const safeChannel = (channel) => 'app.' + channel

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
		setCaptureAllEvents: (bool) => {
			isCapturingAllEvents = bool
		},

		// these are just helper functions to communicate between
		// the code running in the browser and the main.js electron process
		// can be helpful if you want to use node modules safely?
        send: (channel, data) => {
            ipcRenderer.send(safeChannel(channel), data);
        },
		sendSync: (channel, data) => {
            return ipcRenderer.sendSync(safeChannel(channel), data);
        },
        receive: (channel, func) => {
            ipcRenderer.on(safeChannel(channel), (event, ...args) => func(...args));
        },

		// this doesn't send to main.js
		// and instead calls api function defined down below if it exists
		call: (channel, data) => {
			if(apiFunctions.hasOwnProperty(channel)) {
				return apiFunctions[channel](data)
			}
		}
    }
);

let apiFunctions = {
	
}