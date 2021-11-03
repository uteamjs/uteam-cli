const { copy } = require("fs-extra")
const { log, colors } = require('./util')
const { exec } = require("child_process")
const { series, eachSeries } = require("async")
const { join, dirname } = require('path')
const { readFileSync, writeFileSync, rmSync, stat } = require('fs')

const lg = msg => cb => {
  log('info', msg)
  cb()
}

const iff = (cond, func) => cb => {
  if (cond)
    try {
      func(cb)

    } catch (e) {
      cb(e.message)
    }
  else
    cb()
}

const clone = (src, desc, cb) => {
  stat(desc, (err, st) => {
    if (err === null)
      cb(`Folder '${desc}' already exit`)
    else
      copy(dirname(src), desc, cb)
  })
}

const replaceName = (path, name, cb) => {
  const _path = join(path, 'package.json')
  const json = readFileSync(_path, 'utf-8')

  writeFileSync(_path, json.replace(/replace_name/, name))
  cb()
}

const run = (cmd, func, isnotlog) => cb => {
  const _progess = setInterval(() => {
    process.stdout.write('.')
  }, 500)

  exec(cmd, (err, stdout) => {
    clearInterval(_progess)
    
    if (err) {
      if(cb)
        cb(err)
      
      else {
        log('error', err)
        if(func)
          func(err)
      }
    
    } else {
      if(!isnotlog)
        log('info', stdout) 

      // Assume call back through function first
      if(func)
        func(stdout, cb)
      
      else if(cb)
        cb()

      else {
        log('error', 'Exececuting ...' + cmd)
        process.exit()
      }
    }
  })
}

// Catch error for each step
const step = func => cb => {
  try {
    func(cb)

  } catch (e) {
    //console.log(e)
    cb(e.message)
  }
}

const capital = t => t.split('-').reduce(
  (a, k) => a + ' ' + k.charAt(0).toUpperCase() + k.slice(1), '')

