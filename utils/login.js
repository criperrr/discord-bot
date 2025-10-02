const cheerio = require("cheerio");
const fs = require("node:fs");
const path = require('path');
const usersHome = path.join(__dirname, '..', './users');



async function getTokens() {
    const response = await fetch('http://200.145.153.1/nsac', {
        method: 'GET'
    });

    const cookies = response.headers.getSetCookie().map((value) => value.split(';')[0]);
    const html = await response.text();
    const $ = cheerio.load(html);
    const hiddenToken = $('input[name="_token"]').val();
    return [...cookies, hiddenToken];
}

async function login(email, pass, userId) {
    let userAuth = {};

    if (userId && fs.existsSync(path.join(usersHome, userId, 'auths', 'auth.json'))) {
        const auths = path.join(usersHome, userId, 'auths', 'auth.json');
        console.log("auths found:")
        console.log(auths)
        console.log("Importing...");
        const authsContent = await fs.promises.readFile(auths, 'utf-8');
        userAuth = await JSON.parse(authsContent);
        const cookieString = userAuth.userAuthString;
        const responseTest = await fetch("http://200.145.153.1/nsac/home", {
            "credentials": "include",
            "headers": {
                "Cookie": cookieString
            },
            "method": "GET",
            "redirect": "manual"
        }); // test if server let me log in with these cookies

        console.log(responseTest);

        if (responseTest.status == 200) {
            return cookieString;
        } else {
            console.log("Error while login in. Reponse status: " + responseTest.status)
        }

    }

    if (!email || !pass) return false;

    const cookies = await getTokens()

    let xsrf = cookies[0];
    let nsaconline = cookies[1];
    let cookiesString = `${xsrf}; ${nsaconline}`;
    // console.log(cookiesString)
    const hiddenToken = cookies[2];
    const emailEncoded = encodeURIComponent(email);
    const passEncoded = encodeURIComponent(pass);
    // console.log(email, pass)
    const authString = `_token=${hiddenToken}&email=${emailEncoded}&password=${passEncoded}`

    // console.log(authString);

    const responseLogin = await fetch("http://200.145.153.1/nsac/login", {
        "credentials": "include",
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": "http://200.145.153.1/nsac/",
            "Cookie": cookiesString
        },
        "body": authString,
        "method": "POST",
        "redirect": "manual"
    });

    const newCookies = responseLogin.headers.getSetCookie();
    xsrf = newCookies[0].split(';')[0];
    nsaconline = newCookies[1].split(';')[0];
    const newCookiesString = `${xsrf}; ${nsaconline}`;


    const responseTest = await fetch("http://200.145.153.1/nsac/home", {
        "credentials": "include",
        "headers": {
            "Cookie": newCookiesString
        },
        "method": "GET",
        "redirect": "manual"
    }); // test if server let me log in

    if (responseLogin.status == 302 && responseTest.status == 200) {
        return newCookiesString;
    } else return false;
}

module.exports = login