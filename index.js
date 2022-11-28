import WebSocket from "ws";
import fetch from "node-fetch";
import {exec} from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

// Set your username and password here
const username = "";
const password = "";

function epochToRelative(timestamp) {
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;
    var current = new Date().getTime();
    var elapsed = current - timestamp;

    if (elapsed < msPerMinute) {
        if (1 < Math.round(elapsed/1000)) {
            return `${Math.round(elapsed/1000)} seconds ago`; 
        } else if (Math.round(elapsed/1000) == 0) {
            return "just now";
        } else {
            return `${Math.round(elapsed/1000)} second ago`;
        }
    } else if (elapsed < msPerHour) {
        if (1 < Math.round(elapsed/msPerMinute)) {
            return `${Math.round(elapsed/msPerMinute)} minutes ago`;
        } else {
            return `${Math.round(elapsed/msPerMinute)} minute ago`;
        }  
    } else if (elapsed < msPerDay) {
        if (1 < Math.round(elapsed/msPerHour)) {
            return `${Math.round(elapsed/msPerHour)} hours ago`; 
        } else {
            return `${Math.round(elapsed/msPerHour)} hour ago`;
        }  
    } else if (elapsed < msPerMonth) {
        if (1 < Math.round(elapsed/msPerDay)) {
            return `${Math.round(elapsed/msPerDay)} days ago`;
        } else {
            return `${Math.round(elapsed/msPerDay)} day ago`;
        }
    } else if (elapsed < msPerYear) {
        if (1 < Math.round(elapsed/msPerMonth)) {
            return `${Math.round(elapsed/msPerMonth)} months ago`;
        } else {
            return `${Math.round(elapsed/msPerMonth)} month ago`;
        }
    } else {
        if (1 < elapsed/msPerYear) {
            return `${Math.round(elapsed/msPerYear)} years ago`;
        } else {
            return `${Math.round(elapsed/msPerYear)} year ago`;
        }
    }
}

async function fetchURL(url) {
    return await fetch(url).then(res => res.text());
}

function post(content, id=null) {
    if (id) {
        ws.send(JSON.stringify({"cmd": "direct", "val": {"cmd": "post_chat", "val": {"p": content, "chatid": id}}}));
    } else {
        ws.send(JSON.stringify({"cmd": "direct", "val": {"cmd": "post_home", "val": content}}));
    }
}

function postChat(content, id) {
    ws.send(JSON.stringify({"cmd": "direct", "val": {"cmd": "post_chat", "val": {"p": content, "chatid": id}}}));
}

async function connect() {
    console.log("Connected");
    ws.send('{"cmd": "direct", "val": {"cmd": "type", "val": "js"}}');
    ws.send(`{"cmd": "direct", "val": {"cmd": "ip", "val": "${await fetchURL("https://api.meower.org/ip")}"}}`);
    ws.send('{"cmd": "direct", "val": "meower"}');
    ws.send('{"cmd": "direct", "val": {"cmd": "version_chk", "val": "scratch-beta-5-r7"}}');
    ws.send(`{"cmd": "direct", "val": {"cmd": "authpswd", "val": {"username": "${username}", "pswd": "${password}"}}}`);
}

while (true) {
    const prompt = require('prompt-sync')();
    const post = prompt('Write Something...');
    setTimeout(function() {
        post(`${post}`);
    }, 1000);
}

console.log("Connecting...");
var ws = new WebSocket("wss://server.meower.org/");

ws.on("message", function message(data) {
    var messageData = JSON.parse(data);
    if (messageData.val.type === 1) {
        console.log(`${messageData.val.u}: ${messageData.val.p}`);
        if (messageData.val.post_origin === "home") {
            handlePost(messageData.val.u, messageData.val.p);
        } else {
            handlePost(messageData.val.u, messageData.val.p, messageData.val.post_origin);
        }
    } else if (messageData.val.state === 101 || messageData.val.state === 100) {
        console.log(`${messageData.val.u} is typing...`);
    } else if (messageData.cmd === "ulist") {
        console.log(`Users online: ${messageData.val.split(";").join(", ")}`);
    } else if (messageData.cmd === "statuscode") {
        if (messageData.val.startsWith("E")) {
            console.error(`Status: ${messageData.val}`);
        } else if (messageData.val.startsWith("I:100")) {
            console.log(`Status: ${messageData.val}`);
        } else {
            console.log(`Status: ${messageData.val}`);
        }
    } else if (messageData.val.cmd === "motd") {
        console.log(`MOTD: ${messageData.val.val}`);
    } else if (messageData.val.cmd === "vers") {
        console.log(`Meower Server Version: ${messageData.val.val}`);
    } else if (messageData.val.state === 1) {
        console.log(`${messageData.val.u} joined ${messageData.val.chatid}`);
    } else if (messageData.val.state === 0) {
        console.log(`${messageData.val.u} left ${messageData.val.chatid}`);
    } else if (messageData.val.mode === "auth") {
        console.log(`Logged in as "${messageData.val.payload.username}" (${messageData.val.payload.token})`);
    } else {
        console.log(`New message: ${data}`);
    }
});

setInterval(function() {
    if (ws.readyState == 1) {
        ws.send('{"cmd": "ping", "val": ""}');
    }
}, 10000);