import 'colors'
import { readFileSync, createWriteStream, unlinkSync } from 'fs'
import axios from 'axios'
import ProgressBar from 'progress'
import AdmZip from 'adm-zip'
import { spawn } from 'child_process'
const version = JSON.parse(readFileSync('./package.json')).version
function titleGen(text) {
    console.log('-'.repeat(text.length * 3).green)
    // cycle through every line
    for (let line of text.split('\n')) {
        // center the line
        line = line.padStart((text.length - line.length) / 2 + line.length)
        console.log(' '.repeat(text.length) + line.rainbow)
    }
    console.log('-'.repeat(text.length * 3).green)
}

function main() {
    titleGen(`ADB Installer v${version}\nBy Dumpy`)
    console.log("Downloading ADB...".rainbow)
    console.log("Detecting OS...".rainbow)
    // detect the OS
    if (process.platform === 'win32') {
        console.log("OS: Windows".rainbow)
        console.log("Downloading...".rainbow)
        download('https://dl.google.com/android/repository/platform-tools-latest-windows.zip')
        // add to path
        console.log("Adding to path...".rainbow)
        spawn('setx', ['path', '%path%;%cd%\\platform-tools'])
        console.log("Done!".rainbow)
    } else if (process.platform === 'darwin') {
        console.log("OS: macOS".rainbow)
        console.log("Downloading...".rainbow)
        download('https://dl.google.com/android/repository/platform-tools-latest-darwin.zip')
        // add to path
        console.log("Adding to path...".rainbow)
        spawn('echo', ['export PATH="$PATH:$PWD/platform-tools" >> ~/.bash_profile'])
        console.log("Done!".rainbow)
    } else {
        console.log("OS: Linux".rainbow)
        console.log("Downloading...".rainbow)
        download('https://dl.google.com/android/repository/platform-tools-latest-linux.zip')
        // add to path
        console.log("Adding to path...".rainbow)
        console.log("Detecting shell...".rainbow)
        // detect the shell
        if (process.env.SHELL.includes('bash')) {
            console.log("Shell: bash".green)
            spawn('echo', ['export PATH="$PATH:$PWD/platform-tools" >> ~/.bashrc'])
        } else if (process.env.SHELL.includes('zsh')) {
            console.log("Shell: zsh".green)
            spawn('echo', ['export PATH="$PATH:$PWD/platform-tools" >> ~/.zshrc'])
        } else {
            console.log("Shell: unknown".red)
            console.log("Please add the following to your shell config file:".red)
            console.log("export PATH=\"$PATH:$PWD/platform-tools\"".green)
        }
        console.log("Done!".red)
        console.log("Checking if user is in plugdev group...".rainbow)
        // check if the user is in the plugdev group
        if (process.env.GROUPS.includes('plugdev')) {
            console.log("User is in plugdev group".green)
        }
        else {
            console.log("User is not in plugdev group".red)
            spawn('sudo', ['usermod', '-aG', 'plugdev', process.env.USER])
            console.log("Added user to plugdev group".green)
        }

    }
    console.log("Please restart your computer for the changes to take effect.".red)
}
function download(link) {
    // download the file
    axios.get(link, { responseType: 'stream' }).then(res => {
        // create a write stream
        const writeStream = createWriteStream('adb.zip')
        // pipe the response to the write stream
        res.data.pipe(writeStream)
        const progressBar = new ProgressBar('Downloading [:bar] :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 50,
            total: parseInt(res.headers['content-length'])

        })
        // update the progress bar
        res.data.on('data', chunk => progressBar.tick(chunk.length))

        // when the download is complete, extract it
        writeStream.on('finish', () => {
            process.stdout.clearLine()
            process.stdout.cursorTo(0)
            console.log("Download complete!".red)
            extract('adb.zip')
        })
    })
}
function extract(file) {
    console.log("Extracting...".red)
    // extract the file
    const zip = new AdmZip(file)
    zip.extractAllTo('./', true)
    console.log("Extraction complete!".green)
    console.log("Cleaning up...".red)
    // delete the zip file
    unlinkSync(file)
}

main()