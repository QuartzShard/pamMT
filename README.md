# pamMT
The physics and maths Modelling Tool, or "pamMT", is my A-Level computer science project for the 2019-2020 Academic year

It Aims to provide a simple web interface to use a simple 2d physics engine to model the kinds of solutions that often come up 
when studying mechanics at A-Level.

To 'deploy' this, should you need to, symlink or copy mongod.conf to /etc/mongod.conf and make sure you have mongodb installed and running, and copy db/* to /data/db/. For debian-based distros, the following commands should get you up and running from the repo's dir:
```shell
sudo mkdir /data/db -p
sudo cp db/* /data/db/ -r
sudo cp mongod.conf /etc/mongod.conf
sudo apt-get install mongodb nodejs
npm install 
node app.js
```
NPM install should take care of the rest of the setup. I'm using Nginx to reverse proxy ssl traffic to 8080 locally, which is uneccessary for local use but needed for web access. You can use any reverse proxy with this app, all you need to do is forward traffic on port 443 to localhost:8080 (I'd recommend not forwarding 80 or redirections 80 to 443 to force ssl/https), and make sure port(s) 443 (and 80) are visible to the net. 

