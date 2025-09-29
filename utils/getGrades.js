const hash = require("object-hash");
const cheerio = require("cheerio");
const chunkArray = require('./chunkArray.js')
const fs = require('node:fs');
const path = require('path');
const usersHome = path.join(__dirname, '..', './users');

async function getGrades(logToken, ano) {
    const response = await fetch("http://200.145.153.1/nsac/aluno/boletim", {
        "credentials": "include",
        "headers": {
            "Cookie": logToken
        },
        "referrer": "http://200.145.153.1/nsac/login",
        "method": "GET",
        "mode": "cors"
    });


    if (!response.ok) return false;

    const boletimHtml = await response.text();

    const $ = cheerio.load(boletimHtml);
    const userCurrentYear = $('table').length; // quantidade de tabelas = ano atual (3 tabelas = 3 anos)
    const anoIndex = userCurrentYear - ano;

    const topTable = $('table')[anoIndex] ?? $('table')[0];
    const tBody = $(topTable).find('tbody tr');
    const titles = $(tBody).find('td span').text()
        .trim()
        .split('\n')
        .filter((_, i) => i % 2 == 0)
        .map(value => value.trim());

    let userGrades = $(tBody).find('td span').text()
        .trim()
        .split('\n')
        .filter((_, i) => (i + 1) % 2 == 0)
        .map(value => value.trim().replace(/[A-Za-z* ]+/g, '-'));

    let badGrades = [];
    let userArray = [];
    $(tBody).find('td').each((_, ele) => {
        if ($(ele).children().prop('tagName') != 'SPAN') {
            badGrades.push($(ele).text());
        }
    });

    userGrades.forEach((value) => {
        userArray.push(value.slice(0, -1).split('-'))
    })



    finalGrades = chunkArray(badGrades.filter((_, i) => (i % 2 == 0)), 5);
    finalGrades.forEach(val => val.pop());

    let grades = [];
    let finalUserGrades = [];
    let hashes = [];

    if (titles.length != finalGrades.length) return false;

    else {
        for (let i = 0; i < finalGrades.length; i++) {
            grades.push({
                name: titles[i],
                grades: finalGrades[i]
            })
            finalUserGrades.push({
                name: titles[i],
                grades: userArray[i]
            })
            hashes[i] = hash(grades[i]);
        }
    }

    const globalGradesPath = `${usersHome}/globalGrades.json`
    const globalGradesSJson = JSON.stringify({ grades: grades, hashes: hashes }, null, 2);

    fs.writeFileSync(globalGradesPath, globalGradesSJson);

    return {
        generalGrades: grades,
        gradesLenght: titles.length,
        generalHases: hashes,
        userGrades: finalUserGrades,
        userCurrentYear: userCurrentYear,
    }
}

module.exports = getGrades;