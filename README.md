The [uteam CLI](https://u.team/document/cli) **Command Line Interface** is to help developers to automate the creation and deletion **React-Redux** & **Node.js** application modules and packages.

The application are base on the [@uteamjs/react](https://u.team/document/uteam-react/overview) frontend and [@uteamjs/node](https://u.team/document/uteam-node/overview) backend framework.

**uteam CLI** [generate](https://u.team/document/yaml/overview#uteam) standard JSX Code from [YAML](https://u.team/document/yaml/appyaml) definition.
# Installation
```
$ npm install -g uteam
```

# Command
[uteam CLI](https://u.team/document/cli) allows you to execute **command** with different **options** as parameters
```
$ uteam <command> [--options <params> …]
```
## Help
```
$ uteam [help]
```
The screen shows the following message:
```
uteam - CLI

  Create and generate @uteamjs applications from YAML definition.               
  Copyright © 2021 U Team, Inc.                                                 
  Please visit https://u.team for details.                                      

Usage

  $ uteam <command> [--<options> [string]] 

<command>

  create     Create Application or Packages             
  remove     Remove Packages                           
  generate   Generate React application from YAML       
  template   Template --update <name> to latest version 

<options>
  -a, --application string   Application <name> to be generated.                                           

  -p, --packages string[]    Package <names...> added to application.                                      

  -g, --generate string      Generate code after adding packages.                                          

  -t, --template string      Tempalate <path> used to create applications or packages.                      

                             Default @uteamjs/template/react-application                                           

  -h, --help                 Display this usage guide.                                                     
                             <YAML Generation>                                                        

  -y, --yaml string          YAML definition file, default app.yaml.                                       

  --component string         Component template                                                            

  --initComponent string     Init template                                                                 

  --exportComponent string   Export template                                                               

  --indexfile string         Index File template                                                           

  --update string            Upate template name                                                           

Examples

  1. Create application         $ uteam create --application my-cms          
  2. Create packages            $ cd ...your/application                     
                                $ uteam create --package my-package package2 
  3. Generate application       $ uteam generate                             
  -  with specified yaml file   $ uteam generate --yaml myApp 
```
> ### Options
>
> The options are in form of --name \<value>
> or -n \<value> where -n is the short form of --name
## Create
Create an application and/or packages with yaml code generation.
```
$ uteam create < --application <name> | --packages <name 1> <name 2> … >
[--generate]
```

- **--application**: Create [@uteamjs/react](https://u.team/document/uteam-react/overview) application with \<name>. Application is created from [@uteamjs/template](https://u.team/document/template)/**react-application** by default.
- **--packages [<name 1> …]**: Create packages under \<application> with \<name 1>, \<name 2> ...
- **--generate**: Automatically run **uteam generate** after each package created.
## Create with template
Create either application or packages from template \<name>
```
$ uteam create < --application <name> | --packages <name1> <name 2> > [--template <name>]
```
- **--template \<name>**: The system will search from the user specified template first. If not found, it will use the [@uteamjs/template](https://u.team/document/template)/\<name>
## Remove
Remove packages from applications.
```
$ uteam remove [--packages <name 1> <name 2> …]
```
ONLY **--packages** option is allowed.  If you want to remove the application, just delete the application folder from the file system.
## Generate
Generate complete **React JSX** packages from YAML.  The generation options are defined in the header section of the [YAML](https://u.team/document/yaml/appyaml) file.  Run the following command under each package folder.
```
$ uteam generate [--yaml <file>]
```
- **--yaml \<file>**: The YAML file used for code generation.
# Template
Since [@uteamjs/template](https://u.team/document/template) is installed under the uteam global location, it is hard to navigate to the installed folder to run npm to update the template.  **uteam** provides the following command to update the template to the latest version.
```
$ uteam template --update
```
# License
[MIT](LICENSE) - **uteam** installed locally for the create, update and delete of application and packages.

SasS - The Code Generation is a provided by the **cli.u.team** platform.