const fs = require('fs');
const path = require('path');
const login = require('./login.js');
const getGrades = require('./getGrades.js');
const { Client } = require('discord.js');

require('dotenv').config

/**@param {Client} client  */
async function checkNewGrades(client) {
    const userHome = path.join(__dirname, '..', 'users');
    const userIds = fs.readdirSync(userHome).filter(val => !val.endsWith('.json'));
    const globalGradesPath = path.join(userHome, 'globalGrades.json');
    console.log(userIds);
    let grades = null;
    let newGrades = [];
    let lastGradeIndex = 0;
    let differentGrades = [];
    for (id of userIds) {
        const authPath = path.join(userHome, id, 'auths', 'auth.json');
        const userAuth = await JSON.parse(fs.readFileSync(authPath));
        grades = await getGrades(userAuth.userAuthString);

        if (grades) break;
    }
    if(!grades){
        const auth = await getGrades(process.env.NSACEMAIL, process.env.NSACPASS); // get default user (it will be changeable in future)
        grades = await getGrades(auth);
    }
    if (grades.generalHashes) {
        const globalGradesPath = path.join(userHome, 'globalGrades.json');
        const globalGrade = await JSON.parse(fs.readFileSync(globalGradesPath))
        const globalHashes = globalGrade.hashes;


        if (globalHashes) {
            for (let i = 0; i < globalHashes.length; i++) {
                if (grades.generalHashes[i] != globalHashes[i]) {
                    differentGrades.push(i);
                    newGrades.push(grades.generalGrades[i])
                    console.log("newGrades: ");
                    console.log(newGrades);
                    for (let j = 0; j < 4; j++) {
                        if (grades.generalGrades[i].grades[j] == 0) {
                            console.log(`grades.generalGrades[${i}].grades[${j}]: ${grades.generalGrades[i].grades[j]}`)
                            lastGradeIndex = j - 1;
                            console.log("lastGradeIndex: " + lastGradeIndex)
                            break
                        }
                    }
                }
            }
        }
    }
    const gradesChannel = client.channels.cache.get(process.env.GRADES_CHANNEL_ID);
    if (differentGrades.length > 0) {
        const globalGradesSJson = JSON.stringify({ grades: grades.generalGrades, hashes: grades.generalHashes }, null, 2);
        fs.writeFileSync(globalGradesPath, globalGradesSJson);
        await gradesChannel.send('📢 **NOVAS NOTAS NO NSAC!** 🔔 @everyone', {
            allowedMentions: {
                parse: ['everyone']
            }
        });

        for (id of userIds) {
            const user = await client.users.fetch(id);
            console.log("iterating for user:" + user.username);
            const authPath = path.join(userHome, id, 'auths', 'auth.json');
            const userAuth = await JSON.parse(fs.readFileSync(authPath));
            grades = await getGrades(userAuth.userAuthString);
            console.log('grades:')
            console.log(grades);
            let message = `Olá, **${user.username}** :wave:! **Gemilão** aqui!\n\nEstou te avisando que __**saíram novas notas**__ no **NSAC**! :tada:\n\nConfira abaixo as suas notas atualizadas:`;
            if (grades) {
		let evolutionMessage = '';
                for (let i = 0; i < differentGrades.length; i++) {
                    const g = grades.userGrades[differentGrades[i]];
                    console.log(g)
                    const newGrade = g.grades[lastGradeIndex];
                    console.log("newGrade:" + newGrade);
                    // lastGradeIndex - 1 pois o lastGradeIndex aponta para o novo bimestre com nota.
                    const lastGrade = g.grades[lastGradeIndex - 1] ?? null;
                    console.log("lastGrade:" + lastGrade);
                    const classGrade = grades.generalGrades[differentGrades[i]].grades[lastGradeIndex];
                    console.log("classGrade:" + classGrade);

                    if (lastGrade !== null && lastGrade > 0) { // só calcula se houver uma nota anterior e ela for maior que zero
                        const evolution = ((newGrade - lastGrade) / lastGrade) * 100;
                        const evolutionSign = evolution >= 0 ? '🔺' : '🔻';
                        const evolutionText = evolution.toFixed(2);

                        evolutionMessage = `${evolutionSign} **Sua evolução (em %):** __${evolutionText}%__\n`;
                    } 

                    message += `\n**--- ${g.name} ---**\n`;
                    message += `🎯 **Sua Nota Atual (Bim. ${lastGradeIndex + 1}):** **__${newGrade}__**\n\n`;
                    message += `📊 **Média da Turma (Bim. ${lastGradeIndex + 1}):** __${classGrade}__\n`;
                    if (lastGrade) {
                        message += `⭐ **Sua Média Bimestral Anterior:** __${lastGrade}__\n`;
                    }
                    message += evolutionMessage;
                    message += `----------------------------\n`;

                }
                await user.send(message);
            }
            message = '## Médias Gerais Atualizadas ✅\n\nNotas que sofreram alteração (**média da Turma - __Bim. ' + (lastGradeIndex + 1) + '__**):\n';
            for (let i = 0; i < differentGrades.length; i++) {
                const g = grades.userGrades[differentGrades[i]];
                const classGrade = grades.generalGrades[differentGrades[i]].grades[lastGradeIndex];
                const lastClassGrade = grades.generalGrades[differentGrades[i]].grades[lastGradeIndex-1] ?? null;


                if (lastClassGrade !== null && lastClassGrade > 0) { // só calcula se houver uma nota anterior e ela for maior que zero
                    const evolution = ((classGrade - lastClassGrade) / lastClassGrade) * 100;
                    const evolutionSign = evolution >= 0 ? '🔺' : '🔻';
                    const evolutionText = evolution.toFixed(2);

                    evolutionMessage = `${evolutionSign} **Variação em relação ao bimestre anterior:** __${evolutionText}%__\n`;
                } 
                message += `\n**--- ${g.name} ---**\n`;
                message += `📊 **Média da turma: __${classGrade}__**\n\n`;
                if (lastClassGrade) {
                    message += `⭐ **Média bimestral anterior:** __${lastClassGrade}__\n`;
                }
                message += evolutionMessage;
                message += `----------------------------\n`;
            }
            message += '\n*Para ver suas médias pessoais e ser notificado(a) diretamente, use o comando `/login`!*';
            await gradesChannel.send(message)


        }

        return {
            newGrades: newGrades,
            newIndexes: differentGrades
        };
    } else return false;
}

module.exports = checkNewGrades;


