const fs = require("node:fs");
const path = require('path');
const usersHome = path.join(__dirname, '..', './users');

async function login(email, password, userId) {
    let apiToken = "";
    // Nota: Se userId for undefined, isso cria um caminho com "users/undefined/auth.json"
    const userToken = path.join(usersHome, `${userId}`, "auth.json");
    console.log({ userToken })

    if (userId && fs.existsSync(userToken)) {
        console.log("auths found:");
        console.log(userToken);
        console.log("Importing...");

        try {
            const storedAuthData = JSON.parse(fs.readFileSync(userToken, 'utf-8'));

            const testApiToken = storedAuthData.apiToken;

            const testTokenRequest = await fetch('http://localhost:3000/api/nsac/accounts/token-status', {
                mode: 'cors',
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "x-api-token": testApiToken,
                },
            });

            if (testTokenRequest.ok) {
                apiToken = testApiToken;
                return apiToken;
            }
        } catch (e) {
            console.error("Erro ao validar token existente:", e, " ignorando, recriando estrutura");
        }
    }

    const devLogin = await fetch("http://localhost:3000/api/auth/login", {
        mode: 'cors',
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: process.env.NSAC_API_EMAIL,
            password: process.env.NSAC_API_PASSWORD
        })
    });

    if (!devLogin.ok) throw new Error(`Dev Login falhou: ${devLogin.statusText}`);

    const jwtToken = devLogin.headers.get('authorization');
    console.log(jwtToken);

    if (!jwtToken) throw new Error("Failed to login in API (No Authorization Header).");

    const userAccount = await fetch('http://localhost:3000/api/nsac/accounts', {
        mode: 'cors',
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": jwtToken
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });
    const userAccountJson = await userAccount.json();
    console.log(userAccount)
    if (!userAccount.ok) throw new Error(`User Login falhou: ${userAccount.statusText}`);


    apiToken = userAccountJson.data?.apiToken || userAccountJson.apiToken;

    if (!apiToken) {
        console.error("Resposta da API:", userAccountJson);
        throw new Error("Failed to get the token!");
    }

    return apiToken;
}

module.exports = login;