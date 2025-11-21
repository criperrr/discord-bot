const fs = require("node:fs");
const path = require('path');
const usersHome = path.join(__dirname, '..', './users');

async function getGrades(apiToken, ano, userId) {
    try {

        const userToken = path.join(usersHome, `${userId}`, "auth.json");
        if (userId && fs.existsSync(userToken)) {
            const storedAuthData = JSON.parse(fs.readFileSync(userToken, 'utf-8'));

            if (ano > storedAuthData.userCurrentYear) {
                ano = storedAuthData.userCurrentYear;
            }
        }
        console.log(ano);
        const response = await fetch(`http://localhost:3000/api/nsac/grades?ano=${ano}`, {
            mode: 'cors',
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "x-api-token": apiToken,
            },
        })

        if (!response.ok) return false;

        const responseJson = await response.json();
        console.log(responseJson);
        const grades = responseJson.data;
        console.log({grades})

        if (!grades) return false;
        return grades;

    } catch (err) {
        console.log(err);
    }
}

module.exports = getGrades;