#!/usr/bin/env node

"use strict";

const net = require("net");
const uuid4 = require("uuid/v4");

const SOCKET = "/tmp/run_container.sock";

class RunContainer {

    async getTty(body = {}) {

        return new Promise((resolve, reject) => {

            let id = uuid4();
            let socket = net.connect(SOCKET)

            socket.on('data', data => {

                data = JSON.parse(data.toString());
                if (data.error) reject(data.error);
                if (data.id === id) resolve(data.result);

            });

            socket.end(JSON.stringify({
                jsonrpc: "2.0",
                method: "get_tty",
                params: {
                    body
                },
                id,
            }));

        })

    }

    async stopContainer(body = {}) {

        return new Promise((resolve, reject) => {

            let id = uuid4();
            let socket = net.connect(SOCKET)

            socket.on('data', data => {

                data = JSON.parse(data.toString());
                if (data.error) reject(data.error);
                if (data.id === id) resolve(data.result);

            });

            socket.end(JSON.stringify({
                jsonrpc: "2.0",
                method: "stop_container",
                params: { 
                    body
                },
                id,
            }));

        })

    }

    async runContainer(body = {}) {

        return new Promise((resolve, reject) => {

            let id = uuid4();
            let socket = net.connect(SOCKET)

            socket.on('data', data => {

                data = JSON.parse(data.toString());
                if (data.error) reject(data.error);
                if (data.id === id) resolve(data.result);

            });

            socket.end(JSON.stringify({
                jsonrpc: "2.0",
                method: "run_container",
                params: { 
                    body
                },
                id,
            }));

        })

    }

}

(async _ => {

    let runc = new RunContainer(SOCKET);

    await runc.runContainer({
        name: "ac-bt",
        path: "/usr/local/jmaker/containers/ac-bt",
        rootfs: "/usr/local/jmaker/containers/ac-bt/rootfs",
        command: "sh",
        workdir: "/mnt",
        entry: "ls /dev && env && ifconfig eth0 up && dhclient eth0 &&",
        // entry: "",
        env: {
            KEY: "VALUE",
            KEY2: "VALUE2",
        },
        mounts: [
            {
                src: "/home/user",
                dst: "/mnt"
            },
        ],
        interface: "epair0b",
        rules: {
            "allow.raw_sockets": true,
            // "allow.socket_af": true,
            "allow.sysvipc": true,
            "host.hostname": "ac-bt.jmaker.container",
            // "ip4": "inherit",
            // "ip6": "inherit",
            "osrelease": "11.2-RELEASE-p4",
            "osreldate": 1102000,
            "sysvmsg": true,
            "sysvsem": true,
            "sysvshm": true,
            "persist": true,
            "vnet": "new",
            "devfs_ruleset": 4,
        }
    });

    try {
        let result = await runc.stopContainer({name: "ac-bt"});
        console.log(result);
    } catch ( error ) {
        console.log(error);
    }

    try {

        let result = await runc.getTty({ name: 'ac-bt' });
        console.log(result);

        let {input, output} = result;

        let socket_out = net.connect(output);
        let socket_in = net.connect(input);

        process.stdin.setRawMode(true);

        socket_out.on('end', _ => {
            console.log("out end");
            process.exit();
        })

        socket_out.on('end', _ => {
            console.log("in end");
            process.exit();
        })

        socket_out.on('data', data => {
            process.stdout.write(data);
        })

        process.stdin.on('data', data => {
            socket_in.write(data);
        })

    } catch (error) {

        console.log(error);

    }

})();
