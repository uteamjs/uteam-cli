const colors = require('colors')

const _getColor = {
    'help': 'yellow',
    'info': 'green',
    'debug': 'yellow',
    'error': 'red',
    'warn': 'magenta'
}

exports.log = (tp, msg) => tp === 'plain' ?
    console.log(msg) :
    console.log(colors[_getColor[tp] || tp || 'reset'](msg))

exports.colors = colors