exports.createApplication = opt => {
  let appPath, _temp, appName

  const getTemplate = (template, type) => cb => {
    if (!template)
      try {
        _temp = require.resolve(`@uteamjs/template/${type}/package.json`)
        cb()
      } catch (e) {
        log('yellow', 'Please install @uteamjs/template in current folder')
        cb(e.message)
      }
    else
      try {
        _temp = require.resolve(template)
        cb()
      } catch (e) {
        try {
          _temp = require.resolve(`@uteamjs/template/${template}/package.json`)
          cb()
        } catch (e2) {
          cb(e.message)
        }
      }
  }

  //try {
  series([
    iff(!opt.application && !opt.packages, cb =>
      cb('\tNo option is specified')
    ),

    run(process.platform === "win32" ? 'cd' : 'pwd', (stdout, cb) => {
      appPath = stdout.replace('\n', '').replace('\r', '')

      module.paths.push(join(appPath, 'node_modules'))
      cb()
    }, true),

    // Create Application
    iff(opt.application, cbApplication => {
      appName = opt.application
      appPath = join(appPath, appName)

      series([
        // Default applciation 'react-application'
        getTemplate(opt.template, 'react-application'),

        lg(`creating application ... ${appName}`),

        cb => clone(_temp, appName, cb),

        cb => replaceName(appPath, appName, cb),

        // Run npm install
        cb => {
          process.stdout.write('npm install ')
          cb()
        },

        run(`cd ${appPath} && npm i`)

      ], cbApplication)
    }),

    // Add Dependency to application root package.json
    // Assume the path is under current application
    iff(opt.packages, cbPackage => series([

      step(cb => {
        // Alter pa
        const _path = join(appPath, 'packages/main/package.json')
        const json = require(_path)

        if (json.keywords.indexOf('Main') < 0)
          return cb(`Invalid file ${_path}`)

        if (!appName)
          appName = json.name

        if (!json.dependencies)
          json.dependencies = {}

        // add package dependency
        opt.packages.forEach(t =>
          json.dependencies[t] = `file:../${t}`
        )

        writeFileSync(_path, JSON.stringify(json, null, 4))

        cb()
      }),

      // Create packages
      callback => eachSeries(opt.packages, (t, cbEach) => {
        const _packagePath = join(appPath, 'packages', t)
        _temp = null

        series([

          getTemplate(opt.template, 'react-packages'),

          lg(`creating packages. ... ${t}`),

          // Clone package
          cb => clone(_temp, _packagePath, cb),

          cb => replaceName(_packagePath, t, cb),

          cb => {
            try {
              // Load YAML - replace item
              let _path = join(_packagePath, 'app.yaml')
              let file = readFileSync(_path, 'utf-8')
              const _name = capital(t)
              const _cap = _name.replace(/\s/g, '')
              const _route = 'route' + _cap

              writeFileSync(_path, file
                .replace(/__package__/g, _name)
                .replace(/__module__/g, t)
                .replace(/__routename__/g, _route)
                .replace(/__routepath__/g, t))

              // Load index then add import and routing
              _path = join(appPath, 'packages/main/src/index.js')
              file = readFileSync(_path, 'utf-8')

              if (file.indexOf(_route) < 0) {
                let m = file.match(/\/\*\*(.*)insert(.*)import(.*)\*\//)

                if (m)
                  file = file.replace(m[0],
                    `import { ${_route} } from '../../${t}'\n` + m[0])

                let n = file.match(/\/\*\*(.*)insert(.*)module(.*)\*\//)

                if (n)
                  file = file.replace(n[0], `    ${_route},\n` + n[0])

                if (m || n)
                  writeFileSync(_path, file)
              }
              cb()
            } catch (e) {

              // No app.yaml exist, ie server packages
              cb()
            }
          },

          // Generate Code
          iff('generate' in opt, run(`cd ${_packagePath} && uteam generate`))

        ], cbEach)
      }, callback),

      // npm install each package
      cb => run(`cd ${join(appPath, 'packages/main')} && npm i`)(cb)

    ], cbPackage))

  ], err => {
    if (err)
      log('error', err + ', <create> aborted!')

    process.exit()
  })

  try {
  } catch (e) {
    catchError(e)
  }
}

const catchError = e => {
  let _message = e.message || e
  const i = _message.indexOf('Require stack:')
  if (i > 0)
    _message = _message.substring(0, i)

  log('error', `Error in creating application: '${opt.application}'\n${_message}`)

  //console.log(e)
  process.exit()
}

// Remove Application ------------------------------------------------------

const readline = require("readline")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

exports.removeApplication = opt => {
  let appPath, _index, _json, _pathJson, _pathIndex

  const regImport = t => new RegExp(`(\\s*)import(\\s*){(\\s*)(\\S*)(\\s*)}(.*)${t}(.*)`, 'g')
  const regRoute = t => new RegExp(`(\\s*)${t}(\\s*),`)

  try {
    if (opt.packages)
      setTimeout(() =>
        series([

          //Get current path
          run(process.platform === "win32" ? 'cd' : 'pwd', (stdout, cb) => {
            appPath = stdout.replace('\n', '').replace('\r', '')
            module.paths.push(join(appPath, 'node_modules'))
            cb()
          }, true),

          // Load package.json
          step(cb => {
            _pathJson = join(appPath, 'packages/main/package.json')
            log('info', `Loading ... ${_pathJson}`)
            _json = require(_pathJson)
            cb()
          }),

          // Get main/src/index.js
          cb => {
            _pathIndex = join(appPath, 'packages/main/src/index.js')
            try {
              _index = readFileSync(_pathIndex, 'utf-8')
              log('info', `Loading ... ${_pathIndex}`)
              cb()
            } catch (e) {
              _index = null
              cb()
            }
          },

          // For each package
          callback => eachSeries(opt.packages, (t, cbEach) => series([

            cb => stat(join(appPath, 'packages', t), (err) =>
              cb(err ? err.message : null)),

            cb => rl.question(`Confirm to remove package '${t}'? [Y/N] `,
              isDelete => cb(isDelete !== 'Y' ? `Not confirmed, skip ... '${t}'` : null)
            ),

            // Remove folder
            step(cb => {
              const _f = join(appPath, 'packages', t)
              log('info', `Deleting folder ... ${_f}`)
              rmSync(_f, { recursive: true, force: true })
              cb()
            }),

            // Remove import and route from index 
            callback => iff(_index, cb => {
              log('info', `Removing import ... from index.js`)
              let m = regImport(t).exec(_index)

              if (m) {
                _index = _index.replace(m[0], '')

                log('info', `Removing route ... from index.js`)
                m = _index.match(regRoute(m[4]))
                _index = _index.replace(m[0], '')

              } else
                log('warn', `import statement not found!`)

              cb()
            })(callback),

            // Remove from package json
            cb => {
              if (_json.dependencies)
                delete _json.dependencies[t]
              cb()
            }

          ], err => {
            if (err)
              log('error', err.message || err)

            cbEach()
          }), callback),

          // Save 
          cb => {
            log('info', `Updating file ... ${_pathJson}`)
            writeFileSync(_pathJson, JSON.stringify(_json, null, 4))

            if (_index) {
              log('info', `Updating file ... ${_pathIndex}`)
              writeFileSync(_pathIndex, _index)
            }

            cb()
          },

          // npm i to remove package from node_modules
          lg(`Removing package from node_modules`),

          cb => run(`cd ${join(appPath, 'packages/main')} && npm i`)(cb)

        ], err => {
          if (err)
            log('error', err + ', <remove> aborted!')

          process.exit()
        }), 500)

  } catch (e) {
    catchError(e)
  }
}

const errorAbort = tp => err => {
  if (err)
    log('error', `${err} , <${tp}> aborted!`)

  process.exit()
}

exports.template = opt => setTimeout(() => {
  series([
   
    iff('update' in opt, cb => {
      const _temp = opt.update || '@uteamjs/template'

      run(`cd ${join(__dirname, '..')} && npm update ${_temp}`)(cb)
    })
  ], errorAbort('update'))
}, 500)
