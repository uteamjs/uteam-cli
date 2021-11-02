#!/usr/bin/env node

/*
    @uteamjs/cli client 
*/

const commandLineUsage = require('command-line-usage')
const commandLineArgs = require('command-line-args')

const optionDefinitions = [
    {
        name: 'application',
        description: 'Application <name> to be generated.',
        alias: 'a',
        type: String,
    },
    {
        name: 'packages',
        description: 'Package <names...> added to application.',
        alias: 'p',
        multiple: true,
        type: String,
    },
    {
        name: 'generate',
        description: 'Generate code after adding packages.',
        alias: 'g',
        type: String,
    },
    {
        name: 'template',
        description: 'Tempalate <path> used to create application or packages.\n' +
            'Default @uteamjs/template/react-application\n',
        alias: 't',
        type: String,
    },
    {
        name: 'help',
        description: 'Display this usage guide.\n\n<YAML Generation>',
        alias: 'h',
        type: Boolean
    },
    {
        name: 'yaml',
        description: 'YAML definition file, default app.yaml.',
        alias: 'y',
        type: String,
    },
    {
        name: 'component',
        description: 'Component template',
        type: String,
    },
    {
        name: 'initComponent',
        description: 'Init template',
        type: String,
    },
    {
        name: 'exportComponent',
        description: 'Export template',
        type: String,
    },
    {
        name: 'indexfile',
        description: 'Index File template',
        type: String,
    },
    {
        name: 'update',
        description: 'Upate template name',
        type: String,
    }



]

const internal = [
    {
        name: 'local',
        alias: 'l',
        type: Boolean
    }
]

const usage = commandLineUsage([
    {
        header: 'uteam - CLI',
        content: 'Create and generate {bold @uteamjs} applications from YAML definition.' +
            '\nCopyright © 2021 U Team, Inc.' +
            '\nPlease visit {underline https://u.team} for details.'
    },
    {
        header: 'Ussage',
        content: [
            '$ uteam <command> [--<options> [string]]'
        ]
    },
    {
        header: '<command>',
        content: [
            { name: 'create', summary: 'Create Application or Packages' },
            { name: 'remove', summary: 'Remove Packages' },
            { name: 'generate', summary: 'Generate React application from YAML' },
            { name: 'template', summary: 'Template --update <name> to latest version' },
            
        ]
    },
    {
        header: '<options>',
        optionList: optionDefinitions
    },
    {
        header: 'Examples',
        content: [
            {
                desc: '1. Create application',
                example: '$ uteam create --application my-cms'
            },
            {
                desc: '2. Create packages ',
                example: '$ cd ...your/application'
            },
            {
                example: '$ uteam create --package my-package package2'
            },
            {
                desc: '3. Generate application',
                example: '$ uteam generate'
            },
            {
                desc: '-  with specified yaml file',

                example: '$ uteam generate --yaml myApp'
            },
        ]
    }
])

let main, opt

try {
    main = commandLineArgs([
        { name: 'command', defaultOption: true }
    ], { stopAtFirstUnknown: true })

    opt = commandLineArgs([...optionDefinitions, ...internal], { argv: main._unknown || [] })

} catch (e) {
    console.log(e.message)
    process.exit()
}

if (main.command === 'help') {
    console.log(usage)
    process.exit()
}

const host = opt.local ? 'ws://localhost:8802' : 'https://cli.u.team'

const io = require("socket.io-client")
const { ensureDir } = require('fs-extra')
const { dirname } = require('path')
const { log, colors } = require('./util')
//const yaml = require('yaml')

const socket = io.connect(host, {
    reconnect: true,
    timeout: 5000
})

const fs = require('fs')
const os = require('os')

const { createApplication, removeApplication, template } = require('./createremove')

const saving = {}

log('bold', 'u.team cli - 1.0.1')

const readFile = (path, isExit = false) => {
    try {
        return fs.readFileSync(path, 'utf-8')

    } catch (err) {
        log('error', err.message)
        if (isExit)
            process.exit()
        return null
    }
}

const run = () => {
    log('cyan', 'connecting to ' + host)
    switch (main.command) {
        case 'generate':
            // load yaml 
            try {
                const yaml = readFile(opt.yaml || 'app.yaml')

                let filepage = opt.component,
                    fileindex = opt.indexfile,
                    fileexport = opt.exportComponent,
                    fileinit = opt.initComponent

                const m = yaml.match(/header:(.|\n)*template:\s*(('|")(\S*)('|")|(\S*))/i)
                const template = m ? m[4] || m[2] : '@uteamjs/template/react-redux'

                log('yellow', 'Using template: ' + template)

                fileexport = fileexport || require.resolve(template + '/exports')
                filepage = filepage || require.resolve(template + '/page')
                fileindex = fileindex || require.resolve(template + '/module')
                fileinit = fileinit || require.resolve(template + '/init')

                const exports = readFile(fileexport)
                const page = readFile(filepage)
                const index = readFile(fileindex)
                const init = readFile(fileinit)

                socket.emit('generate', yaml, page, exports, init, index)

            } catch (err) {
                console.log(err)
                log('error', err.message)
                process.exit()
            }
            break

        case 'help':
            socket.emit('help')
            break;

        case 'update':
            socket.emit('update', readFile(os.homedir() + '/checksum', true), opt.restart)
            break;

        case 'log':
            socket.emit('log', readFile(os.homedir() + '/checksum', true))
            break;

        case 'restart':
            socket.emit('restart', readFile(os.homedir() + '/checksum', true))
            //process.exit()
            break;

        case 'stop':
            log('info', 'stop ...')
            socket.emit('stop', readFile(os.homedir() + '/checksum', true))
            break;

        case 'template':
            template(opt)
            break;

        case 'create':
            createApplication(opt)
            break;

        case 'remove':
            removeApplication(opt)
            break;

        default:
            if (!main.command)
                console.log(usage)

            else
                log('error', 'Invalid command: ' + main.command)
            process.exit()
    }
}

socket.on('connect', run)

// message -
socket.on('message', (tp, msg, isBreak = true) => {
    log(tp, msg)
    if (isBreak && tp.match(/error|help/))
        process.exit()
})

// file -
socket.on('save', (file, obj, isInit) => {
    saving[file] = true
    ensureDir(dirname('./' + file), err => {
        if (err) throw err
        try {
            //console.log(isInit, file, fs.existsSync(file))
            if (isInit && fs.existsSync(file)) {
                log('info', 'Skipping ... ' + file)
                delete saving[file]

            } else {
                fs.writeFileSync(file, obj)
                delete saving[file]
                log('info', 'File created: ' + colors.brightGreen(file))
            }
        } catch (err) {
            log('error', err.name + ': ' + err.message)
        }
    })
})

const isSaving = () => {
    const items = Object.values(saving)
    for (let i in items)
        if (items[i])
            return true
    return false
}

// Exit process
socket.on('end', (tp, msg) => setInterval(() => {
    if (!isSaving()) {
        if (tp) log(tp, msg)
        process.exit()
    }
}, 100))

socket.io.on('error', err => {

    if (err.message === 'timeout') {
        log('error', 'Error: Connection failed! server not available, please try again later.')
    } else if (err.message === 'xhr poll error')
        log('warn', 'Server stopped.')
    else
        log('error', err.name + ': ' + err.message)

    process.exit()
})