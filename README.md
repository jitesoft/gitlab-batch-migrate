# GitLab bulk migrate

This tools is a collection of small scripts put together to migrate a rather large gitlab-ce instance to gitlab.com.
It's basically only tested "live", and seems to work okay.

Some day I might put some more time in to clean it up, but it did what I wanted it to do for now, so here it is!


## Install and Run!

Clone the project, pull the source (do whatever you feel like) and run npm install in the root! Then create the configuration.  
After configuration is set, a simple `node .` 

## How it works:

The tool uses the gitlab v4 api and the export/import functionality, so your instance/s need to be able to use those features.  
Initially it maps up all the groups that are on the instance (depending on sudo or not, it might not move all) and then
generate groups on the second instance.  
After group generation it will export each project from the `from` server and then import to the `to` server, each
job is done one after another with a sleep of a few seconds to make sure that it does not hit the rate limit.  
If it for some reason does this anyway, it will sleep for 60 seconds and retry the current project.  
Some projects might error out (to large file or similar), if that happens, the project name and id will be logged in
`out/errors.log`.  
Further on, the `out` dir will be used to create a ns-cache.json file (containing the namespace/group cache) and as a 
temp folder for downloading projects from the `from` instance.

## Config

Copy the `example-config.json` and rename it to `config.json`. The values are quite easy to understand...

```json
{
    "from": {
        "url": "https://gitlab.example.com",
        "key": "",
        "sudo": ""
    },
    "to": {
        "url": "https://gitlab.com",
        "key": "",
        "namespace": ""
    }
}
```

From is the server which you are migrating from, to is the server it's going to.  
The `key` is a users private token (with api access).  
The From clause contains a `sudo` field. In case this is set, all projects from the server will be migrated, and it have to
use a user-name (key field must be for the same user) of a admin account.  
The `to` fields `namespace` key is a namespace on the receiving server which all the projects will use as root namespace.


## Dependencies

The project uses [`axios`](https://github.com/axios/axios) (MIT) and [`form-data`](https://github.com/form-data/form-data) (MIT) as direct dependencies, 
as with all node projects, they in turn depends on a billion other projects, so be sure to do an audit or something before using the program.

## Disclaimer

Use this script at your own risk, me (nor Jitesoft) takes any responsibility for any issues with your gitlab installation, 
accounts or projects that might arise due to the usage of this application.  
As always, be sure to check the code for any type of oddities or bugs that might make you or your properties vulnerable!

## License

```text
MIT License

Copyright (c) 2020 Jitesoft

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
