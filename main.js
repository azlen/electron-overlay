// Modules to control application life and create native browser window
const { app, BrowserWindow, globalShortcut, screen, ipcMain, Menu, Tray } = require('electron')
const path = require('path')

// Hides overlay from dock on MacOS
// Not tested yet if this works
// Hopefully it will prevent this app from showing up in the CMD+tab app-switcher
// See: https://github.com/electron/electron/issues/6283
// I mean, he's reporting it as a bug but I actually want that functionality
if(app.dock) app.dock.hide()

function createWindow () {
	// This will only cover one display
	// Could probably be made to cover multiple displays with some tweaking
	const { x: offsetX, y: offsetY, width, height } = screen.getPrimaryDisplay().workArea
	console.log(screen.getPrimaryDisplay())

	// Create the browser window
	const mainWindow = new BrowserWindow({
		width, 
		height,

		frame: false,
		transparent: true,
		webPreferences: {
			backgroundThrottling: false,
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
		},
		resizable: false,

		// hides shadow on macOS
		hasShadow: false,
	})


	// send mouse position to preload.js
	// which will then check if the mouse is overlapping any interactive element
	// and decide whether to make window focused and interactive
	setInterval(() => {
		let { x: mouseX, y: mouseY } =  screen.getCursorScreenPoint()
		mainWindow.webContents.send('mouse-pos', { x: mouseX - offsetX, y: mouseY - offsetY })
	}, 15)

	// by default we want to ignore mouse events until we hover over interactive element
	mainWindow.setIgnoreMouseEvents(true)

	// a true overlay is on top of all your other windows
	mainWindow.setAlwaysOnTop(true, 'screen');

	// when receiving message back from preload.js
	// set whether or not window is accepting mouse events
	// and if it is, focus it
	ipcMain.on('setInteractive', (event, interactive) => {
		// let value = !arg && !mouseEvents
		mainWindow.setIgnoreMouseEvents(!interactive)
		
		if(interactive) { mainWindow.focus() }
		else { mainWindow.blur() }
	})

	// load the index.html of the app.
	mainWindow.loadFile('index.html')
	mainWindow.maximize()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let tray = null
app.whenReady().then(() => {
	// setTimeout here is important
	// at least on linux when I run, it doesn't activate the transparency of the window
	// unless I add a short timeout
	// probably can be shorter than 1000? I haven't really played around with this too much
	setTimeout(() => {
		createWindow()
	
		app.on('activate', function () {
			// On macOS it's common to re-create a window in the app when the
			// dock icon is clicked and there are no other windows open.
			if (BrowserWindow.getAllWindows().length === 0) createWindow()
		})
	}, 1000)
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
})


ipcMain.on('log', (event, content) => {
	console.log(content)
})

// If you have any api functions you want to be able to access from renderer
// Then you can define them here and call `api.send('test', data)` or `api.sendSync('test', data)`
ipcMain.on('api.test', (event, data) => {
	// create your own API functions
	return null
})